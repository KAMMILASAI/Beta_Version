import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './Coding.css';
import logo from '../assets/logo.png';

export default function Coding() {
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [solutions, setSolutions] = useState({});
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = sessionStorage.getItem('coding_timeLeft');
    return saved ? Number(saved) : 3600; // 60 minutes
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [showTerms, setShowTerms] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamPermission, setWebcamPermission] = useState('pending');
  const [showQuestionStatus, setShowQuestionStatus] = useState(false);
  const [theme, setTheme] = useState('dark'); // match MCQs theme handling

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const companyOrRecruiter =
    query.get('company') || query.get('recruiter') || 'SmartHire Platform';

  useEffect(() => {
    // Load coding problems
    loadProblems();
  }, []);

  useEffect(() => {
    if (examStarted) {
      // Enter fullscreen mode
      enterFullscreen();
      // Disable security features
      disableSecurityFeatures();
    }
    
    return () => {
      if (examStarted) {
        enableSecurityFeatures();
      }
    };
  }, [examStarted]);

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  // Persist timer each tick
  useEffect(() => {
    sessionStorage.setItem('coding_timeLeft', String(timeLeft));
  }, [timeLeft]);

  // Sync theme globally like MCQs
  useEffect(() => {
    const body = document.body;
    const htmlEl = document.documentElement;
    const rootEl = document.getElementById('root');
    [htmlEl, body, rootEl].forEach(el => {
      if (!el) return;
      el.classList.remove('theme-dark', 'theme-light');
      el.classList.add(`theme-${theme}`);
    });
  }, [theme]);

  const loadProblems = async () => {
    setLoading(true);
    try {
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
            technology: q.technology || tech
          };
          finalProblems = [mapped];
        }
      } catch (e) {
        // ignore, we'll use mock below
      }

      if (finalProblems.length === 0) {
        // Minimal mock fallback
        finalProblems = [
          {
            id: 1,
            title: 'Two Sum',
            difficulty: 'Easy',
            description:
              'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            examples: [
              {
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
              }
            ],
            constraints: [
              '2 <= nums.length <= 10^4',
              '-10^9 <= nums[i] <= 10^9',
              '-10^9 <= target <= 10^9'
            ],
            starterCode: {
              [language]: 'function twoSum(nums, target) {\n    // Your code here\n}'
            },
            technology: 'JavaScript'
          }
        ];
      }

      setProblems(finalProblems);
      
      // Initialize solutions with starter code
      const storageKey = `coding_solutions_${language}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSolutions(JSON.parse(saved));
      } else {
        const initialSolutions = {};
        (finalProblems || []).forEach(problem => {
          const starter = problem?.starterCode?.[language] ?? '';
          initialSolutions[problem.id] = starter;
        });
        setSolutions(initialSolutions);
        localStorage.setItem(storageKey, JSON.stringify(initialSolutions));
      }
      
    } catch (error) {
      console.error('Failed to load problems:', error);
    }
    setLoading(false);
  };

  const handleCodeChange = (problemId, code) => {
    const updated = {
      ...solutions,
      [problemId]: code
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
      setSolutions(JSON.parse(saved));
      return;
    }
    const updatedSolutions = {};
    problems.forEach(problem => {
      updatedSolutions[problem.id] = problem?.starterCode?.[newLanguage] ?? '';
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
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    
    // Hide dashboard elements
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header');
    if (sidebar) sidebar.style.display = 'none';
    if (header) header.style.display = 'none';
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    // Show dashboard elements
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header');
    if (sidebar) sidebar.style.display = 'block';
    if (header) header.style.display = 'block';
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
    
    // Request webcam permission
    await requestWebcamPermission();
  };

  const requestWebcamPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      setWebcamStream(stream);
      setWebcamPermission('granted');
      
      // Create video element for webcam preview in header
      setTimeout(() => {
        const videoElement = document.getElementById('webcam-preview-coding');
        if (videoElement && stream) {
          videoElement.srcObject = stream;
          videoElement.play();
        }
      }, 100);
      
    } catch (error) {
      console.error('Webcam permission denied:', error);
      setWebcamPermission('denied');
      alert('⚠️ Webcam access denied. The test will continue but may be monitored through other means.');
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      setWebcamPermission('pending');
    }
  };

  const getProblemStatus = () => {
    return problems.map((_, index) => ({
      problemNumber: index + 1,
      attempted: solutions[problems[index]?.id] && solutions[problems[index]?.id].trim().length > 0,
      current: index === currentProblem
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
          technology: p.technology || 'General'
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
            feedback: ''
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
    
    // Auto-close popup and exit fullscreen after 3 seconds
    setTimeout(() => {
      setShowSuccessPopup(false);
      exitFullscreen();
      setExamStarted(false);
      stopWebcam(); // Stop webcam when exam ends
    }, 3000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
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

  if (isSubmitted) {
    return (
      <div className="coding-container">
        <div className="result-state">
          <div className="result-card">
            <h2>🎉 Test Completed!</h2>
            <div className="score-display">
              <span className="score-number">{score}</span>
              <span className="score-total">/ {problems.length}</span>
            </div>
            <p>Problems solved successfully</p>
            <div className="result-details">
              <div className="detail-item">
                <span className="detail-label">Time Taken:</span>
                <span className="detail-value">{formatTime(3600 - timeLeft)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Language Used:</span>
                <span className="detail-value">{language.charAt(0).toUpperCase() + language.slice(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentProb = problems[currentProblem];

  return (
    <div className={`coding-container ${examStarted ? 'exam-mode' : ''}`}>
      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            margin: '20px'
          }}>
            <h2 style={{ color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>
              📝 Coding Test - Terms & Conditions
            </h2>
            <div style={{ color: '#374151', lineHeight: '1.6', marginBottom: '25px' }}>
              <p><strong>⚠️ Important Exam Rules:</strong></p>
              <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>• This test will run in <strong>full-screen mode</strong></li>
                <li>• <strong>Copy, paste, and text selection</strong> are disabled</li>
                <li>• <strong>Right-click and keyboard shortcuts</strong> are blocked</li>
                <li>• <strong>Developer tools</strong> (F12) are disabled</li>
                <li>• You have <strong>60 minutes</strong> to complete all problems</li>
                <li>• Your webcam may be monitored during the test</li>
                <li>• Switching tabs or applications is not allowed</li>
                <li>• The test will auto-submit when time expires</li>
              </ul>
              <p style={{ marginTop: '15px' }}>
                <strong>📋 Test Instructions:</strong>
              </p>
              <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>• Solve coding problems in your preferred language</li>
                <li>• Navigate between problems using the buttons</li>
                <li>• Your solutions are auto-saved as you type</li>
                <li>• Submit when you're ready or when time runs out</li>
              </ul>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={startExam}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 30px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                🚀 I Agree - Start Coding Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ color: '#059669', marginBottom: '15px' }}>Test Submitted Successfully!</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Your coding solutions have been submitted.<br />
              Exiting full-screen mode...
            </p>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #d1fae5',
              borderTop: '3px solid #059669',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
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
            width: '100%',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)',
            color: 'white',
            padding: '15px 25px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1000
          }}
        >
          {/* Left: branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            <img src={logo} alt="Logo" style={{ height: '28px', marginRight: '8px' }} />
            <span style={{ fontSize: '10px' }}>RECRUITER</span>
          </div>

          {/* Center: timer */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: '700',
              animation: timeLeft <= 300 ? 'pulse 2s infinite' : 'none',
              color: timeLeft <= 300 ? '#fbbf24' : 'white'
            }}
          >
            ⏱️ {formatTime(timeLeft)}
          </div>

          {/* Right: secure mode, webcam, status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              🔒 SECURE MODE
            </div>
            <div
              style={{
                width: '100px',
                height: '70px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {webcamPermission === 'granted' && webcamStream ? (
                <video
                  id="webcam-preview-coding"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '6px'
                  }}
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <>
                  <div
                    style={{
                      fontSize: '20px',
                      animation:
                        webcamPermission === 'granted' ? 'blink 1s infinite' : 'none',
                      color:
                        webcamPermission === 'granted'
                          ? '#10b981'
                          : webcamPermission === 'denied'
                          ? '#ef4444'
                          : '#fbbf24'
                    }}
                  >
                    📹
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '2px' }}>
                    {webcamPermission === 'granted'
                      ? 'LOADING'
                      : webcamPermission === 'denied'
                      ? 'DENIED'
                      : 'WEBCAM'}
                  </div>
                </>
              )}
              {webcamPermission === 'granted' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    animation: 'blink 1s infinite'
                  }}
                ></div>
              )}
            </div>
            <button
              onClick={() => setShowQuestionStatus(!showQuestionStatus)}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📊 P-Status
            </button>
          </div>
        </div>
      )}

      {/* Problem Status Panel */}
      {showQuestionStatus && examStarted && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          width: '250px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderRadius: '12px',
          padding: '15px',
          zIndex: 1001,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Problem Status</h3>
            <button
              onClick={() => setShowQuestionStatus(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {getProblemStatus().map((status, index) => (
              <div
                key={index}
                style={{
                  width: '45px',
                  height: '35px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: status.current 
                    ? '#3b82f6' 
                    : status.attempted 
                    ? '#10b981' 
                    : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentProblem(index)}
              >
                P{status.problemNumber}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '15px', fontSize: '12px', opacity: 0.8 }}>
            <div>🔵 Current Problem</div>
            <div>🟢 Code Written</div>
            <div>⚪ Not Attempted</div>
          </div>
        </div>
      )}

      <div className="coding-test" style={{
        marginTop: examStarted ? '100px' : '0',
        padding: examStarted ? '20px' : '20px'
      }}>
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
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
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
            <span>{Math.round(((currentProblem + 1) / problems.length) * 100)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentProblem + 1) / problems.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="coding-content">
          {problems.length > 0 ? (
            <div className="problem-layout">
              {/* Problem Description */}
              <div className="problem-panel">
                <div className="problem-header">
                  <h3 className="problem-title">{currentProb?.title}</h3>
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(currentProb?.difficulty) }}
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
                      <div><strong>Input:</strong> {example.input}</div>
                      <div><strong>Output:</strong> {example.output}</div>
                      {example.explanation && (
                        <div><strong>Explanation:</strong> {example.explanation}</div>
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
                <div className="editor-header">
                  <span>Code Editor ({language})</span>
                </div>
                <textarea
                  className="code-editor"
                  value={solutions[currentProb?.id] || ''}
                  onChange={(e) => handleCodeChange(currentProb?.id, e.target.value)}
                  placeholder="Write your solution here..."
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div className="no-problems">
              <p>No coding problems available. Please check back later.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {problems.length > 0 && (
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
            
            {currentProblem < problems.length - 1 ? (
              <button
                onClick={handleNext}
                className="btn-primary"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-submit"
              >
                {loading ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
