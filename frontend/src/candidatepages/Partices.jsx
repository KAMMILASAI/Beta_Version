import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiClock, FiTrendingUp, FiAward, FiBook, FiCode, FiMic, FiArchive, FiX, FiCheck, FiAlertCircle, FiUpload } from 'react-icons/fi';
import './Partices.css';

const DIFFICULTY = ["Low", "Medium", "High"];
const POPULAR_TECHS = [
  // Web/Programming
  'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C', 'C++', 'Go', 'TypeScript',
  'HTML', 'CSS', 'Angular', 'Vue.js', 'Next.js', 'Express.js', 'MongoDB', 'SQL', 'PostgreSQL',
  'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'REST API', 'GraphQL', 'Redux',
  
  // Core CS subjects
  'Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'OOP', 'Software Engineering', 'System Design', 'Discrete Mathematics',

  // Core Engineering subjects
  'Digital Electronics', 'Analog Electronics', 'Electrical Circuits', 'Electrical Machines',
  'Signals and Systems', 'Control Systems', 'Power Systems',
  'Thermodynamics', 'Strength of Materials', 'Manufacturing', 'Fluid Mechanics', 'Heat Transfer', 'Machine Design',
  'Civil Structures', 'Geotechnical Engineering', 'Surveying', 'Transportation Engineering', 'Environmental Engineering'
];

// Safe date-time formatting for backend timestamps (supports 'created_at')
function formatDateTime(input) {
  try {
    if (!input) return '';
    if (input instanceof Date && !isNaN(input)) return input.toLocaleString();
    // If numeric epoch
    if (typeof input === 'number') {
      const d = new Date(input > 1e12 ? input : input * 1000);
      return isNaN(d) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    }
    let str = String(input).trim();
    // Handle comma-separated components: YYYY,MM,DD,HH,mm,ss,ns/ms
    if (/^\d{4},\d{1,2},\d{1,2}(,\d{1,2},\d{1,2}(,\d{1,2}(,\d{1,9})?)?)?$/.test(str)) {
      const parts = str.split(',').map(n => parseInt(n, 10));
      const [y, m, d, hh = 0, mm = 0, ss = 0, frac = 0] = parts;
      // If last part looks like nanoseconds (>= 1e6), convert to ms
      const ms = frac >= 1e6 ? Math.floor(frac / 1e6) : frac; // supports micro/nano
      const dt = new Date(y, (m || 1) - 1, d || 1, hh, mm, ss, ms);
      if (!isNaN(dt)) {
        return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(dt);
      }
    }
    // Replace space between date and time with 'T' if present
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
      str = str.replace(' ', 'T');
    }
    // Normalize fractional seconds to milliseconds but keep timezone suffix (Z or ±HH:MM)
    const rx = /^(.*T\d{2}:\d{2}:\d{2})(\.(\d+))?(Z|[+-]\d{2}:?\d{2})?$/;
    const m = str.match(rx);
    if (m) {
      const base = m[1];
      const fraction = m[3] ? `.${m[3].slice(0, 3)}` : '';
      let tz = m[4] || '';
      // Ensure timezone has colon if missing (e.g., +0530 -> +05:30)
      if (/^[+-]\d{4}$/.test(tz)) {
        tz = tz.slice(0, 3) + ':' + tz.slice(3);
      }
      str = base + fraction + tz;
    }
    const d = new Date(str);
    if (isNaN(d)) {
      // Fallback: try only date part
      const onlyDate = str.split('T')[0];
      const d2 = new Date(onlyDate);
      return isNaN(d2)
        ? String(input)
        : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d2);
    }
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return String(input || '');
  }
}

export default function Partices() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [historyStats, setHistoryStats] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [startTime, setStartTime] = useState(null);
  
  // MCQ States
  const [mcqDialog, setMcqDialog] = useState(false);
  const [mcqInput, setMcqInput] = useState({ tech: '', num: 5, difficulty: 'Medium' });
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [mcqStarted, setMcqStarted] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState([]);
  const [mcqScore, setMcqScore] = useState(null);
  // MCQ Timer
  const [mcqTimerEnabled, setMcqTimerEnabled] = useState(false);
  const [mcqTimerMinutes, setMcqTimerMinutes] = useState(10);
  
  // Coding States
  const [codingDialog, setCodingDialog] = useState(false);
  const [codingInput, setCodingInput] = useState({ tech: '', difficulty: 'Medium', num: 1 });
  const [codingLoading, setCodingLoading] = useState(false);
  const [codingQ, setCodingQ] = useState(null);
  const [codingAns, setCodingAns] = useState('');
  const [codingScore, setCodingScore] = useState(null);
  // Coding Timer
  const [codingTimerEnabled, setCodingTimerEnabled] = useState(false);
  const [codingTimerMinutes, setCodingTimerMinutes] = useState(30);

  // Interview States
  const [interviewDialog, setInterviewDialog] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewInput, setInterviewInput] = useState({
    type: 'technology', // 'technology' | 'project'
    tech: '',
    projectSummary: '',
    num: 5,
    difficulty: 'Medium',
    resumeFile: null,
    resumeText: ''
  });

  // Load practice history
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError('');
      const token = localStorage.getItem('token');
      let currentUser = null;
      try { currentUser = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
      const res = await axios.get('http://localhost:8080/api/candidate/practice/history?limit=25', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res?.data;
      // Accept {sessions:[...]}, or array directly, or fallback key names
      const sessions = Array.isArray(data)
        ? data
        : (data?.sessions || data?.items || []);
      const stats = data?.stats || [];
      const uid = currentUser?.id || currentUser?._id || currentUser?.userId || currentUser?.user?.id;
      const filtered = (Array.isArray(sessions) ? sessions : []).filter(s => {
        // Must be an object
        if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
        // If server provides ownership, enforce it
        const owner = s.candidateId ?? s.candidate_id ?? s.userId ?? s.user_id ?? s.ownerId;
        if (uid && owner != null && String(owner) !== String(uid)) return false;
        // Require at least one realistic session trait
        const hasQuestions = Array.isArray(s.questions) && s.questions.length > 0;
        const hasTechs = Array.isArray(s.technologies) && s.technologies.length > 0;
        const hasCompleted = typeof s.completed === 'boolean';
        const hasTotals = typeof s.totalQuestions === 'number' && s.totalQuestions >= 1;
        const ts = s.created_at || s.createdAt || s.startedAt || s.timestamp;
        const tsOk = !!formatDateTime(ts);
        return hasQuestions || hasTechs || hasCompleted || hasTotals || tsOk;
      });
      setPracticeHistory(filtered);
      setHistoryStats(Array.isArray(stats) ? stats : []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setHistoryError('Unable to load practice history.');
      setPracticeHistory([]);
      setHistoryStats([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory]);

  // Save practice session
  const savePracticeSession = async (sessionData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/candidate/practice/save-session', sessionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  // MCQ Handlers
  const handleGenerateMcqs = async () => {
    if (!mcqInput.tech.trim()) {
      alert('Please enter at least one technology');
      return;
    }
    
    setMcqLoading(true);
    setMcqs([]);
    setMcqStarted(false);
    setMcqScore(null);
    setStartTime(new Date());
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/candidate/practice/mcqs', {
        tech: mcqInput.tech,
        num: mcqInput.num,
        difficulty: mcqInput.difficulty
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data && res.data.length > 0) {
        setMcqs(res.data);
        setMcqDialog(false);
        setMode('mcq');
      } else {
        alert('Failed to generate questions. Please try again.');
      }
    } catch (err) {
      console.error('MCQ Generation Error:', err);
      alert('Failed to generate questions. Please check your input and try again.');
      setMcqs([]);
    }
    setMcqLoading(false);
  };
  
  const handleSubmitMcqs = async () => {
    let score = 0;
    const questionsWithAnswers = mcqs.map((q, i) => {
      const isCorrect = mcqAnswers[i] === q.answer;
      if (isCorrect) score++;
      return {
        question: q.q,
        userAnswer: mcqAnswers[i],
        correctAnswer: q.answer,
        isCorrect,
        technology: q.technology
      };
    });
    
    const endTime = new Date();
    const timeSpent = startTime ? Math.round((endTime - startTime) / 60000) : 0; // minutes
    
    const sessionData = {
      type: 'mcq',
      technologies: mcqInput.tech.split(',').map(t => t.trim()),
      difficulty: mcqInput.difficulty,
      score,
      totalQuestions: mcqs.length,
      timeSpent,
      questions: questionsWithAnswers
    };
    
    await savePracticeSession(sessionData);
    setMcqScore({ score, total: mcqs.length, timeSpent });
  };

  // Coding Handlers
  const handleGenerateCoding = async () => {
    if (!codingInput.tech.trim()) {
      alert('Please enter at least one technology');
      return;
    }
    
    setCodingLoading(true);
    setCodingQ(null);
    setCodingScore(null);
    setCodingAns('');
    setStartTime(new Date());
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/candidate/practice/coding', {
        tech: codingInput.tech,
        difficulty: codingInput.difficulty
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data) {
        setCodingQ(res.data);
        setCodingDialog(false);
        setMode('coding');
      } else {
        alert('Failed to generate coding question. Please try again.');
      }
    } catch (err) {
      console.error('Coding Generation Error:', err);
      alert('Failed to generate coding question. Please try again.');
      setCodingQ(null);
    }
    setCodingLoading(false);
  };
  
  const handleSubmitCoding = async () => {
    const endTime = new Date();
    const timeSpent = startTime ? Math.round((endTime - startTime) / 60000) : 0;
    
    // Simple scoring based on code length and keywords (demo)
    const codeLength = codingAns.length;
    const hasFunction = /function|def|=>|class/.test(codingAns);
    const hasLogic = /if|for|while|map|filter|reduce/.test(codingAns);
    const score = Math.min(100, (codeLength > 50 ? 30 : 0) + (hasFunction ? 35 : 0) + (hasLogic ? 35 : 0));
    
    const sessionData = {
      type: 'coding',
      technologies: codingInput.tech.split(',').map(t => t.trim()),
      difficulty: codingInput.difficulty,
      score,
      totalQuestions: 1,
      timeSpent,
      questions: [{
        question: codingQ.title,
        userAnswer: codingAns,
        correctAnswer: 'Multiple solutions possible',
        isCorrect: score >= 70,
        technology: codingQ.technology
      }]
    };
    
    await savePracticeSession(sessionData);
    setCodingScore({ 
      feedback: `Code analysis: ${score >= 70 ? 'Good solution!' : 'Needs improvement'}`, 
      score,
      timeSpent 
    });
  };

  // Technology tags input (chips + suggestions)
  const TechTagsInput = ({ value, onChange, placeholder }) => {
    const [input, setInput] = useState('');
    const [tags, setTags] = useState(() => value.split(',').map(t => t.trim()).filter(Boolean));
    const allTagsLower = tags.map(t => t.toLowerCase());

    useEffect(() => {
      const arr = value.split(',').map(t => t.trim()).filter(Boolean);
      setTags(arr);
    }, [value]);

    const commitTags = (next) => {
      setTags(next);
      onChange(next.join(', '));
    };

    const addFromInput = () => {
      const token = input.trim();
      if (!token) return;
      if (allTagsLower.includes(token.toLowerCase())) { setInput(''); return; }
      const next = [...tags, token];
      setInput('');
      commitTags(next);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addFromInput();
      } else if (e.key === 'Backspace' && input.length === 0 && tags.length > 0) {
        const next = tags.slice(0, -1);
        commitTags(next);
      }
    };

    const filtered = input
      ? POPULAR_TECHS.filter(t => t.toLowerCase().includes(input.toLowerCase()) && !allTagsLower.includes(t.toLowerCase())).slice(0, 8)
      : [];

    return (
      <div className="tags-input-container">
        <div className="tags-input">
          {tags.map(t => (
            <span key={t} className="tag-chip">
              {t}
              <button className="tag-remove" onClick={() => commitTags(tags.filter(x => x !== t))} aria-label={`Remove ${t}`}>×</button>
            </span>
          ))}
          <input
            className="tags-input-field"
            placeholder={tags.length === 0 ? placeholder : 'Add more...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => input.trim() && addFromInput()}
          />
        </div>
        {filtered.length > 0 && (
          <div className="tech-suggestions">
            {filtered.map(opt => (
              <div key={opt} className="tech-suggestion" onMouseDown={() => {
                // onMouseDown so blur doesn't fire first
                if (!allTagsLower.includes(opt.toLowerCase())) {
                  const next = [...tags, opt];
                  commitTags(next);
                  setInput('');
                }
              }}>
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="practice-container">
      <div className="practice-content">
        <div className="practice-header">
          <h1 className="practice-title">Practice Area</h1>
          <button 
            className={`history-toggle-btn ${showHistory ? 'close' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            <FiArchive size={18} />
            {showHistory ? 'Close History' : 'View History'}
          </button>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="history-section">
            <h3 className="history-title">
              <FiTrendingUp size={20} />
              Practice History & Analytics
            </h3>
          
            {/* Stats Cards (shown only if backend provides stats) */}
            {Array.isArray(historyStats) && historyStats.length > 0 && (
              <div className="stats-grid">
                {historyStats.map(stat => (
                  <div key={stat._id} className="stat-card">
                    <div className="stat-label">
                      {stat._id.toUpperCase()}
                    </div>
                    <div className="stat-value">
                      {Math.round(stat.averageScore)}%
                    </div>
                    <div className="stat-details">
                      {stat.totalSessions} sessions • Best: {Math.round(stat.bestScore)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          
          {/* Recent Sessions */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {historyLoading ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
                Loading history...
              </div>
            ) : historyError ? (
              <div style={{ textAlign: 'center', color: '#f87171', padding: '24px', background: '#1a2236', borderRadius: 12, border: '1px solid #2b3a55' }}>
                <div style={{ marginBottom: 10 }}>⚠️ {historyError}</div>
                <button className="btn" onClick={loadHistory}>Retry</button>
              </div>
            ) : Array.isArray(practiceHistory) && practiceHistory.length > 0 ? (
              practiceHistory.map(session => (
                <div key={session.id || session._id} style={{
                  background: '#0b1220',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                  border: '1px solid #1f2937'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#e5e7eb', marginBottom: 4 }}>
                      {String(session.type || 'session').toUpperCase()}
                      {Array.isArray(session.technologies) && session.technologies.length > 0
                        ? ` - ${session.technologies.join(', ')}`
                        : ''}
                    </div>
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                      {(session.difficulty || '').toString()}
                      {(() => {
                        const ts = session.created_at || session.createdAt || session.startedAt || session.timestamp;
                        const formatted = formatDateTime(ts);
                        return formatted ? ` • ${formatted}` : '';
                      })()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: (session.percentage || 0) >= 80 ? '#10b981' : (session.percentage || 0) >= 60 ? '#3b82f6' : '#ef4444'
                    }}>
                      {(session.percentage ?? Math.round(((session.score || 0) * 100) / Math.max(1, (session.totalQuestions || 0))))}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {(session.score ?? 0)}/{(session.totalQuestions ?? 0)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
                <FiBook size={48} style={{ margin: '0 auto 16px', opacity: 0.7 }} />
                <div>No practice history yet. Start practicing to see your progress!</div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Practice Mode Buttons */}
        {!(mcqStarted && mode === 'mcq' && !mcqScore) && !showHistory && (
          <div className="practice-cards-grid">
            <div 
              className="practice-card mcq"
              onClick={() => { setMode('mcq'); setMcqDialog(true); }}
            >
              <div className="practice-card-icon">
                <FiBook size={48} />
              </div>
              <h3 className="practice-card-title">MCQ Practice</h3>
              <p className="practice-card-description">
                Test your knowledge with multiple choice questions across various technologies
              </p>
            </div>
            
            <div 
              className="practice-card coding"
              onClick={() => { setMode('coding'); setCodingDialog(true); }}
            >
              <div className="practice-card-icon">
                <FiCode size={48} />
              </div>
              <h3 className="practice-card-title">Coding Challenges</h3>
              <p className="practice-card-description">
                Solve real-world programming problems and improve your coding skills
              </p>
            </div>
            
            <div 
              className="practice-card interview"
              onClick={() => { setMode('interview'); setInterviewDialog(true); }}
            >
              <div className="practice-card-icon">
                <FiMic size={48} />
              </div>
              <h3 className="practice-card-title">Mock Interview</h3>
              <p className="practice-card-description">
                Practice interview questions and scenarios to ace your next interview
              </p>
            </div>
          </div>
        )}

        {/* MCQ Dialog */}
        {mcqDialog && (
          <div className="modal-overlay">
            <div className="modal-dialog">
              <div className="modal-header">
                <h3 className="modal-title">Generate MCQ Test</h3>
                <button className="close-button" onClick={() => setMcqDialog(false)} aria-label="Close">
                  <span style={{ fontSize: 20, fontWeight: 800 }}>x</span>
                </button>
              </div>
              
              <div className="form-group">
                <label className="form-label">Technologies</label>
                <TechTagsInput 
                  placeholder="Add a technology and press Enter"
                  value={mcqInput.tech}
                  onChange={tech => setMcqInput({ ...mcqInput, tech })}
                />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Number of Questions</label>
                  <input 
                    className="form-input"
                    type="number" 
                    min={1} 
                    max={100}
                    step={1}
                    value={mcqInput.num} 
                    onChange={e => setMcqInput({ 
                      ...mcqInput, 
                      num: Math.max(1, Math.min(100, parseInt(e.target.value) || 5)) 
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Difficulty Level</label>
                  <select 
                    className="form-input"
                    value={mcqInput.difficulty} 
                    onChange={e => setMcqInput({ ...mcqInput, difficulty: e.target.value })}
                  >
                    {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Timer</label>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                    <label className="switch" aria-label="Toggle timer">
                      <input
                        type="checkbox"
                        checked={mcqTimerEnabled}
                        onChange={(e) => setMcqTimerEnabled(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af' }}>
                      <FiClock size={14} />
                      <span style={{ fontSize: 13 }}>{mcqTimerEnabled ? 'Timer will auto-submit' : 'No time limit'}</span>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Time Limit</label>
                  <select
                    className="form-input"
                    value={mcqTimerMinutes}
                    onChange={e => setMcqTimerMinutes(parseInt(e.target.value) || 10)}
                    disabled={!mcqTimerEnabled}
                  >
                    {[5,10,15,20,30].map(m => (
                      <option key={m} value={m}>{m} minutes</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="btn-group">
                <button 
                  className={`btn btn-full ${mcqLoading ? 'loading' : ''}`}
                  style={{ padding: '14px 24px', fontSize: 16, fontWeight: 700 }}
                  onClick={handleGenerateMcqs} 
                  disabled={mcqLoading || !mcqInput.tech.trim()}
                >
                  {mcqLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiBook size={16} />
                      Generate MCQs
                    </>
                  )}
                </button>
              </div>
          </div>
        </div>
      )}
      {/* MCQ Loading/Start/Test */}
      {mode === 'mcq' && !mcqDialog && (
        <div>
          {mcqLoading && <div>Loading MCQs...</div>}
          {!mcqLoading && mcqs.length > 0 && !mcqStarted && (
            <button
              style={btnStyle}
              onClick={() => {
                // If you still want to keep inline mode for fallback, keep setMcqStarted(true)
                // setMcqStarted(true);
                const mapped = mcqs.map((q, idx) => ({
                  id: idx + 1,
                  question: q.q,
                  options: q.options,
                  correctAnswer: q.answer,
                  technology: q.technology
                }));
                navigate('/candidate/mcqs', {
                  state: {
                    questions: mapped,
                    timerEnabled: mcqTimerEnabled,
                    timerMinutes: mcqTimerEnabled ? mcqTimerMinutes : null
                  }
                });
              }}
            >
              Start Test
            </button>
          )}
          {!mcqLoading && mcqStarted && !mcqScore && (
            <MCQStepper
              mcqs={mcqs}
              mcqAnswers={mcqAnswers}
              setMcqAnswers={setMcqAnswers}
              onSubmit={handleSubmitMcqs}
              timerEnabled={mcqTimerEnabled}
              timerMinutes={mcqTimerEnabled ? mcqTimerMinutes : null}
            />
          )}
          {mcqScore && (
            <ScoreBoard score={mcqScore.score} total={mcqScore.total} />
          )}
        </div>
      )}

      {/* Coding Dialog */}
      {codingDialog && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Generate Coding Challenge</h3>
              <button className="close-button" onClick={() => setCodingDialog(false)} aria-label="Close">
                <span style={{ fontSize: 20, fontWeight: 800 }}>x</span>
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Technologies</label>
              <TechTagsInput 
                placeholder="Add a technology and press Enter"
                value={codingInput.tech}
                onChange={tech => setCodingInput({ ...codingInput, tech })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select 
                className="form-input"
                value={codingInput.difficulty} 
                onChange={e => setCodingInput({ ...codingInput, difficulty: e.target.value })}
              >
                {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Questions</label>
              <select
                className="form-input"
                value={codingInput.num}
                onChange={e => setCodingInput({ ...codingInput, num: Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) })}
              >
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            
            {/* Timer Controls (match MCQ dialog) */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Timer</label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  <label className="switch" aria-label="Toggle timer">
                    <input
                      type="checkbox"
                      checked={codingTimerEnabled}
                      onChange={(e) => setCodingTimerEnabled(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af' }}>
                    <FiClock size={14} />
                    <span style={{ fontSize: 13 }}>{codingTimerEnabled ? 'Timer will auto-submit' : 'No time limit'}</span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Time Limit</label>
                <select
                  className="form-input"
                  value={codingTimerMinutes}
                  onChange={e => setCodingTimerMinutes(parseInt(e.target.value) || 30)}
                  disabled={!codingTimerEnabled}
                >
                  {[5,10,15,20,30,45,60].map(m => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="btn-group">
              <button 
                className={`btn btn-full ${codingLoading ? 'loading' : ''}`}
                style={{ padding: '14px 28px', fontSize: 16, fontWeight: 700 }}
                onClick={handleGenerateCoding}
                disabled={codingLoading || !codingInput.tech.trim()}
              >
                {codingLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FiCode size={16} />
                    Generate Challenge
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Coding Loading/Start/Test */}
      {mode === 'coding' && !codingDialog && (
        <div style={{ width: '100%' }}>
          {codingLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={spinnerStyle}></div>
              <div style={{ marginTop: 16, color: '#6b7280' }}>Generating coding challenge...</div>
            </div>
          )}
          
          {!codingLoading && codingQ && (
            <button
              style={btnStyle}
              onClick={() => {
                const count = Math.max(1, Math.min(5, parseInt(codingInput.num) || 1));
                const base = {
                  title: codingQ.title,
                  difficulty: codingQ.difficulty || codingInput.difficulty,
                  description: codingQ.description || '',
                  examples: Array.isArray(codingQ.examples) ? codingQ.examples : [],
                  constraints: Array.isArray(codingQ.constraints) ? codingQ.constraints : [],
                  starterCode: { javascript: codingQ.starter || '' },
                  technology: codingQ.technology || (codingInput.tech || 'General')
                };
                const mapped = Array.from({ length: count }).map((_, idx) => ({
                  id: idx + 1,
                  ...base
                }));
                navigate('/candidate/coding', {
                  state: {
                    problems: mapped,
                    timerEnabled: codingTimerEnabled,
                    timerMinutes: codingTimerEnabled ? codingTimerMinutes : null
                  }
                });
              }}
            >
              Start Test
            </button>
          )}
          
          {codingScore && (
            <div style={{
              marginTop: 24,
              background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
              border: '1px solid #1f2937'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                <FiAward size={24} style={{ color: '#667eea' }} />
                <h3 style={{ margin: 0, color: '#e5e7eb' }}>Solution Analysis</h3>
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                color: codingScore.score >= 70 ? '#10b981' : codingScore.score >= 50 ? '#f59e0b' : '#ef4444',
                marginBottom: 8
              }}>
                {codingScore.score}/100
              </div>
              <div style={{ color: '#e5e7eb', fontWeight: '600', marginBottom: 12 }}>
                {codingScore.feedback}
              </div>
              {codingScore.timeSpent && (
                <div style={{ fontSize: '14px', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <FiClock size={14} />
                  Time spent: {codingScore.timeSpent} minutes
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interview Dialog */}
      {interviewDialog && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Setup Mock Interview</h3>
              <button className="close-button" onClick={() => setInterviewDialog(false)} aria-label="Close">
                <span style={{ fontSize: 20, fontWeight: 800 }}>x</span>
              </button>
            </div>

            {/* Type Selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                className={`btn ${interviewInput.type === 'technology' ? 'btn-primary' : ''}`}
                onClick={() => setInterviewInput({ ...interviewInput, type: 'technology' })}
              >Technology-based</button>
              <button
                className={`btn ${interviewInput.type === 'project' ? 'btn-primary' : ''}`}
                onClick={() => setInterviewInput({ ...interviewInput, type: 'project' })}
              >Project/Resume-based</button>
            </div>

            {interviewInput.type === 'technology' ? (
              <div className="form-group">
                <label className="form-label">Technologies</label>
                <TechTagsInput
                  placeholder="Add a technology and press Enter"
                  value={interviewInput.tech}
                  onChange={tech => setInterviewInput({ ...interviewInput, tech })}
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Project Summary / Focus Areas</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Describe your project, role, and key tech stacks..."
                    value={interviewInput.projectSummary}
                    onChange={e => setInterviewInput({ ...interviewInput, projectSummary: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Resume (optional)</label>
                  <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <FiUpload />
                    Choose File
                    <input
                      type="file"
                      accept=".txt"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text().catch(() => '');
                        setInterviewInput({ ...interviewInput, resumeFile: file, resumeText: text });
                      }}
                    />
                  </label>
                  {interviewInput.resumeFile && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#9ca3af' }}>Selected: {interviewInput.resumeFile.name}</div>
                  )}
                </div>
              </>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Number of Questions</label>
                <input
                  className="form-input"
                  type="number"
                  min={3}
                  max={20}
                  value={interviewInput.num}
                  onChange={e => setInterviewInput({ ...interviewInput, num: Math.max(3, Math.min(20, parseInt(e.target.value) || 5)) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select
                  className="form-input"
                  value={interviewInput.difficulty}
                  onChange={e => setInterviewInput({ ...interviewInput, difficulty: e.target.value })}
                >
                  {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="btn-group">
              <button
                className={`btn btn-full ${interviewLoading ? 'loading' : ''}`}
                style={{ padding: '14px 24px', fontSize: 16, fontWeight: 700 }}
                onClick={() => {
                  if (interviewInput.type === 'technology' && !interviewInput.tech.trim()) {
                    alert('Please enter at least one technology');
                    return;
                  }
                  setInterviewDialog(false);
                  navigate('/candidate/interview', {
                    state: {
                      interview: {
                        type: interviewInput.type,
                        tech: interviewInput.tech,
                        projectSummary: interviewInput.projectSummary,
                        num: interviewInput.num,
                        difficulty: interviewInput.difficulty,
                        resumeText: interviewInput.resumeText || ''
                      }
                    }
                  });
                }}
                disabled={interviewLoading}
              >
                <>
                  <FiMic size={16} />
                  Start Voice Interview
                </>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function MCQStepper({ mcqs, mcqAnswers, setMcqAnswers, onSubmit, timerEnabled, timerMinutes }) {
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(timerEnabled && timerMinutes ? timerMinutes * 60 : null);

  // Start/handle countdown
  useEffect(() => {
    if (!timerEnabled || !timerMinutes) return;
    // reset remaining when minutes change
    setRemaining(timerMinutes * 60);
    let id = setInterval(() => {
      setRemaining(prev => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(id);
          // Auto-submit on time up
          try { onSubmit(); } catch (e) { /* noop */ }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerEnabled, timerMinutes, onSubmit]);

  const formatTime = (s) => {
    if (s === null || s === undefined) return '';
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const q = mcqs[current];
  return (
    <div className="mcq-container">
      {/* Header with timer and progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: '#9ca3af', fontSize: 14 }}>Question {current + 1} of {mcqs.length}</div>
        {timerEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111827', border: '1px solid #1f2937', padding: '6px 10px', borderRadius: 999, color: remaining !== null && remaining <= 30 ? '#f59e0b' : '#e5e7eb' }}>
            <FiClock size={14} />
            <span style={{ fontWeight: 700 }}>{formatTime(remaining ?? 0)}</span>
          </div>
        )}
      </div>
      <div className="mcq-question">
        <div className="mcq-question-text">{current + 1}. {q.q}</div>
        <div className="mcq-options">
          {q.options.map((opt, j) => (
            <label key={j} className={`mcq-option ${mcqAnswers[current] === j ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name={`mcq${current}`} 
                value={j} 
                checked={mcqAnswers[current] === j} 
                onChange={() => setMcqAnswers(a => { const b = [...a]; b[current] = j; return b; })} 
              />
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#6366f1',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                marginRight: 8,
              }}>{String.fromCharCode(65 + j)}</span>
              <span style={{ verticalAlign: 'middle', fontWeight: 500 }}>{
                typeof opt === 'string' ? opt.replace(/^([A-Da-d][\.:\)\-]?\s*)/, '') : opt
              }</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mcq-navigation">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
        >Previous</button>
        {current < mcqs.length - 1 ? (
          <button
            className="btn"
            onClick={() => setCurrent(c => Math.min(mcqs.length - 1, c + 1))}
          >Next</button>
        ) : (
          <button className="btn" onClick={onSubmit}>Submit</button>
        )}
      </div>
    </div>
  );
}

function ScoreBoard({ score, total }) {
  const percent = total > 0 ? (score / total) * 100 : 0;
  let color = '#ef4444', msg = 'Needs improvement!';
  if (percent >= 80) { color = '#22c55e'; msg = 'Excellent!'; }
  else if (percent >= 60) { color = '#2563eb'; msg = 'Good job!'; }
  else if (percent >= 40) { color = '#f59e42'; msg = 'Keep practicing!'; }
  return (
    <div style={{ marginTop: 32, background: '#e0e7ff', borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <h3>Score Board</h3>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{score} / {total}</div>
      <div style={{ color, fontWeight: 600, marginTop: 8 }}>{msg}</div>
    </div>
  );
}

// Spinner animation
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);

// Enhanced Styles
const btnStyle = {
  background: 'linear-gradient(90deg, #6366f1 60%, #0dcaf0 100%)',
  color: '#fff',
  fontSize: 16,
  fontWeight: 600,
  border: 'none',
  borderRadius: 8,
  padding: '12px 24px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
  transition: 'all 0.2s ease',
  ':hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
  },
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none'
  }
};

const practiceCardStyle = {
  padding: 24,
  borderRadius: 16,
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  ':hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
  }
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)'
};

const enhancedDialogStyle = {
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  padding: 32,
  minWidth: 480,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 8,
  borderRadius: 8,
  color: '#6b7280',
  transition: 'all 0.2s ease',
  ':hover': {
    background: '#f3f4f6',
    color: '#374151'
  }
};

const labelStyle = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 8
};

const inputStyle = {
  width: '100%',
  fontSize: 16,
  padding: '12px 16px',
  borderRadius: 8,
  border: '2px solid #e0e7ff',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  fontFamily: 'inherit',
  ':focus': {
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
  }
};

const spinnerStyle = {
  width: 20,
  height: 20,
  border: '2px solid #e0e7ff',
  borderTop: '2px solid #6366f1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  display: 'inline-block'
};

// Legacy styles for compatibility
const dialogStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 24px #23233a33',
  padding: 32,
  zIndex: 1002,
  minWidth: 320,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};
