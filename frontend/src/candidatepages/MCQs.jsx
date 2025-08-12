import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MCQs.css';
import logo from '../assets/logo.png';

export default function MCQs() {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamPermission, setWebcamPermission] = useState('pending');
  const [showQuestionStatus, setShowQuestionStatus] = useState(false);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const companyOrRecruiter =
    query.get('company') || query.get('recruiter') || 'Assessment Platform';

  useEffect(() => {
    // Load MCQ questions
    loadQuestions();
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

  // Sync theme class globally (html, body, #root) for background/text
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

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  // Dynamically set CSS header height variable so toggle/sidebar sit below header
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (!containerRef.current) return;
      const h = headerRef.current ? Math.round(headerRef.current.getBoundingClientRect().height) : 0;
      containerRef.current.style.setProperty('--header-height', `${h}px`);
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    let ro;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      ro = new ResizeObserver(updateHeaderHeight);
      ro.observe(headerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (ro) ro.disconnect();
    };
  }, [examStarted]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to load MCQ questions
      // const response = await axios.get('/api/candidate/mcqs');
      // setQuestions(response.data);
      
      // Mock questions for demo
      const mockQuestions = [
        {
          id: 1,
          question: "What is the time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
          correctAnswer: 1
        },
        {
          id: 2,
          question: "Which of the following is NOT a JavaScript data type?",
          options: ["String", "Boolean", "Float", "Object"],
          correctAnswer: 2
        },
        {
          id: 3,
          question: "What does HTML stand for?",
          options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
          correctAnswer: 0
        },
        {
          id: 4,
          question: "Which CSS property is used to change the text color?",
          options: ["font-color", "text-color", "color", "foreground-color"],
          correctAnswer: 2
        },
        {
          id: 5,
          question: "What is the correct way to declare a variable in JavaScript?",
          options: ["variable x = 5;", "var x = 5;", "v x = 5;", "declare x = 5;"],
          correctAnswer: 1
        },
        {
          id: 6,
          question: "Which HTTP method is used to retrieve data from a server?",
          options: ["POST", "PUT", "GET", "DELETE"],
          correctAnswer: 2
        },
        {
          id: 7,
          question: "What is the purpose of the 'useState' hook in React?",
          options: ["To manage component state", "To handle side effects", "To optimize performance", "To create components"],
          correctAnswer: 0
        },
        {
          id: 8,
          question: "Which of the following is a NoSQL database?",
          options: ["MySQL", "PostgreSQL", "MongoDB", "SQLite"],
          correctAnswer: 2
        },
        {
          id: 9,
          question: "What does API stand for?",
          options: ["Application Programming Interface", "Advanced Programming Interface", "Application Process Interface", "Automated Programming Interface"],
          correctAnswer: 0
        },
        {
          id: 10,
          question: "Which Git command is used to create a new branch?",
          options: ["git new branch", "git create branch", "git branch", "git make branch"],
          correctAnswer: 2
        }
      ];
      
      setQuestions(mockQuestions);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
    setLoading(false);
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach(question => {
        if (selectedAnswers[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      setScore(correctAnswers);
      
      // TODO: Implement API call to submit answers
      // const response = await axios.post('/api/candidate/mcqs/submit', {
      //   answers: selectedAnswers
      // });
      // setScore(response.data.score);
      
      setIsSubmitted(true);
      setShowSuccessPopup(true);
      
      // Auto-close popup and exit fullscreen after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
        exitFullscreen();
        setExamStarted(false);
        stopWebcam(); // Stop webcam when exam ends
      }, 3000);
      
    } catch (error) {
      console.error('Failed to submit answers:', error);
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        const videoElement = document.getElementById('webcam-preview-mcq');
        if (videoElement && stream) {
          videoElement.srcObject = stream;
          videoElement.play();
        }
      }, 100);
      
    } catch (error) {
      console.error('Webcam permission denied:', error);
      setWebcamPermission('denied');
      
      // Show warning but allow test to continue
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

  const getQuestionStatus = () => {
    return questions.map((q, index) => ({
      questionNumber: index + 1,
      answered: selectedAnswers[q.id] !== undefined,
      current: index === currentQuestion
    }));
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
      // Do not force background; let CSS theme control it
      testContainer.style.background = '';
    }
    
    // Also try browser fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
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
    // Disable keyboard shortcuts and copy/paste
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
  };

  const enableSecurityFeatures = () => {
    // Re-enable keyboard shortcuts and copy/paste
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('contextmenu', handleRightClick);
    document.removeEventListener('selectstart', handleSelectStart);
    document.removeEventListener('copy', handleCopyPaste);
    document.removeEventListener('paste', handleCopyPaste);
    document.removeEventListener('cut', handleCopyPaste);
  };

  const handleKeyDown = (e) => {
    // Disable common shortcuts
    if (
      e.key === 'F12' || // Developer tools
      (e.ctrlKey && e.key === 'u') || // View source
      (e.ctrlKey && e.key === 'c') || // Copy
      (e.ctrlKey && e.key === 'v') || // Paste
      (e.ctrlKey && e.key === 'x') || // Cut
      (e.ctrlKey && e.key === 'a') || // Select all
      (e.ctrlKey && e.key === 's') || // Save
      (e.ctrlKey && e.key === 'p') || // Print
      (e.ctrlKey && e.shiftKey && e.key === 'I') || // Dev tools
      (e.ctrlKey && e.shiftKey && e.key === 'J') || // Console
      (e.ctrlKey && e.shiftKey && e.key === 'C') || // Inspect
      e.key === 'Escape' // Escape key
    ) {
      e.preventDefault();
      return false;
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    return false;
  };

  const handleSelectStart = (e) => {
    e.preventDefault();
    return false;
  };

  const handleCopyPaste = (e) => {
    e.preventDefault();
    return false;
  };

  // Terms and Conditions Screen
  if (showTerms) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f8fafc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '30px',
            color: '#1f2937'
          }}>Terms & Conditions</h2>
          
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#374151', marginBottom: '15px' }}>Exam Rules & Regulations:</h3>
            <ul style={{ color: '#6b7280', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>This is a timed examination. You have 30 minutes to complete all questions.</li>
              <li>Once started, the exam will enter full-screen mode for security.</li>
              <li>Copy, paste, and text selection are disabled during the exam.</li>
              <li>Right-click context menu is disabled.</li>
              <li>Browser shortcuts (F12, Ctrl+U, etc.) are blocked.</li>
              <li>You cannot exit full-screen mode until the exam is completed.</li>
              <li>Each question has only one correct answer.</li>
              <li>You can navigate between questions using Previous/Next buttons.</li>
              <li>Your answers are automatically saved as you select them.</li>
              <li>Click 'Submit Test' when you're done with all questions.</li>
              <li>Once submitted, you cannot change your answers.</li>
              <li>Your score will be displayed immediately after submission.</li>
            </ul>
          </div>
          
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '30px'
          }}>
            <p style={{ color: '#92400e', margin: 0, fontWeight: '500' }}>
              ⚠️ Warning: Any attempt to cheat or violate exam rules will result in automatic disqualification.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={() => window.history.back()}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onClick={startExam}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              I Agree - Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading MCQs...</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">MCQ Test Completed!</h2>
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-lg mb-4">Your Score: {score}/{questions.length}</p>
          <p className="text-gray-600">Percentage: {Math.round((score/questions.length) * 100)}%</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`mcq-test-fullscreen ${showQuestionStatus ? 'qs-open' : ''} theme-${theme}`} style={{
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            color: '#000',
            maxWidth: '400px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
            <h3 style={{ color: '#10b981', marginBottom: '15px', fontSize: '1.5rem' }}>Test Submitted Successfully!</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Your answers have been recorded.</p>
            <p style={{ color: '#374151', fontSize: '0.9rem' }}>This window will close automatically in 3 seconds...</p>
          </div>
        </div>
      )}

      {/* Custom Test Header */}
      {examStarted && (
        <div ref={headerRef} className="custom-header">
          {/* Left: Brand + Recruiter/Company */}
          <div className="header-left">
            <div className="brand-badge">SmartHireX</div>
            <div className="brand-sub">{companyOrRecruiter}</div>
          </div>

          {/* Center: Small Timer */}
          <div className="header-center">
            <div className="timer-badge" style={{
              animation: timeLeft <= 300 ? 'pulse 2s infinite' : 'none'
            }}>
              <span>⏱️</span>
              <span className="timer-text">{formatTime(timeLeft)}</span>
            </div>
            {examStarted && (
              <div className="timer-subtext">
                Question {currentQuestion + 1} of {questions.length} complete
              </div>
            )}
          </div>

          {/* Right: Webcam + Toggles */}
          <div className="header-right">
            <div className="header-right-stack">
              <div className="secure-pill">🔒 SECURE MODE</div>
              <button
                onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
                className={`theme-toggle-switch ${theme === 'light' ? 'on' : 'off'}`}
                role="switch"
                aria-checked={theme === 'light'}
                aria-label="Toggle light mode"
                title={theme === 'dark' ? 'Enable light mode' : 'Enable dark mode'}
              >
                <span className="switch-track">
                  <span className="icon left">🌙</span>
                  <span className="icon right">☀️</span>
                </span>
                <span className="switch-knob" />
              </button>
            </div>

            <div className="webcam-container">
              {webcamPermission === 'granted' && webcamStream ? (
                <video
                  id="webcam-preview-mcq"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <>
                  <div style={{
                    fontSize: '20px',
                    animation: webcamPermission === 'granted' ? 'blink 1s infinite' : 'none',
                    color: webcamPermission === 'granted' ? '#10b981' : webcamPermission === 'denied' ? '#ef4444' : '#fbbf24'
                  }}>📹</div>
                  <div style={{ fontSize: '10px', marginTop: '2px' }}>
                    {webcamPermission === 'granted' ? 'LOADING' : webcamPermission === 'denied' ? 'DENIED' : 'WEBCAM'}
                  </div>
                </>
              )}
              {webcamPermission === 'granted' && (
                <div className="webcam-indicator"></div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Floating right-center toggle for Question Status */}
      {examStarted && (
        <div
          className={`qs-toggle ${showQuestionStatus ? 'open' : ''}`}
          onClick={() => setShowQuestionStatus(!showQuestionStatus)}
          title="Question Status"
        >
          <span style={{ fontSize: '18px' }}>{showQuestionStatus ? '❯' : '❮'}</span>
        </div>
      )}

      {/* Question Status Sidebar + Overlay */}
      {examStarted && (
        <>
          <div
            className={`qs-overlay ${showQuestionStatus ? 'open' : ''}`}
            onClick={() => setShowQuestionStatus(false)}
          />
          <div className={`qs-sidebar ${showQuestionStatus ? 'open' : ''}`}>
            <div className="qs-grid">
              {getQuestionStatus().map((status, index) => (
                <div
                  key={index}
                  className="qs-item"
                  style={{
                    backgroundColor: status.current
                      ? '#3b82f6'
                      : status.answered
                      ? '#10b981'
                      : (theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.15)')
                  }}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {status.questionNumber}
                </div>
              ))}
            </div>
            <div className="qs-legend">
              <div>🔵 Current Question</div>
              <div>🟢 Answered</div>
              <div>⚪ Not Answered</div>
            </div>
          </div>
        </>
      )}
      
    <div className="mcq-content" style={{ 
      maxWidth: examStarted ? '100%' : '1000px', 
      margin: examStarted ? '0' : '0 auto', 
      padding: examStarted ? '20px' : '20px'
    }}>
      <div className="bg-white rounded-lg shadow-md">
        {/* Header - Only show if not in exam mode */}
        {!examStarted && (
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h1 className="text-xl font-semibold">MCQ Practice Test</h1>
            <div className="text-lg font-mono">⏱️ {formatTime(timeLeft)}</div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="p-4 border-b">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6 question-card">
          {questions.length > 0 ? (
            <div>
              <h3 className="question-title mb-4">
                <span className="q-badge">Q{currentQuestion + 1}</span>
                <span>{questions[currentQuestion]?.question}</span>
              </h3>
              <div className="space-y-3">
                {questions[currentQuestion]?.options?.map((option, index) => (
                  <label key={index} className="option-item">
                    <input
                      type="radio"
                      name={`question-${questions[currentQuestion].id}`}
                      value={index}
                      checked={selectedAnswers[questions[currentQuestion].id] === index}
                      onChange={() => handleAnswerSelect(questions[currentQuestion].id, index)}
                      className="w-4 h-4"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No questions available. Please check back later.</p>
            </div>
          )}
        </div>

        {/* Navigation (show here only before exam starts) */}
        {!examStarted && questions.length > 0 && (
          <div className="p-4 border-t flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              ← Previous
            </button>
            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    {/* Floating bottom-right navigation during exam */}
    {examStarted && questions.length > 0 && (
      <div className="mcq-nav-floating">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="mcq-btn btn-prev"
          title="Previous"
        >
          ← Prev
        </button>
        {currentQuestion < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="mcq-btn btn-next"
            title="Next"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mcq-btn btn-submit"
            title="Submit"
          >
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    )}
    </div>
  );
}
