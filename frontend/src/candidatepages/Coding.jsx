import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Coding.css';
import './MCQs.css';
import logo from '../assets/logo.png';

export default function Coding() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const abortRef = useRef(null);
  const navState = (location && location.state) || {};
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [solutions, setSolutions] = useState({});
  const [timerEnabled, setTimerEnabled] = useState(() => {
    const fromNav = typeof navState.timerEnabled === 'boolean' ? navState.timerEnabled : true;
    return fromNav;
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = sessionStorage.getItem('coding_timeLeft');
    if (saved) return Number(saved);
    const fromNav = navState && typeof navState.timerMinutes === 'number' ? navState.timerMinutes * 60 : null;
    if (timerEnabled) return fromNav ?? 3600; // default 60 minutes
    return 0;
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('java');
  const [showTerms, setShowTerms] = useState(false);
  const [examStarted, setExamStarted] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showQuestionStatus, setShowQuestionStatus] = useState(false);
  const [theme, setTheme] = useState('dark'); // match MCQs theme handling
  const [runOutput, setRunOutput] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const query = new URLSearchParams(location.search);
  const companyOrRecruiter =
    query.get('company') || query.get('recruiter') || 'SmartHire Platform';

  useEffect(() => {
    // Initialize timer settings from navigation
    if (typeof navState.timerEnabled === 'boolean') setTimerEnabled(navState.timerEnabled);
    // If problems are provided via navigation state, use them; otherwise load from API/mock
    if (Array.isArray(navState.problems) && navState.problems.length > 0) {
      const provided = navState.problems;
      setProblems(provided);

      // Initialize solutions for current language if not present in localStorage
      const storageKey = `coding_solutions_${language}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSolutions(JSON.parse(saved));
      } else {
        const initialSolutions = {};
        provided.forEach((p) => {
          let starter = p?.starterCode?.[language] ?? '';
          if (!starter) {
            if (language === 'python') {
              starter = `# Hello World (Python)\nprint(\"Hello, World!\")\n`;
            } else if (language === 'java') {
              starter = `// Hello World (Java)\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, World!\");\n  }\n}\n`;
            } else if (language === 'cpp') {
              starter = `// Hello World (C++)\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << \"Hello, World!\";\n  return 0;\n}\n`;
            } else if (language === 'c') {
              starter = `// Hello World (C)\n#include <stdio.h>\nint main(){\n  printf(\"Hello, World!\");\n  return 0;\n}\n`;
            }
          }
          initialSolutions[p.id] = starter;
        });
        setSolutions(initialSolutions);
        localStorage.setItem(storageKey, JSON.stringify(initialSolutions));
      }
    } else {
      // Load coding problems from API/mock
      loadProblems();
    }
  }, []);

  useEffect(() => {
    if (examStarted) {
      // Enter fullscreen mode
      enterFullscreen();
      // Disable security features
      disableSecurityFeatures();
      // Auto-open problem status sidebar for visibility
      setShowQuestionStatus(true);
    }

    return () => {
      if (examStarted) {
        enableSecurityFeatures();
      }
    };
  }, [examStarted]);

  // Simple JS sandbox runner (outside effects)
  const runUserCode = (code, inputArg) => {
    const logs = [];
    const fakeConsole = { log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')) };
    try {
      const fn = new Function('input', 'console', `${code}\n;return (typeof solution==='function') ? solution(input) : undefined;`);
      const result = fn(inputArg, fakeConsole);
      return { result, logs, error: null };
    } catch (err) {
      return { result: null, logs, error: String(err) };
    }
  };

// Cancel current run/tests
const handleCancel = () => {
  try {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  } catch (_) {}
  setIsRunning(false);
  setRunOutput((prev) => (prev ? `${prev}\nCanceled by user` : 'Canceled by user'));
};

  // Helper to call backend judge for non-JS languages with timeout/cancellation
  const judgeRun = async ({ language: lang, code, input, timeoutMs = 20000, signal }) => {
    const controller = signal ? null : new AbortController();
    const usedSignal = signal || controller?.signal;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const resp = await axios.post(
        '/api/judge',
        { language: lang, code, input },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: usedSignal,
          timeout: timeoutMs,
        }
      );
      const data = resp?.data || {};
      // Normalize common fields
      const output = data.output ?? data.stdout ?? data.result ?? '';
      const error = data.error ?? data.stderr ?? null;
      const logs = Array.isArray(data.logs) ? data.logs : [];
      return { output, error, logs };
    } catch (err) {
      const isAborted = err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED';
      const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(String(err?.message || ''));
      const msg = isAborted ? 'Request was canceled' : (isTimeout ? 'Execution timed out' : (err?.response?.data?.message || err.message || String(err)));
      return { output: '', error: msg, logs: [] };
    } finally {
      // no-op
    }
  };

  const handleRun = async () => {
    const code = solutions[currentProb?.id] || '';
    const first = currentProb?.examples?.[0];
    let input = undefined;
    if (first?.input) {
      try { input = JSON.parse(first.input); } catch { input = first.input; }
    }
    setIsRunning(true);
    try {
      // JS path retained for completeness (not selectable in UI)
      if (language === 'javascript') {
        const { result, logs, error } = runUserCode(code, input);
        if (error) {
          setRunOutput(`Error: ${error}\nLogs:\n${logs.join('\n')}`);
        } else {
          setRunOutput(`Result: ${typeof result === 'object' ? JSON.stringify(result) : String(result)}\nLogs:\n${logs.join('\n')}`);
        }
        return;
      }

      // Non-JS: call backend judge with timeout
      const controller = new AbortController();
      abortRef.current = controller;
      const { output, error, logs } = await judgeRun({ language, code, input, timeoutMs: 20000, signal: controller.signal });
      if (error) {
        setRunOutput(`Error: ${error}\nLogs:\n${(logs || []).join('\n')}`);
      } else {
        const logsText = logs && logs.length ? `\nLogs:\n${logs.join('\n')}` : '';
        setRunOutput(`Output: ${typeof output === 'object' ? JSON.stringify(output) : String(output)}${logsText}`);
      }
    } catch (e) {
      setRunOutput(`Error: ${String(e)}`);
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  };

  const handleRunTests = async () => {
    const ex = Array.isArray(currentProb?.examples) ? currentProb.examples : [];
    if (ex.length === 0) {
      setTestResults({ supported: true, total: 0, passed: 0, cases: [] });
      return;
    }
    const code = solutions[currentProb?.id] || '';
    setIsRunning(true);
    try {
      if (language === 'javascript') {
        const cases = ex.map((e, idx) => {
          let input = e.input;
          try { input = JSON.parse(e.input); } catch {/* keep raw */}
          const { result, error } = runUserCode(code, input);
          const expectedRaw = e.output;
          let pass = false;
          try {
            const expected = JSON.parse(expectedRaw);
            pass = JSON.stringify(result) === JSON.stringify(expected);
          } catch {
            pass = String(result) === String(expectedRaw);
          }
          return { idx: idx + 1, pass, got: result, expected: expectedRaw, error };
        });
        const passed = cases.filter(c => c.pass && !c.error).length;
        setTestResults({ supported: true, total: cases.length, passed, cases });
        return;
      }

      // Non-JS: call backend judge for each example with timeout
      const cases = [];
      const controller = new AbortController();
      abortRef.current = controller;
      for (let i = 0; i < ex.length; i++) {
        const e = ex[i];
        let input = e.input;
        try { input = JSON.parse(e.input); } catch {/* keep raw */}
        const { output, error } = await judgeRun({ language, code, input, timeoutMs: 20000, signal: controller.signal });
        const expectedRaw = e.output;
        let pass = false;
        if (!error) {
          try {
            const expected = JSON.parse(expectedRaw);
            pass = JSON.stringify(output) === JSON.stringify(expected);
          } catch {
            pass = String(output) === String(expectedRaw);
          }
        }
        cases.push({ idx: i + 1, pass, got: output, expected: expectedRaw, error });
        if (error === 'Request was canceled') {
          break;
        }
      }
      const passed = cases.filter(c => c.pass && !c.error).length;
      setTestResults({ supported: true, total: cases.length, passed, cases });
    } catch (e) {
      setTestResults({ supported: true, total: 0, passed: 0, cases: [], error: String(e) });
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  };

  useEffect(() => {
    // Timer countdown (only if enabled)
    if (!timerEnabled) return;
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted, timerEnabled]);

  // Persist timer each tick
  useEffect(() => {
    sessionStorage.setItem('coding_timeLeft', String(timeLeft));
  }, [timeLeft]);

  // Sync theme globally like MCQs
  useEffect(() => {
    const body = document.body;
    const htmlEl = document.documentElement;
    const rootEl = document.getElementById('root');
    [htmlEl, body, rootEl].forEach((el) => {
      if (!el) return;
      el.classList.remove('theme-dark', 'theme-light');
      el.classList.add(`theme-${theme}`);
    });
  }, [theme]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      // If navigation already provided problems, skip fetch
      if (Array.isArray(navState.problems) && navState.problems.length > 0) {
        setLoading(false);
        return;
      }
      // Try API first (AI-generated coding question), fallback to mock
      const token = localStorage.getItem('token');
      let finalProblems = [];
      try {
        // Defaults; could be enhanced to take from UI/query later
        const tech = 'JavaScript';
        const difficulty = 'Medium';
        const resp = await axios.post(
          '/api/candidate/practice/coding',
          { tech, difficulty },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const q = resp?.data;
        if (q && q.title) {
          const mapped = {
            id: Date.now(),
            title: q.title,
            difficulty: q.difficulty || difficulty,
            description: q.description || '',
            examples: Array.isArray(q.examples) ? q.examples : [],
            constraints: Array.isArray(q.constraints) ? q.constraints : [],
            starterCode: { [language]: q.starter || '' },
            technology: q.technology || tech,
          };
          finalProblems = [mapped];
        }
      } catch (e) {
        // API failed; do not use mock data, show empty state instead
      }

      setProblems(finalProblems);

      // Initialize solutions with starter code (fallback to Hello World if missing)
      const storageKey = `coding_solutions_${language}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        // Use saved but ensure empty/missing entries get Hello World fallback
        const savedObj = JSON.parse(saved);
        const filled = { ...savedObj };
        (finalProblems || []).forEach((problem) => {
          const cur = savedObj[problem.id];
          if (!cur || String(cur).trim().length === 0) {
            let starter = '';
            if (language === 'python') {
              starter = `# Hello World (Python)\nprint(\"Hello, World!\")\n`;
            } else if (language === 'java') {
              starter = `// Hello World (Java)\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, World!\");\n  }\n}\n`;
            } else if (language === 'cpp') {
              starter = `// Hello World (C++)\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << \"Hello, World!\";\n  return 0;\n}\n`;
            } else if (language === 'c') {
              starter = `// Hello World (C)\n#include <stdio.h>\nint main(){\n  printf(\"Hello, World!\");\n  return 0;\n}\n`;
            }
            filled[problem.id] = starter;
          }
        });
        setSolutions(filled);
        localStorage.setItem(storageKey, JSON.stringify(filled));
      } else {
        const initialSolutions = {};
        (finalProblems || []).forEach((problem) => {
          let starter = problem?.starterCode?.[language] ?? '';
          if (!starter) {
            if (language === 'python') {
              starter = `# Hello World (Python)\nprint(\"Hello, World!\")\n`;
            } else if (language === 'java') {
              starter = `// Hello World (Java)\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, World!\");\n  }\n}\n`;
            } else if (language === 'cpp') {
              starter = `// Hello World (C++)\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << \"Hello, World!\";\n  return 0;\n}\n`;
            } else if (language === 'c') {
              starter = `// Hello World (C)\n#include <stdio.h>\nint main(){\n  printf(\"Hello, World!\");\n  return 0;\n}\n`;
            }
          }
          initialSolutions[problem.id] = starter;
        });
        setSolutions(initialSolutions);
        localStorage.setItem(storageKey, JSON.stringify(initialSolutions));
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
      setProblems([]);
    }
    setLoading(false);
  };

  const handleCodeChange = (problemId, code) => {
    const updated = {
      ...solutions,
      [problemId]: code,
    };
    setSolutions(updated);
    const storageKey = `coding_solutions_${language}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    // Try to load saved solutions for the chosen language, else starter code
    const storageKey = `coding_solutions_${newLanguage}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      // Ensure Hello World fallback for empty/missing entries
      const savedObj = JSON.parse(saved);
      const updatedSolutions = { ...savedObj };
      problems.forEach((problem) => {
        const cur = savedObj[problem.id];
        if (!cur || String(cur).trim().length === 0) {
          let starter = '';
          if (newLanguage === 'python') {
            starter = `# Hello World (Python)\nprint(\"Hello, World!\")\n`;
          } else if (newLanguage === 'java') {
            starter = `// Hello World (Java)\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, World!\");\n  }\n}\n`;
          } else if (newLanguage === 'cpp') {
            starter = `// Hello World (C++)\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << \"Hello, World!\";\n  return 0;\n}\n`;
          } else if (newLanguage === 'c') {
            starter = `// Hello World (C)\n#include <stdio.h>\nint main(){\n  printf(\"Hello, World!\");\n  return 0;\n}\n`;
          }
          updatedSolutions[problem.id] = starter;
        }
      });
      setSolutions(updatedSolutions);
      localStorage.setItem(storageKey, JSON.stringify(updatedSolutions));
      return;
    }
    const updatedSolutions = {};
    problems.forEach((problem) => {
      let starter = problem?.starterCode?.[newLanguage] ?? '';
      if (!starter) {
        if (newLanguage === 'python') {
          starter = `# Hello World (Python)\nprint(\"Hello, World!\")\n`;
        } else if (newLanguage === 'java') {
          starter = `// Hello World (Java)\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, World!\");\n  }\n}\n`;
        } else if (newLanguage === 'cpp') {
          starter = `// Hello World (C++)\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << \"Hello, World!\";\n  return 0;\n}\n`;
        } else if (newLanguage === 'c') {
          starter = `// Hello World (C)\n#include <stdio.h>\nint main(){\n  printf(\"Hello, World!\");\n  return 0;\n}\n`;
        }
      }
      updatedSolutions[problem.id] = starter;
    });
    setSolutions(updatedSolutions);
    localStorage.setItem(storageKey, JSON.stringify(updatedSolutions));
  };

  const handleNext = () => {
    if (currentProblem < problems.length - 1) {
      setCurrentProblem(currentProblem + 1);
    }
  };

  const handlePrevious = () => {
    if (currentProblem > 0) {
      setCurrentProblem(currentProblem - 1);
    }
  };

  const enterFullscreen = () => {
    // Hide dashboard layout and show only test content
    const dashboardLayout = document.querySelector('.dashboard-layout');
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.dashboard-header');
    if (dashboardLayout) dashboardLayout.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    if (header) header.style.display = 'none';

    // Make test container full screen
    const testContainer = document.querySelector('.mcq-test-fullscreen');
    if (testContainer) {
      testContainer.style.position = 'fixed';
      testContainer.style.top = '0';
      testContainer.style.left = '0';
      testContainer.style.width = '100vw';
      testContainer.style.height = '100vh';
      testContainer.style.zIndex = '9999';
      testContainer.style.background = '';
    }

    // Skip calling browser fullscreen API automatically to avoid user-gesture errors
  };

  const exitFullscreen = () => {
    // Restore dashboard layout
    const dashboardLayout = document.querySelector('.dashboard-layout');
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.dashboard-header');
    if (dashboardLayout) dashboardLayout.style.display = '';
    if (sidebar) sidebar.style.display = '';
    if (header) header.style.display = '';

    // Reset test container styles
    const testContainer = document.querySelector('.mcq-test-fullscreen');
    if (testContainer) {
      testContainer.style.position = '';
      testContainer.style.top = '';
      testContainer.style.left = '';
      testContainer.style.width = '';
      testContainer.style.height = '';
      testContainer.style.zIndex = '';
      testContainer.style.background = '';
    }

    // Exit browser fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  const disableSecurityFeatures = () => {
    // Disable right-click
    document.addEventListener('contextmenu', preventAction);

    // Disable keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);

    // Disable copy/paste
    document.addEventListener('copy', preventAction);
    document.addEventListener('paste', preventAction);
    document.addEventListener('cut', preventAction);

    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  const enableSecurityFeatures = () => {
    document.removeEventListener('contextmenu', preventAction);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('copy', preventAction);
    document.removeEventListener('paste', preventAction);
    document.removeEventListener('cut', preventAction);

    document.body.style.userSelect = 'auto';
    document.body.style.webkitUserSelect = 'auto';
  };

  const preventAction = (e) => {
    e.preventDefault();
    return false;
  };

  const handleKeyDown = (e) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 'U') ||
      e.key === 'Escape' ||
      (e.ctrlKey && e.key === 's') ||
      (e.ctrlKey && e.key === 'S')
    ) {
      e.preventDefault();
      return false;
    }
  };

  const startExam = async () => {
    setShowTerms(false);
    setExamStarted(true);
  };

  const getProblemStatus = () => {
    return problems.map((_, index) => ({
      problemNumber: index + 1,
      attempted: solutions[problems[index]?.id] && solutions[problems[index]?.id].trim().length > 0,
      current: index === currentProblem,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simple local scoring: count non-empty answers
      const answered = Object.values(solutions).filter(
        (s) => typeof s === 'string' && s.trim().length > 0
      ).length;
      const newScore = answered;
      setScore(newScore);
      setIsSubmitted(true);

      // Persist session to backend history
      try {
        const token = localStorage.getItem('token');
        const technologies = problems.map((p) => p.technology || 'General');
        const difficulty = problems[0]?.difficulty || 'Medium';
        const totalQuestions = problems.length;
        const minutesSpent = Math.max(0, Math.round((3600 - timeLeft) / 60));
        const questionsPayload = problems.map((p) => ({
          question: p.title,
          userAnswer: solutions[p.id] || '',
          correctAnswer: null,
          isCorrect: null,
          technology: p.technology || 'General',
        }));

        await axios.post(
          '/api/candidate/practice/save-session',
          {
            type: 'coding',
            technologies,
            difficulty,
            score: newScore,
            totalQuestions,
            timeSpent: minutesSpent,
            questions: questionsPayload,
            feedback: '',
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      } catch (err) {
        console.error('Failed to save coding session:', err);
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
    setLoading(false);

    // Show success popup
    setShowSuccessPopup(true);

    // Auto-close popup, exit fullscreen and redirect after 2 seconds
    setTimeout(() => {
      setShowSuccessPopup(false);
      exitFullscreen();
      setExamStarted(false);
      navigate('/candidate/partices');
    }, 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRating = (percentage) => {
    if (percentage >= 70) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Poor';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#22c55e';
      case 'medium':
        return '#f59e0b';
      case 'hard':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading && problems.length === 0) {
    return (
      <div className="coding-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading coding problems...</p>
        </div>
      </div>
    );
  }

  // After submit, do not switch to a separate result page; keep rendering the test UI

  const currentProb = problems[currentProblem];

  // Empty state when no problems are available and not loading
  if (!loading && problems.length === 0) {
    return (
      <div className="coding-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ background: '#0b1220', border: '1px solid #1f2937', color: '#e5e7eb', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>No coding problems available</h3>
          <div style={{ color: '#9ca3af' }}>Please try again later or adjust your settings.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`coding-container ${examStarted ? 'exam-mode mcq-test-fullscreen' : ''}`}>
      {/* Terms modal removed; coding test starts immediately */}

      {/* Success Toast (non-blocking) */}
      {showSuccessPopup && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 20,
            transform: 'translateX(-50%)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: '#111827',
              padding: '12px 16px',
              borderRadius: 10,
              color: '#e5e7eb',
              minWidth: 280,
              maxWidth: 420,
              boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
              border: '1px solid #1f2937',
              textAlign: 'center',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>🎉 Submitted successfully</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Redirecting to Practice…</div>
            <div style={{ color: '#10b981', marginTop: 6, fontWeight: 700 }}>
              Score: {score}/{problems.length}
            </div>
            <div style={{ color: '#93c5fd', marginTop: 2, fontWeight: 700 }}>
              Rating: {getRating(problems.length ? Math.round((score / problems.length) * 100) : 0)}
            </div>
          </div>
        </div>
      )}

      {/* Custom Test Header - Only show during exam */}
      {examStarted && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#111827',
            borderBottom: '1px solid #1f2937',
            color: '#e5e7eb',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 4000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Coding Practice Test</h1>
            <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 6, background: '#0f172a', border: '1px solid #1f2937', color: '#93c5fd', fontSize: 11, fontWeight: 700 }}>Secure</span>
          </div>
          {timerEnabled ? (
            <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          ) : (
            <div style={{ color: '#9ca3af', fontWeight: 600 }}>No time limit</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} />
        </div>
      )}

      {/* MCQ-style Question Status: toggle handle, overlay, sidebar */}
      {examStarted && (
        <>
          <div
            className={`qs-toggle ${showQuestionStatus ? 'open' : ''}`}
            onClick={() => setShowQuestionStatus(!showQuestionStatus)}
            title="Question Status"
          >
            <span style={{ fontSize: '18px' }}>{showQuestionStatus ? '❯' : '❮'}</span>
          </div>
          <div
            className={`qs-overlay ${showQuestionStatus ? 'open' : ''}`}
            onClick={() => setShowQuestionStatus(false)}
          />
          <div className={`qs-sidebar ${showQuestionStatus ? 'open' : ''}`}>
            <div className="qs-grid">
              {getProblemStatus().map((status, index) => (
                <div
                  key={index}
                  className="qs-item"
                  style={{
                    backgroundColor: status.current
                      ? '#3b82f6'
                      : status.attempted
                      ? '#10b981'
                      : 'rgba(255,255,255,0.15)'
                  }}
                  onClick={() => setCurrentProblem(index)}
                >
                  {status.problemNumber}
                </div>
              ))}
            </div>
            <div className="qs-legend">
              <div>🔵 Current Problem</div>
              <div>🟢 Code Written</div>
              <div>⚪ Not Attempted</div>
            </div>
          </div>
        </>
      )}

      <div
        className="coding-test"
        style={{
          marginTop: examStarted ? '56px' : '0',
          padding: examStarted ? '16px' : '20px',
        }}
      >
        {/* Header - Only show if not in exam mode */}
        {!examStarted && (
          <div className="coding-header">
            <div className="header-left">
              <h1 className="header-title">Coding Practice Test</h1>
              <div className="language-selector">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="language-select"
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>
              </div>
            </div>
            <div className="header-timer">⏱️ {formatTime(timeLeft)}</div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span>Problem {currentProblem + 1} of {problems.length}</span>
            <span>
              {Math.round(((currentProblem + 1) / problems.length) * 100)}% Complete
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentProblem + 1) / problems.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="coding-content">
          {problems.length > 0 ? (
            <div className="problem-layout" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Problem Description */}
              <div className="problem-panel">
                <div className="problem-header">
                  <h3 className="problem-title">{currentProb?.title}</h3>
                  <span
                    className="difficulty-badge"
                    style={{
                      backgroundColor: getDifficultyColor(currentProb?.difficulty),
                    }}
                  >
                    {currentProb?.difficulty}
                  </span>
                </div>

                <div className="problem-description">
                  <p>{currentProb?.description}</p>
                </div>

                {/* Examples */}
                <div className="problem-section">
                  <h4>Examples:</h4>
                  {currentProb?.examples?.map((example, index) => (
                    <div key={index} className="example-block">
                      <div>
                        <strong>Input:</strong> {example.input}
                      </div>
                      <div>
                        <strong>Output:</strong> {example.output}
                      </div>
                      {example.explanation && (
                        <div>
                          <strong>Explanation:</strong> {example.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="problem-section">
                  <h4>Constraints:</h4>
                  <ul className="constraints-list">
                    {currentProb?.constraints?.map((constraint, index) => (
                      <li key={index}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Code Editor */}
              <div className="editor-panel">
                <div className="editor-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Code Editor</span>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="language-select"
                      style={{ padding: '6px 8px', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 6 }}
                    >
                      <option value="java">Java</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isRunning ? (
                      <>
                        <button onClick={handleRun} className="btn-secondary">Run</button>
                        <button onClick={handleRunTests} className="btn-primary">Run Tests</button>
                      </>
                    ) : (
                      <button onClick={handleCancel} className="btn-secondary">Cancel</button>
                    )}
                    <button onClick={handleSubmit} disabled={loading} className="btn-submit">{loading ? 'Submitting…' : 'Submit Test'}</button>
                  </div>
                </div>
                <div className="editor-body">
                  <textarea
                    className="code-editor"
                    value={solutions[currentProb?.id] || ''}
                    onChange={(e) => handleCodeChange(currentProb?.id, e.target.value)}
                    placeholder={'Write your solution here...'}
                    spellCheck={false}
                  />
                  <div className="editor-output">
                    <div className="editor-output-title">Console</div>
                    <pre className="editor-output-pre">{runOutput || '—'}</pre>
                    <div className="editor-output-title" style={{ marginTop: 12 }}>Test Results</div>
                    {testResults ? (
                      testResults.supported === false ? (
                        <div>Only JavaScript tests are supported in browser.</div>
                      ) : testResults.total === 0 ? (
                        <div>No structured examples found to run as tests.</div>
                      ) : (
                        <div>
                          <div style={{ marginBottom: 6 }}>Passed {testResults.passed} / {testResults.total}</div>
                          <div style={{ display: 'grid', gap: 6 }}>
                            {testResults.cases.map((c) => (
                              <div key={c.idx} style={{ background: c.pass && !c.error ? '#052e1a' : '#3f1d1f', border: '1px solid #1f2937', borderRadius: 6, padding: 8 }}>
                                <div style={{ fontWeight: 600 }}>Case {c.idx}: {c.pass && !c.error ? 'PASS' : 'FAIL'}</div>
                                {c.error ? <div>Error: {c.error}</div> : (
                                  <>
                                    <div>Expected: {c.expected}</div>
                                    <div>Got: {typeof c.got === 'object' ? JSON.stringify(c.got) : String(c.got)}</div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ) : (
                      <div>—</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-problems">
              <p>No coding problems available. Please check back later.</p>
            </div>
          )}
        </div>

        {/* Navigation (hidden in exam mode; floating buttons are shown there) */}
        {problems.length > 0 && !examStarted && (
          <div className="coding-navigation">
            <button
              onClick={handlePrevious}
              disabled={currentProblem === 0}
              className="btn-secondary"
            >
              ← Previous
            </button>

            <div className="nav-center">
              <span className="problem-indicator">
                Problem {currentProblem + 1} of {problems.length}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-submit"
            >
              {loading ? 'Submitting…' : 'Submit Test'}
            </button>
          </div>
        )}
      </div>

      {/* Floating bottom-right navigation (match MCQ) */}
      {problems.length > 0 && examStarted && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            display: 'flex',
            gap: 8,
            zIndex: 2100,
          }}
        >
          <button
            onClick={handlePrevious}
            disabled={currentProblem === 0}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: '#111827',
              color: '#e5e7eb',
              border: '1px solid #374151',
              opacity: currentProblem === 0 ? 0.6 : 1,
              fontSize: 12,
            }}
            title="Previous"
          >
            Prev
          </button>
          {/* Next button removed to streamline navigation */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-submit"
              style={{ fontSize: 12 }}
              title="Submit"
            >
              {loading ? 'Submitting…' : 'Submit'}
            </button>
        </div>
      )}
    </div>
  );
}
