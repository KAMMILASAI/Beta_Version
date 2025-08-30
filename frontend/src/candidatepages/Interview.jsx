import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Interview.css';
import logo from '../assets/logo.png';

export default function Interview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamPermission, setWebcamPermission] = useState('pending');
  // Typing animations
  const [questionTyping, setQuestionTyping] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const questionTypingTimerRef = useRef(null);
  // Per-question timer starts when user starts speaking
  const questionTimerRef = useRef(null);
  const [questionTimerRunning, setQuestionTimerRunning] = useState(false);
  // Chat history per question: { [questionId]: [{ role: 'ai'|'user', text: string }] }
  const [chatHistory, setChatHistory] = useState({});
  // UI: chat autoscroll
  const chatScrollRef = useRef(null);
  // Video layout: which stream is primary in the big area
  const [primaryVideo, setPrimaryVideo] = useState('interviewer'); // 'interviewer' | 'user'
  // Video refs for attaching MediaStreams
  const userBigVideoRef = useRef(null);
  const userPipVideoRef = useRef(null);
  // Removed Q-Status feature for a cleaner header

  // Auto-scroll chat to latest message/typing
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatHistory, questionTyping, liveTranscript, currentQuestion]);

  // Attach webcam stream to the correct video based on primaryVideo
  useEffect(() => {
    if (!webcamStream) return;
    try {
      if (primaryVideo === 'user') {
        if (userBigVideoRef.current) userBigVideoRef.current.srcObject = webcamStream;
        if (userPipVideoRef.current) userPipVideoRef.current.srcObject = webcamStream;
      } else {
        if (userPipVideoRef.current) userPipVideoRef.current.srcObject = webcamStream;
        if (userBigVideoRef.current) userBigVideoRef.current.srcObject = webcamStream; // keep ready if swapped
      }
    } catch (e) {
      // no-op; some browsers require a small delay
      setTimeout(() => {
        if (primaryVideo === 'user') {
          if (userBigVideoRef.current) userBigVideoRef.current.srcObject = webcamStream;
          if (userPipVideoRef.current) userPipVideoRef.current.srcObject = webcamStream;
        } else {
          if (userPipVideoRef.current) userPipVideoRef.current.srcObject = webcamStream;
          if (userBigVideoRef.current) userBigVideoRef.current.srcObject = webcamStream;
        }
      }, 50);
    }
  }, [webcamStream, primaryVideo]);

  // Helper: format seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // Helper: format timestamp to HH:MM
  const formatStamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Helper: return an icon for question type
  const getQuestionTypeIcon = (type) => {
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'technical':
        return '🧠';
      case 'behavioral':
        return '💬';
      case 'system design':
      case 'design':
        return '🛠️';
      case 'culture':
        return '🤝';
      default:
        return '❓';
    }
  };

  // Helper: return a hex color used to style badges based on question type
  const getQuestionTypeColor = (type) => {
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'technical':
        return '#3b82f6'; // blue
      case 'behavioral':
        return '#f59e0b'; // amber
      case 'system design':
      case 'design':
        return '#10b981'; // green
      case 'culture':
        return '#a855f7'; // purple
      default:
        return '#94a3b8'; // neutral slate for unknown/undefined
    }
  };

  // Load questions (mock or from navigation state) and prepare timers/tts
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const state = location.state || {};
      const incoming = Array.isArray(state.questions) ? state.questions : [];
      const qs = incoming.length > 0 ? incoming : [
        { id: 'q1', text: 'Tell me about yourself.', timeLimit: 120 },
        { id: 'q2', text: 'Describe a challenging project you worked on and your impact.', timeLimit: 120 },
        { id: 'q3', text: 'What strengths do you bring to a software engineering team?', timeLimit: 120 },
      ];
      setQuestions(qs);
      setCurrentQuestion(0);
      setQuestionTimeLeft(qs[0]?.timeLimit ?? 120);
      // Read the first question aloud; recording will auto-start after TTS ends
      if (qs[0]?.text) speak(qs[0].text);
    } catch (err) {
      console.error('Failed to load questions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load interview questions
    loadQuestions();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { enableSecurityFeatures(); } catch {}
      try { exitFullscreen(); } catch {}
      try { stopWebcam(); } catch {}
    };
  }, []);

  // (removed erroneous useEffect)

  // Text-to-Speech
  const speak = (text) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
      utter.onstart = () => {
        setIsSpeaking(true);
        // Ensure recording is not active while AI is speaking
        stopRecognition();
      };
      utter.onend = () => {
        setIsSpeaking(false);
        // Auto-start recording only after AI finishes asking the question
        if (!isRecording) {
          setTimeout(() => startRecognition(), 200);
        }
      };
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const stopSpeaking = () => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    setIsSpeaking(false);
  };

  // Auto-speak on question change then auto-start recording when speaking ends
  useEffect(() => {
    if (!examStarted) return;
    const q = questions[currentQuestion];
    if (q?.text) {
      stopSpeaking();
      speak(q.text);
      // Start one-time typing animation for question text
      try { if (questionTypingTimerRef.current) clearInterval(questionTypingTimerRef.current); } catch {}
      setQuestionTyping('');
      let i = 0;
      const text = q.text;
      questionTypingTimerRef.current = setInterval(() => {
        i += 1;
        setQuestionTyping(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(questionTypingTimerRef.current);
          questionTypingTimerRef.current = null;
          // After typing completes, persist AI message into chat history
          setChatHistory((prev) => {
            const pid = q.id;
            const existing = prev[pid] || [];
            const hasAi = existing.some((m) => m.role === 'ai' && m.text === text);
            return hasAi ? prev : { ...prev, [pid]: [...existing, { role: 'ai', text, ts: Date.now() }] };
          });
        }
      }, 25);
    }
    // stop recognition when changing question
    stopRecognition();
  }, [currentQuestion, examStarted]);

  // Initialize time for the current question but don't start timer yet
  useEffect(() => {
    if (!examStarted || questions.length === 0) return;
    const q = questions[currentQuestion];
    const initial = Number(q?.timeLimit) || 120;
    setQuestionTimeLeft(initial);
    // reset timer state
    try { if (questionTimerRef.current) clearInterval(questionTimerRef.current); } catch {}
    setQuestionTimerRunning(false);
  }, [examStarted, currentQuestion, questions.length]);

  // Start countdown when recording starts
  useEffect(() => {
    if (!examStarted) return;
    if (isRecording && !questionTimerRunning) {
      setQuestionTimerRunning(true);
      questionTimerRef.current = setInterval(() => {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            try { clearInterval(questionTimerRef.current); } catch {}
            setQuestionTimerRunning(false);
            // Stop recording and advance/submit
            stopRecognition();
            if (currentQuestion < questions.length - 1) {
              setCurrentQuestion((c) => c + 1);
            } else {
              handleSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      // cleanup interval if component rerenders with different deps
      if (!isRecording && questionTimerRunning) {
        try { clearInterval(questionTimerRef.current); } catch {}
        setQuestionTimerRunning(false);
      }
    };
  }, [examStarted, isRecording, currentQuestion, questions.length]);

  // Cleanup timers on unmount
  useEffect(() => () => {
    try { if (questionTypingTimerRef.current) clearInterval(questionTypingTimerRef.current); } catch {}
    try { if (questionTimerRef.current) clearInterval(questionTimerRef.current); } catch {}
  }, []);

  // Speech Recognition
  const ensureRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (event) => {
      let interim = '';
      const finals = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finals.push(res[0].transcript);
        else interim += res[0].transcript;
      }
      const q = questions[currentQuestion];
      if (q) {
        if (finals.length > 0) {
          const finalText = finals.join(' ').trim();
          // Append final to answers (persisted) and merge into ONE user bubble per question
          setAnswers((prev) => ({ ...prev, [q.id]: ((prev[q.id] || '') + (prev[q.id] ? ' ' : '') + finalText).trim() }));
          setChatHistory((prev) => {
            const list = prev[q.id] || [];
            const newList = [...list];
            if (newList.length > 0 && newList[newList.length - 1].role === 'user') {
              const last = { ...newList[newList.length - 1] };
              last.text = (last.text ? (last.text + ' ') : '') + finalText;
              last.ts = Date.now();
              newList[newList.length - 1] = last;
            } else {
              newList.push({ role: 'user', text: finalText, ts: Date.now() });
            }
            return { ...prev, [q.id]: newList };
          });
          setLiveTranscript('');
        } else {
          setLiveTranscript(interim);
        }
      }
    };
    rec.onerror = () => {
      setIsRecording(false);
    };
    rec.onend = () => {
      setIsRecording(false);
      setLiveTranscript('');
    };
    recognitionRef.current = rec;
    return rec;
  };

  const startRecognition = () => {
    // Do not allow starting while AI is speaking
    if (isSpeaking) {
      return;
    }
    const rec = ensureRecognition();
    if (!rec) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    try {
      rec.start();
      setIsRecording(true);
    } catch {}
  };

  const stopRecognition = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
    setIsRecording(false);
  };

  // Toggle mic recording; don't start while AI is speaking
  const toggleRecording = () => {
    if (isSpeaking) {
      // Prevent talking over the AI; user can press again after TTS
      return;
    }
    if (isRecording) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        const p = elem.requestFullscreen();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } catch (_) {
      // Ignore lack of user gesture or unsupported API
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
    try { document.body.style.overflow = 'auto'; } catch {}
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
    // First ask mic and webcam permissions with a user gesture
    await requestWebcamPermission();
    // Enter secure mode only after permissions
    disableSecurityFeatures();
    enterFullscreen();
    setExamStarted(true);
    // Lock page scroll to fixed window size during interview
    try { document.body.style.overflow = 'hidden'; } catch {}
  };

  const requestWebcamPermission = async () => {
    try {
      // Request both audio (mic) and video (webcam)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
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
      // We only needed mic permission prompt; stop audio tracks to avoid conflicts
      try { stream.getAudioTracks().forEach(t => t.stop()); } catch {}
      
    } catch (error) {
      console.error('Webcam permission denied:', error);
      setWebcamPermission('denied');
      alert('⚠️ Webcam access denied. The test will continue but may be monitored through other means.');
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (currentQuestion <= 0) return;
    stopRecognition();
    setCurrentQuestion((c) => Math.max(0, c - 1));
  };

  const handleNext = () => {
    if (currentQuestion >= questions.length - 1) return;
    stopRecognition();
    setCurrentQuestion((c) => Math.min(questions.length - 1, c + 1));
  };

  // Submit current answer manually and move next (or finish)
  const submitCurrentAnswer = () => {
    // Stop listening first
    stopRecognition();
    const q = questions[currentQuestion];
    if (q) {
      // If there is interim text, merge it into the single user bubble and answers
      const interim = (liveTranscript || '').trim();
      if (interim) {
        setAnswers((prev) => ({
          ...prev,
          [q.id]: ((prev[q.id] || '') + (prev[q.id] ? ' ' : '') + interim).trim(),
        }));
        setChatHistory((prev) => {
          const list = prev[q.id] || [];
          const newList = [...list];
          if (newList.length > 0 && newList[newList.length - 1].role === 'user') {
            const last = { ...newList[newList.length - 1] };
            last.text = (last.text ? last.text + ' ' : '') + interim;
            last.ts = Date.now();
            newList[newList.length - 1] = last;
          } else {
            newList.push({ role: 'user', text: interim, ts: Date.now() });
          }
          return { ...prev, [q.id]: newList };
        });
        setLiveTranscript('');
      }
    }

    // Move to next question or finish
    if (currentQuestion < questions.length - 1) {
      const nextIdx = currentQuestion + 1;
      setCurrentQuestion(nextIdx);
      const nq = questions[nextIdx];
      if (nq?.text) {
        // Speak next question; mic will auto-start after TTS
        setTimeout(() => speak(nq.text), 150);
      }
    } else {
      // Last question -> finalize whole interview
      handleSubmit();
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    try {
      setLoading(true);
      stopRecognition();
      stopSpeaking();
      // Compute a simple completion score (answered count)
      const answered = questions.filter((q) => (answers[q.id] || '').trim().length > 0).length;
      setScore(answered);
      setIsSubmitted(true);
      setShowSuccessPopup(true);

      // Gracefully exit fullscreen and stop webcam if active
      try { exitFullscreen(); } catch {}
      try { stopWebcam(); } catch {}

      // Hide success popup after a short delay
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } finally {
      setLoading(false);
    }
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
      {/* Permission Prompt (no terms popup) */}
      {!examStarted && (
        <div style={{
          margin: '30px auto 10px',
          maxWidth: 720,
          background: 'linear-gradient(135deg, #111827, #0b1020)',
          border: '1px solid #1f2937',
          borderRadius: 12,
          color: '#e5e7eb',
          padding: 24,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>Enable Voice & Webcam</div>
          <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>
            We need access to your microphone and camera for the voice-interactive mock interview.
          </div>
          <button
            onClick={startExam}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              padding: '10px 18px',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Allow Mic & Camera
          </button>
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

      {/* Concise Header (like MCQs) */}
      {examStarted && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          background: 'linear-gradient(135deg, #0b1020 0%, #0b1220 50%, #111827 100%)',
          color: 'white',
          padding: '15px 25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid #1f2937'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="SmartHire Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px' }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>SmartHire Platform</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Interview Assessment</div>
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: timeLeft <= 300 ? '#fbbf24' : 'white' }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>
      )}

      {/* Split screen (50/50): left video call, right chat panel */}
      {examStarted && (
        <div style={{ marginTop: '100px', padding: '16px', background: '#050810', minHeight: 'calc(100vh - 100px)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16
          }}>
            {/* Left: Video call area with swap-on-click */}
            <div style={{
              background: '#0b1220',
              border: '1px solid #1f2937',
              borderRadius: 12,
              minHeight: 520,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af'
            }}>
              {/* Mic/recording indicator */}
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: isRecording ? '#ef4444' : '#6b7280', display: 'inline-block' }} />
                <span style={{ color: '#e5e7eb', fontSize: 12 }}>{isRecording ? 'Recording' : 'Mic idle'}</span>
              </div>
              {/* Primary area: show either interviewer or user, click to swap */}
              <div
                onClick={() => setPrimaryVideo((p) => (p === 'interviewer' ? 'user' : 'interviewer'))}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {primaryVideo === 'interviewer' ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 8 }}>🧑‍💼</div>
                    <div>Interviewer video stream will appear here</div>
                  </div>
                ) : (
                  (webcamPermission === 'granted' && webcamStream) ? (
                    <video
                      ref={userBigVideoRef}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      autoPlay
                      muted
                      playsInline
                    />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 64, marginBottom: 8 }}>📷</div>
                      <div>Your camera preview</div>
                    </div>
                  )
                )}
              </div>

              {/* PiP: show the other stream, click to swap */}
              {primaryVideo === 'interviewer' ? (
                <div
                  onClick={() => setPrimaryVideo('user')}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 220,
                    height: 140,
                    borderRadius: 10,
                    border: '2px solid #1f2937',
                    overflow: 'hidden',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                    background: '#0b1220',
                    cursor: 'pointer'
                  }}
                >
                  {webcamPermission === 'granted' && webcamStream ? (
                    <video
                      ref={userPipVideoRef}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      autoPlay
                      muted
                      playsInline
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Your camera preview</div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => setPrimaryVideo('interviewer')}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 220,
                    height: 140,
                    borderRadius: 10,
                    border: '2px solid #1f2937',
                    overflow: 'hidden',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                    background: '#0b1220',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🧑‍💼</div>
                    <div style={{ fontSize: 12 }}>Interviewer</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Chat panel */}
            <div style={{
              background: '#0b1220',
              border: '1px solid #1f2937',
              borderRadius: 12,
              minHeight: 520,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid #1f2937',
                color: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isSpeaking ? '#60a5fa' : (isRecording ? '#34d399' : '#6b7280'),
                    display: 'inline-block'
                  }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {isSpeaking ? 'Speaking: Interviewer' : (isRecording ? 'Speaking: You' : 'Speaking: Idle')}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                  Time left for this question: <span style={{ fontWeight: 700 }}>{formatTime(questionTimeLeft)}</span>
                </div>
              </div>
              <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(() => {
                  const q = questions[currentQuestion];
                  const items = (q && chatHistory[q.id]) ? chatHistory[q.id] : [];
                  return (
                    <>
                      {/* AI typing bubble when typing is in progress (always show if typing text exists) */}
                      {questionTyping && (
                        <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 10, padding: '10px 12px', color: '#e5e7eb', fontSize: 14, lineHeight: 1.5 }}>
                            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Interviewer</div>
                            {questionTyping}
                            <span style={{ marginLeft: 2, opacity: 0.8, animation: 'blink 1s infinite' }}>|</span>
                          </div>
                        </div>
                      )}

                      {/* Persisted chat history */}
                      {items.map((m, idx) => (
                        <div key={idx} style={{ alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                          <div style={{
                            background: m.role === 'ai' ? '#111827' : '#0b3b2e',
                            border: m.role === 'ai' ? '1px solid #374151' : '1px solid #115e59',
                            borderRadius: 10,
                            padding: '10px 12px',
                            color: '#e5e7eb',
                            fontSize: 14,
                            lineHeight: 1.5
                          }}>
                            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, display: 'flex', justifyContent: m.role === 'ai' ? 'space-between' : 'space-between' }}>
                              <span>{m.role === 'ai' ? 'Interviewer' : 'You'}</span>
                              <span style={{ opacity: 0.7 }}>{formatStamp(m.ts)}</span>
                            </div>
                            {m.text}
                          </div>
                        </div>
                      ))}

                      {/* Live interim transcript as a temporary bubble with typing cursor */}
                      {liveTranscript && (
                        <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                          <div style={{ background: '#0b3b2e', border: '1px solid #115e59', borderRadius: 10, padding: '10px 12px', color: '#e5e7eb', fontSize: 14, lineHeight: 1.5 }}>
                            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                              <span>You (speaking)</span>
                              <span style={{ opacity: 0.7 }}>{formatStamp(Date.now())}</span>
                            </div>
                            {liveTranscript}
                            <span style={{ marginLeft: 2, opacity: 0.8, animation: 'blink 1s infinite' }}>|</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ color: '#9ca3af', fontSize: 12 }}>Voice-only. Speak to answer. Recording starts after AI finishes speaking.</div>
                <button onClick={submitCurrentAnswer} style={{
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  {currentQuestion < (questions.length - 1) ? 'Submit Answer' : 'Finish Interview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
