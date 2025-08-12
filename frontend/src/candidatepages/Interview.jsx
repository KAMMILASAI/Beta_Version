import React, { useState, useEffect } from 'react';
import './Interview.css';
import logo from '../assets/logo.png';

export default function Interview() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamPermission, setWebcamPermission] = useState('pending');
  const [showQuestionStatus, setShowQuestionStatus] = useState(false);

  useEffect(() => {
    // Load interview questions
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

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to load interview questions
      // const response = await axios.get('/api/candidate/interview');
      // setQuestions(response.data);
      
      // Placeholder data for now
      const mockQuestions = [
        {
          id: 1,
          type: "behavioral",
          question: "Tell me about yourself and your background.",
          category: "Introduction",
          tips: [
            "Keep it professional and relevant to the role",
            "Highlight your key achievements",
            "Connect your experience to the job requirements"
          ],
          timeLimit: 180 // 3 minutes
        },
        {
          id: 2,
          type: "behavioral",
          question: "Describe a challenging project you worked on and how you overcame the obstacles.",
          category: "Problem Solving",
          tips: [
            "Use the STAR method (Situation, Task, Action, Result)",
            "Focus on your specific contributions",
            "Highlight the positive outcome"
          ],
          timeLimit: 240 // 4 minutes
        },
        {
          id: 3,
          type: "technical",
          question: "Explain the difference between synchronous and asynchronous programming. When would you use each?",
          category: "Technical Knowledge",
          tips: [
            "Provide clear definitions",
            "Give practical examples",
            "Discuss performance implications"
          ],
          timeLimit: 300 // 5 minutes
        },
        {
          id: 4,
          type: "behavioral",
          question: "How do you handle working under pressure and tight deadlines?",
          category: "Work Style",
          tips: [
            "Share specific strategies you use",
            "Provide a real example",
            "Show your adaptability"
          ],
          timeLimit: 180 // 3 minutes
        },
        {
          id: 5,
          type: "situational",
          question: "If you disagreed with your team lead's technical decision, how would you handle it?",
          category: "Team Collaboration",
          tips: [
            "Show respect for hierarchy",
            "Demonstrate communication skills",
            "Focus on constructive solutions"
          ],
          timeLimit: 200 // 3.5 minutes
        }
      ];
      setQuestions(mockQuestions);
      
      // Initialize answers object
      const initialAnswers = {};
      mockQuestions.forEach(question => {
        initialAnswers[question.id] = '';
      });
      setAnswers(initialAnswers);
      
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
    setLoading(false);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
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
      // TODO: Implement API call to submit answers
      // const response = await axios.post('/api/candidate/interview/submit', {
      //   answers: answers
      // });
      // setScore(response.data.score);
      
      // Mock scoring for now
      const answeredQuestions = Object.values(answers).filter(answer => answer.trim().length > 0).length;
      setScore(answeredQuestions);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit interview:', error);
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

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case 'behavioral': return '#8b5cf6';
      case 'technical': return '#06b6d4';
      case 'situational': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'behavioral': return '🧠';
      case 'technical': return '⚙️';
      case 'situational': return '🎯';
      default: return '❓';
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual recording functionality
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
        const videoElement = document.getElementById('webcam-preview-interview');
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

  const getQuestionStatus = () => {
    return questions.map((_, index) => ({
      questionNumber: index + 1,
      answered: answers[questions[index]?.id] && answers[questions[index]?.id].trim().length > 0,
      current: index === currentQuestion
    }));
  };

  if (loading) {
    return (
      <div className="interview-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading Interview Questions...</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="interview-container">
        <div className="interview-result">
          <div className="result-content">
            <h2 className="result-title">Interview Practice Completed!</h2>
            <div className="result-emoji">🎤</div>
            <p className="result-score">Questions Answered: {score}/{questions.length}</p>
            <p className="result-percentage">Completion Rate: {Math.round((score/questions.length) * 100)}%</p>
            <div className="result-feedback">
              <h3>Next Steps:</h3>
              <ul>
                <li>Review your answers and practice speaking more confidently</li>
                <li>Research common interview questions for your target role</li>
                <li>Practice the STAR method for behavioral questions</li>
                <li>Prepare specific examples from your experience</li>
              </ul>
            </div>
            <div className="result-actions">
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className={`interview-container ${examStarted ? 'exam-mode' : ''}`}>
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
              🎤 Interview Test - Terms & Conditions
            </h2>
            <div style={{ color: '#374151', lineHeight: '1.6', marginBottom: '25px' }}>
              <p><strong>⚠️ Important Exam Rules:</strong></p>
              <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>• This test will run in <strong>full-screen mode</strong></li>
                <li>• <strong>Copy, paste, and text selection</strong> are disabled</li>
                <li>• <strong>Right-click and keyboard shortcuts</strong> are blocked</li>
                <li>• <strong>Developer tools</strong> (F12) are disabled</li>
                <li>• You have <strong>45 minutes</strong> to complete all questions</li>
                <li>• Your webcam may be monitored during the test</li>
                <li>• Switching tabs or applications is not allowed</li>
                <li>• The test will auto-submit when time expires</li>
              </ul>
              <p style={{ marginTop: '15px' }}>
                <strong>📋 Interview Instructions:</strong>
              </p>
              <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>• Answer behavioral, technical, and situational questions</li>
                <li>• Use the recording feature to practice speaking</li>
                <li>• Write detailed answers in the text area</li>
                <li>• Follow the tips provided for each question</li>
              </ul>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={startExam}
                style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  padding: '12px 30px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#6d28d9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#7c3aed'}
              >
                🚀 I Agree - Start Interview Test
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
            <h2 style={{ color: '#059669', marginBottom: '15px' }}>Interview Completed Successfully!</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Your interview responses have been submitted.<br />
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
          color: 'white',
          padding: '15px 25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img 
              src={logo} 
              alt="SmartHire Logo" 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '4px'
              }}
            />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>SmartHire Platform</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Interview Assessment</div>
            </div>
            <div style={{
              width: '50px',
              height: '35px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              RECRUITER<br/>LOGO
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '700',
            animation: timeLeft <= 300 ? 'pulse 2s infinite' : 'none',
            color: timeLeft <= 300 ? '#fbbf24' : 'white'
          }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              🔒 SECURE MODE
            </div>
            <div style={{
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
            }}>
              {webcamPermission === 'granted' && webcamStream ? (
                <video
                  id="webcam-preview-interview"
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
                  <div style={{ 
                    fontSize: '20px', 
                    animation: webcamPermission === 'granted' ? 'blink 1s infinite' : 'none',
                    color: webcamPermission === 'granted' ? '#10b981' : webcamPermission === 'denied' ? '#ef4444' : '#fbbf24'
                  }}>
                    📹
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '2px' }}>
                    {webcamPermission === 'granted' ? 'LOADING' : webcamPermission === 'denied' ? 'DENIED' : 'WEBCAM'}
                  </div>
                </>
              )}
              {webcamPermission === 'granted' && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'blink 1s infinite'
                }}></div>
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
              📊 Q-Status
            </button>
          </div>
        </div>
      )}

      {/* Question Status Panel */}
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
            <h3 style={{ margin: 0, fontSize: '16px' }}>Question Status</h3>
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
            {getQuestionStatus().map((status, index) => (
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
                    : status.answered 
                    ? '#10b981' 
                    : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentQuestion(index)}
              >
                Q{status.questionNumber}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '15px', fontSize: '12px', opacity: 0.8 }}>
            <div>🔵 Current Question</div>
            <div>🟢 Answered</div>
            <div>⚪ Not Answered</div>
          </div>
        </div>
      )}

      <div className="interview-test" style={{
        marginTop: examStarted ? '100px' : '0',
        padding: examStarted ? '20px' : '20px'
      }}>
        {/* Header */}
        <div className="interview-header">
          <div className="header-left">
            <h1 className="header-title">Interview Practice Session</h1>
            <div className="session-info">
              <span className="question-count">{questions.length} Questions</span>
              <span className="session-type">Mock Interview</span>
            </div>
          </div>
          <div className="header-timer">⏱️ {formatTime(timeLeft)}</div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="interview-content">
          {questions.length > 0 ? (
            <div className="question-layout">
              {/* Question Panel */}
              <div className="question-panel">
                <div className="question-header">
                  <div className="question-meta">
                    <span 
                      className="question-type"
                      style={{ backgroundColor: getQuestionTypeColor(currentQ?.type) }}
                    >
                      {getQuestionTypeIcon(currentQ?.type)} {currentQ?.type}
                    </span>
                    <span className="question-category">{currentQ?.category}</span>
                  </div>
                  <div className="question-timer">
                    Suggested time: {Math.floor(currentQ?.timeLimit / 60)}:{(currentQ?.timeLimit % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                
                <div className="question-content">
                  <h3 className="question-text">{currentQ?.question}</h3>
                </div>

                {/* Tips Section */}
                <div className="tips-section">
                  <h4>💡 Tips for answering:</h4>
                  <ul className="tips-list">
                    {currentQ?.tips?.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Recording Controls */}
                <div className="recording-section">
                  <h4>🎙️ Practice Recording:</h4>
                  <div className="recording-controls">
                    <button 
                      className={`recording-btn ${isRecording ? 'recording' : ''}`}
                      onClick={toggleRecording}
                    >
                      {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
                    </button>
                    {isRecording && (
                      <div className="recording-indicator">
                        <span className="recording-dot"></span>
                        Recording in progress...
                      </div>
                    )}
                  </div>
                  <p className="recording-note">
                    💡 Practice speaking your answer aloud to improve your delivery and confidence.
                  </p>
                </div>
              </div>

              {/* Answer Panel */}
              <div className="answer-panel">
                <div className="answer-header">
                  <span>Your Answer</span>
                  <span className="answer-counter">
                    {answers[currentQ?.id]?.length || 0} characters
                  </span>
                </div>
                <textarea
                  className="answer-textarea"
                  value={answers[currentQ?.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ?.id, e.target.value)}
                  placeholder="Type your answer here... You can also practice speaking aloud and then summarize your key points in writing."
                />
                
                <div className="answer-tips">
                  <h5>Writing Tips:</h5>
                  <ul>
                    <li>Use bullet points for key ideas</li>
                    <li>Include specific examples and metrics</li>
                    <li>Structure your response clearly</li>
                    <li>Practice speaking this answer aloud</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-questions">
              <p>No interview questions available. Please check back later.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {questions.length > 0 && (
          <div className="interview-navigation">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="btn-secondary"
            >
              ← Previous
            </button>
            
            <div className="nav-center">
              <span className="question-indicator">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <div className="answered-indicator">
                Answered: {Object.values(answers).filter(a => a.trim().length > 0).length}/{questions.length}
              </div>
            </div>
            
            {currentQuestion < questions.length - 1 ? (
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
                {loading ? 'Submitting...' : 'Complete Interview'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
