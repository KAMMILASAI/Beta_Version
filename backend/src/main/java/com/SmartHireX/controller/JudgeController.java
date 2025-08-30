package com.SmartHireX.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;

@RestController
public class JudgeController {

    @PostMapping("/judge")
    public ResponseEntity<?> judge(@RequestBody Map<String, Object> body) {
        String language = String.valueOf(body.getOrDefault("language", ""));
        String code = String.valueOf(body.getOrDefault("code", ""));
        Object inputObj = body.get("input");
        String input = inputObj == null ? "" : (inputObj instanceof String ? (String) inputObj : String.valueOf(inputObj));

        Map<String, Object> res = new HashMap<>();
        res.put("language", language);

        if (code == null || code.trim().isEmpty()) {
            res.put("output", "");
            res.put("stderr", "");
            res.put("error", "No code provided");
            res.put("logs", List.of());
            return ResponseEntity.badRequest().body(res);
        }

        try {
            ExecResult r = execute(language.toLowerCase(Locale.ROOT), code, input, 10, TimeUnit.SECONDS);
            res.put("output", r.stdout);
            res.put("stderr", r.stderr);
            res.put("error", r.errorMessage);
            res.put("logs", r.logs);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("output", "");
            res.put("stderr", "");
            res.put("error", e.getMessage());
            res.put("logs", List.of());
            return ResponseEntity.status(500).body(res);
        }
    }

    static class ExecResult {
        String stdout;
        String stderr;
        String errorMessage; // null if success
        List<String> logs = new ArrayList<>();
    }

    private ExecResult execute(String lang, String code, String input, long timeout, TimeUnit unit) throws Exception {
        ExecResult result = new ExecResult();
        Path tempDir = Files.createTempDirectory("judge-");
        result.logs.add("TempDir: " + tempDir);
        try {
            switch (lang) {
                case "java":
                    return runJava(tempDir, code, input, timeout, unit, result);
                case "python":
                    return runPython(tempDir, code, input, timeout, unit, result);
                case "cpp":
                    return runCpp(tempDir, code, input, timeout, unit, result);
                case "c":
                    return runC(tempDir, code, input, timeout, unit, result);
                default:
                    result.errorMessage = "Unsupported language: " + lang;
                    return result;
            }
        } finally {
            // Cleanup temp dir
            try {
                Files.walk(tempDir)
                        .sorted(Comparator.reverseOrder())
                        .forEach(p -> {
                            try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                        });
            } catch (IOException ignored) {}
        }
    }

    private ExecResult runJava(Path dir, String code, String input, long timeout, TimeUnit unit, ExecResult res) throws Exception {
        // Expect class Main with main method
        Path file = dir.resolve("Main.java");
        Files.writeString(file, code, StandardCharsets.UTF_8);
        res.logs.add("javac Main.java");
        ExecResult compile = runProcess(List.of("javac", "Main.java"), dir, null, timeout, unit);
        if (compile.errorMessage != null || (compile.stderr != null && !compile.stderr.isBlank())) {
            return compile;
        }
        res.logs.add("java Main");
        return runProcess(javaCmd(), dir, input, timeout, unit);
    }

    private List<String> javaCmd() {
        // On Windows, 'java' should be on PATH if JDK/JRE installed
        return List.of("java", "Main");
    }

    private ExecResult runPython(Path dir, String code, String input, long timeout, TimeUnit unit, ExecResult res) throws Exception {
        Path file = dir.resolve("main.py");
        Files.writeString(file, code, StandardCharsets.UTF_8);
        // Try python3 then python
        ExecResult r = runProcess(List.of("python", "main.py"), dir, input, timeout, unit);
        if (r.errorMessage != null && r.errorMessage.toLowerCase(Locale.ROOT).contains("cannot run program")) {
            return runProcess(List.of("python3", "main.py"), dir, input, timeout, unit);
        }
        return r;
    }

    private ExecResult runCpp(Path dir, String code, String input, long timeout, TimeUnit unit, ExecResult res) throws Exception {
        Path src = dir.resolve("main.cpp");
        Files.writeString(src, code, StandardCharsets.UTF_8);
        Path exe = dir.resolve("a.exe"); // Windows; on *nix it's typically a.out
        ExecResult compile = runProcess(List.of("g++", "-O2", "-std=c++17", "main.cpp", "-o", exe.toString()), dir, null, timeout, unit);
        if (compile.errorMessage != null || (compile.stderr != null && !compile.stderr.isBlank())) {
            return compile;
        }
        return runProcess(List.of(exe.toString()), dir, input, timeout, unit);
    }

    private ExecResult runC(Path dir, String code, String input, long timeout, TimeUnit unit, ExecResult res) throws Exception {
        Path src = dir.resolve("main.c");
        Files.writeString(src, code, StandardCharsets.UTF_8);
        Path exe = dir.resolve("a.exe");
        ExecResult compile = runProcess(List.of("gcc", "-O2", "main.c", "-o", exe.toString()), dir, null, timeout, unit);
        if (compile.errorMessage != null || (compile.stderr != null && !compile.stderr.isBlank())) {
            return compile;
        }
        return runProcess(List.of(exe.toString()), dir, input, timeout, unit);
    }

    private ExecResult runProcess(List<String> command, Path workDir, String input, long timeout, TimeUnit unit) {
        ExecResult res = new ExecResult();
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workDir.toFile());
        pb.redirectErrorStream(false);
        try {
            Process p = pb.start();

            // Feed input
            if (input != null) {
                try (OutputStream os = p.getOutputStream()) {
                    os.write(input.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                } catch (IOException ignored) {}
            }

            // Capture stdout/stderr concurrently
            Future<String> outF = Executors.newSingleThreadExecutor().submit(() -> readAll(p.getInputStream()));
            Future<String> errF = Executors.newSingleThreadExecutor().submit(() -> readAll(p.getErrorStream()));

            boolean finished = p.waitFor(timeout, unit);
            if (!finished) {
                p.destroyForcibly();
                res.stdout = safeGet(outF);
                res.stderr = safeGet(errF);
                res.errorMessage = "Execution timed out";
                return res;
            }

            res.stdout = safeGet(outF);
            res.stderr = safeGet(errF);
            res.errorMessage = null;
            return res;
        } catch (IOException e) {
            res.stdout = "";
            res.stderr = "";
            res.errorMessage = e.getMessage();
            return res;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            res.stdout = "";
            res.stderr = "";
            res.errorMessage = "Execution interrupted";
            return res;
        }
    }

    private static String readAll(InputStream is) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            boolean first = true;
            while ((line = br.readLine()) != null) {
                if (!first) sb.append('\n');
                sb.append(line);
                first = false;
            }
            return sb.toString();
        } catch (IOException e) {
            return "";
        }
    }

    private static String safeGet(Future<String> f) {
        try {
            return f.get(100, TimeUnit.MILLISECONDS);
        } catch (Exception ignored) {
            return "";
        }
    }
}
