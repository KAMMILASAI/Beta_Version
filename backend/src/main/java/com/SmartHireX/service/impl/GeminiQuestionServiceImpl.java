package com.SmartHireX.service.impl;

import com.SmartHireX.dto.CodingChallenge;
import com.SmartHireX.dto.McqQuestion;
import com.SmartHireX.entity.CandidateProfile;
import com.SmartHireX.entity.User;
import com.SmartHireX.service.GeminiQuestionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GeminiQuestionServiceImpl implements GeminiQuestionService {

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    // Simple in-memory dedup cache per user for last N items
    private static final int MAX_CACHE = 200;
    private final Map<String, Deque<String>> mcqSeenByUser = new ConcurrentHashMap<>();
    private final Map<String, Deque<String>> codingSeenByUser = new ConcurrentHashMap<>();

    @Override
    public List<McqQuestion> generateMcqs(User user, CandidateProfile profile, List<String> techs, String difficulty, int count) {
        ensureApiKey();
        String userKey = safeUserKey(user);
        String prompt = buildMcqPrompt(user, profile, techs, difficulty, count);
        String responseText = callGeminiWithRetries(prompt, 2);
        List<McqQuestion> all = parseMcqs(responseText, techs, difficulty);
        // sanitize
        all = sanitizeMcqs(all, techs, difficulty);
        return dedupMcqs(userKey, all, count);
    }

    @Override
    public CodingChallenge generateCoding(User user, CandidateProfile profile, String tech, String difficulty) {
        ensureApiKey();
        String userKey = safeUserKey(user);
        String prompt = buildCodingPrompt(user, profile, tech, difficulty);
        String responseText = callGeminiWithRetries(prompt, 2);
        CodingChallenge cc = parseCoding(responseText, tech, difficulty);
        // Dedup by title
        String key = normalize(cc.getTitle());
        Deque<String> dq = codingSeenByUser.computeIfAbsent(userKey, k -> new ArrayDeque<>());
        if (dq.contains(key)) {
            // If repeated, tweak prompt slightly to force novelty
            String retry = callGeminiWithRetries(prompt + "\nEnsure a different problem title than: " + cc.getTitle() + "\nReturn ONLY valid JSON without markdown fences.", 1);
            cc = parseCoding(retry, tech, difficulty);
            key = normalize(cc.getTitle());
        }
        addToDeque(dq, key);
        return cc;
    }

    private void ensureApiKey() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key not configured (gemini.api-key)");
        }
    }

    private String buildMcqPrompt(User user, CandidateProfile profile, List<String> techs, String difficulty, int count) {
        String skills = profile != null && profile.getSkills() != null ? profile.getSkills() : "";
        String context = String.format(Locale.ROOT,
                "Generate %d unique MCQ questions for technologies: %s at %s difficulty. " +
                "Personalize for candidate skills: %s. " +
                "Strictly output ONLY JSON (no markdown) with schema: {\"questions\":[{\"question\":string,\"options\":[string,string,string,string],\"answer\":string,\"technology\":string}]}. " +
                "Ensure options array has exactly 4 items and one correct answer present in options. " +
                "Avoid repeating similar questions.",
                count, String.join(", ", techs), difficulty, skills);
        return context;
    }

    private String buildCodingPrompt(User user, CandidateProfile profile, String tech, String difficulty) {
        String skills = profile != null && profile.getSkills() != null ? profile.getSkills() : "";
        return String.format(Locale.ROOT,
                "Generate one coding challenge for technology: %s at %s difficulty. " +
                "Personalize for candidate skills: %s. " +
                "Return ONLY JSON (no markdown) with schema: {\"title\":string,\"description\":string,\"examples\":[{\"input\":string,\"output\":string}],\"constraints\":[string],\"timeComplexity\":string,\"spaceComplexity\":string,\"starter\":string,\"hints\":[string]}. " +
                "Make it interview-style and practical. Avoid problems previously generated.",
                tech, difficulty, skills);
    }

    private String callGeminiWithRetries(String prompt, int attempts) {
        RuntimeException last = null;
        for (int i = 0; i < Math.max(1, attempts); i++) {
            try {
                String p = i == 0 ? prompt : (prompt + "\nReturn ONLY JSON. Do not include any extra text or markdown fences.");
                return callGemini(p);
            } catch (RuntimeException ex) {
                last = ex;
            }
        }
        if (last != null) throw last;
        throw new RuntimeException("Gemini call failed");
    }

    private String callGemini(String prompt) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;
            Map<String, Object> payload = new HashMap<>();
            Map<String, Object> parts = new HashMap<>();
            parts.put("text", prompt);
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(parts));
            payload.put("contents", List.of(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> resp = restTemplate.postForEntity(url, entity, String.class);
            if (!resp.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Gemini API error: " + resp.getStatusCode());
            }
            String body = resp.getBody();
            if (body == null) throw new RuntimeException("Empty response from Gemini");

            // Extract text from response
            JsonNode root = mapper.readTree(body);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode textNode = candidates.get(0).path("content").path("parts");
                if (textNode.isArray() && textNode.size() > 0) {
                    JsonNode tn = textNode.get(0).path("text");
                    if (tn.isTextual()) return tn.asText();
                }
            }
            // fallback: return whole body for parser to try
            return body;
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Gemini: " + e.getMessage(), e);
        }
    }

    private List<McqQuestion> parseMcqs(String responseText, List<String> techs, String difficulty) {
        try {
            // Try parse as JSON with root.questions
            JsonNode root;
            try {
                root = mapper.readTree(responseText);
            } catch (Exception ex) {
                // Maybe responseText is markdown code block. Strip if needed.
                String cleaned = responseText
                        .replaceAll("^```json[\\r\\n]+", "")
                        .replaceAll("```[\\r\\n]*$", "")
                        .trim();
                root = mapper.readTree(cleaned);
            }
            JsonNode arr = root.path("questions");
            List<McqQuestion> out = new ArrayList<>();
            if (arr.isArray()) {
                for (JsonNode qn : arr) {
                    String q = qn.path("question").asText("");
                    List<String> options = new ArrayList<>();
                    if (qn.path("options").isArray()) {
                        for (JsonNode opt : qn.path("options")) options.add(opt.asText(""));
                    }
                    String ans = qn.path("answer").asText("");
                    String tech = qn.path("technology").asText(techs.isEmpty()?"General":techs.get(0));
                    McqQuestion mq = new McqQuestion(UUID.randomUUID().toString(), q, options, ans, tech, difficulty);
                    out.add(mq);
                }
            }
            return out;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse MCQs from Gemini: " + e.getMessage(), e);
        }
    }

    private CodingChallenge parseCoding(String responseText, String tech, String difficulty) {
        try {
            JsonNode root;
            try {
                root = mapper.readTree(responseText);
            } catch (Exception ex) {
                String cleaned = responseText
                        .replaceAll("^```json[\\r\\n]+", "")
                        .replaceAll("```[\\r\\n]*$", "")
                        .trim();
                root = mapper.readTree(cleaned);
            }
            CodingChallenge cc = new CodingChallenge();
            cc.setTechnology(tech);
            cc.setDifficulty(difficulty);
            cc.setTitle(root.path("title").asText("Coding Challenge"));
            cc.setDescription(root.path("description").asText(""));
            // examples
            List<Map<String,String>> examples = new ArrayList<>();
            if (root.path("examples").isArray()) {
                for (JsonNode ex : root.path("examples")) {
                    Map<String,String> m = new HashMap<>();
                    m.put("input", ex.path("input").asText(""));
                    m.put("output", ex.path("output").asText(""));
                    examples.add(m);
                }
            }
            cc.setExamples(examples);
            // constraints
            List<String> constraints = new ArrayList<>();
            if (root.path("constraints").isArray()) {
                for (JsonNode c : root.path("constraints")) constraints.add(c.asText(""));
            }
            cc.setConstraints(constraints);
            cc.setTimeComplexity(root.path("timeComplexity").asText(""));
            cc.setSpaceComplexity(root.path("spaceComplexity").asText(""));
            cc.setStarter(root.path("starter").asText(""));
            // hints optional
            List<String> hints = new ArrayList<>();
            if (root.path("hints").isArray()) {
                for (JsonNode h : root.path("hints")) {
                    hints.add(h.asText(""));
                }
            }
            cc.setHints(hints);
            return cc;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Coding challenge from Gemini: " + e.getMessage(), e);
        }
    }

    private List<McqQuestion> sanitizeMcqs(List<McqQuestion> list, List<String> techs, String difficulty) {
        List<McqQuestion> out = new ArrayList<>();
        for (McqQuestion q : list) {
            List<String> opts = new ArrayList<>(q.getOptions() != null ? q.getOptions() : Collections.emptyList());
            // trim to 4
            while (opts.size() > 4) opts.remove(opts.size() - 1);
            // pad to 4
            String tech = (q.getTechnology() != null && !q.getTechnology().isBlank()) ? q.getTechnology() : (techs.isEmpty()?"General":techs.get(0));
            for (int i = opts.size(); i < 4; i++) opts.add("Option " + (char)('A' + i) + " (" + tech + ")");
            // ensure answer present
            String ans = q.getAnswer();
            if (ans == null || ans.isBlank() || !opts.contains(ans)) {
                ans = opts.get(0);
            }
            McqQuestion fixed = new McqQuestion(q.getId(), q.getQuestion(), opts, ans, tech, difficulty);
            // discard empty questions
            if (fixed.getQuestion() != null && !fixed.getQuestion().isBlank()) out.add(fixed);
        }
        return out;
    }

    private List<McqQuestion> dedupMcqs(String userKey, List<McqQuestion> all, int count) {
        Deque<String> dq = mcqSeenByUser.computeIfAbsent(userKey, k -> new ArrayDeque<>());
        Set<String> seen = new HashSet<>(dq);
        List<McqQuestion> unique = all.stream()
                .filter(q -> !seen.contains(normalize(q.getQuestion())))
                .collect(Collectors.toList());
        // If not enough, keep adding from all while skipping duplicates
        List<McqQuestion> result = new ArrayList<>();
        for (McqQuestion q : unique) {
            result.add(q);
            if (result.size() >= count) break;
        }
        // Update deque
        for (McqQuestion q : result) addToDeque(dq, normalize(q.getQuestion()));
        return result;
    }

    private void addToDeque(Deque<String> dq, String key) {
        dq.addLast(key);
        if (dq.size() > MAX_CACHE) dq.removeFirst();
    }

    private String normalize(String s) { return s == null ? "" : s.toLowerCase(Locale.ROOT).trim(); }
    private String safeUserKey(User u) { return (u != null && u.getEmail()!=null) ? u.getEmail().toLowerCase(Locale.ROOT) : "anon"; }
}
