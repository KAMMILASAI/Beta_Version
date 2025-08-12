import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiClock, FiTrendingUp, FiAward, FiBook, FiCode, FiMic, FiArchive, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import './Partices.css';

const DIFFICULTY = ["Low", "Medium", "High"];
const POPULAR_TECHS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'CSS', 'HTML',
  'TypeScript', 'Angular', 'Vue.js', 'Express.js', 'MongoDB', 'SQL',
  'Git', 'Docker', 'AWS', 'REST API', 'GraphQL', 'Redux', 'Next.js'
];

export default function Partices() {
  const [mode, setMode] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [historyStats, setHistoryStats] = useState([]);
  const [startTime, setStartTime] = useState(null);
  
  // MCQ States
  const [mcqDialog, setMcqDialog] = useState(false);
  const [mcqInput, setMcqInput] = useState({ tech: '', num: 5, difficulty: 'Medium' });
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [mcqStarted, setMcqStarted] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState([]);
  const [mcqScore, setMcqScore] = useState(null);
  
  // Coding States
  const [codingDialog, setCodingDialog] = useState(false);
  const [codingInput, setCodingInput] = useState({ tech: '', difficulty: 'Medium' });
  const [codingLoading, setCodingLoading] = useState(false);
  const [codingQ, setCodingQ] = useState(null);
  const [codingAns, setCodingAns] = useState('');
  const [codingScore, setCodingScore] = useState(null);

  // Load practice history
  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/candidate/practice/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPracticeHistory(res.data.sessions);
      setHistoryStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load history:', err);
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
      await axios.post('http://localhost:5000/api/candidate/practice/save-session', sessionData, {
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
      const res = await axios.post('http://localhost:5000/api/candidate/practice/mcqs', {
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
      const res = await axios.post('http://localhost:5000/api/candidate/practice/coding', {
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

  // Technology input helper
  const TechInput = ({ value, onChange, placeholder }) => (
    <div style={{ position: 'relative' }}>
      <input 
        placeholder={placeholder}
        value={value} 
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputStyle,
          paddingRight: '40px'
        }}
      />
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: '#fff',
        border: '1px solid #e0e7ff',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 1000,
        display: value.length > 0 ? 'block' : 'none'
      }}>
        {POPULAR_TECHS
          .filter(tech => tech.toLowerCase().includes(value.toLowerCase()) && !value.split(',').map(t => t.trim()).includes(tech))
          .slice(0, 8)
          .map(tech => (
            <div
              key={tech}
              onClick={() => {
                const currentTechs = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                const newTechs = [...currentTechs, tech].join(', ');
                onChange(newTechs);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '14px',
                ':hover': { background: '#f8fafc' }
              }}
              onMouseEnter={e => e.target.style.background = '#f8fafc'}
              onMouseLeave={e => e.target.style.background = '#fff'}
            >
              {tech}
            </div>
          ))
        }
      </div>
    </div>
  );

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
          
            {/* Stats Cards */}
            {historyStats.length > 0 && (
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
            {practiceHistory.length > 0 ? (
              practiceHistory.map(session => (
                <div key={session._id} style={{
                  background: '#fff',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                      {session.type.toUpperCase()} - {session.technologies.join(', ')}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {session.difficulty} • {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: session.percentage >= 80 ? '#10b981' : session.percentage >= 60 ? '#3b82f6' : '#ef4444'
                    }}>
                      {session.percentage}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {session.score}/{session.totalQuestions}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
                <FiBook size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
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
              onClick={() => setMode('interview')}
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
                <button className="close-button" onClick={() => setMcqDialog(false)}>
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="form-group">
                <label className="form-label">Technologies (comma-separated)</label>
                <TechInput 
                  placeholder="e.g. JavaScript, React, Node.js" 
                  value={mcqInput.tech} 
                  onChange={tech => setMcqInput({ ...mcqInput, tech })}
                />
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  💡 You can enter multiple technologies separated by commas
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Number of Questions</label>
                  <input 
                    className="form-input"
                    type="number" 
                    min={1} 
                    max={20} 
                    value={mcqInput.num} 
                    onChange={e => setMcqInput({ ...mcqInput, num: parseInt(e.target.value) || 5 })}
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
              
              <div className="btn-group">
                <button 
                  className={`btn btn-full ${mcqLoading ? 'loading' : ''}`}
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
                <button 
                  className="btn btn-secondary"
                  onClick={() => setMcqDialog(false)}
                >
                  Cancel
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
            <button style={btnStyle} onClick={() => setMcqStarted(true)}>Start Test</button>
          )}
          {!mcqLoading && mcqStarted && !mcqScore && (
            <MCQStepper
              mcqs={mcqs}
              mcqAnswers={mcqAnswers}
              setMcqAnswers={setMcqAnswers}
              onSubmit={handleSubmitMcqs}
            />
          )}
          {mcqScore && (
            <ScoreBoard score={mcqScore.score} total={mcqScore.total} />
          )}
        </div>
      )}

      {/* Coding Dialog */}
      {codingDialog && (
        <div style={overlayStyle}>
          <div style={enhancedDialogStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: '700' }}>Generate Coding Challenge</h3>
              <button onClick={() => setCodingDialog(false)} style={closeButtonStyle}>
                <FiX size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Technologies (comma-separated)</label>
              <TechInput 
                placeholder="e.g. JavaScript, Python, Java" 
                value={codingInput.tech} 
                onChange={tech => setCodingInput({ ...codingInput, tech })}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
                🚀 Enter technologies for real-world coding challenges
              </div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Difficulty Level</label>
              <select 
                value={codingInput.difficulty} 
                onChange={e => setCodingInput({ ...codingInput, difficulty: e.target.value })}
                style={inputStyle}
              >
                {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={handleGenerateCoding} 
                style={{
                  ...btnStyle,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }} 
                disabled={codingLoading || !codingInput.tech.trim()}
              >
                {codingLoading ? (
                  <>
                    <div style={spinnerStyle}></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FiCode size={16} />
                    Generate Challenge
                  </>
                )}
              </button>
              <button 
                onClick={() => setCodingDialog(false)} 
                style={{
                  ...btnStyle, 
                  background: '#6b7280',
                  flex: '0 0 auto',
                  padding: '12px 20px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Coding Loading/Start/Test */}
      {mode === 'coding' && !codingDialog && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {codingLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={spinnerStyle}></div>
              <div style={{ marginTop: 16, color: '#6b7280' }}>Generating coding challenge...</div>
            </div>
          )}
          
          {!codingLoading && codingQ && (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e0e7ff'
            }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '24px', fontWeight: '700' }}>
                  {codingQ.title}
                </h3>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16
                }}>
                  <div style={{ color: '#374151', lineHeight: '1.6', marginBottom: 12 }}>
                    {codingQ.description}
                  </div>
                  
                  {codingQ.examples && codingQ.examples.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>Examples:</div>
                      {codingQ.examples.map((example, i) => (
                        <div key={i} style={{
                          background: '#fff',
                          borderRadius: 6,
                          padding: 12,
                          marginBottom: 8,
                          fontFamily: 'monospace',
                          fontSize: '14px'
                        }}>
                          <div><strong>Input:</strong> {example.input}</div>
                          <div><strong>Output:</strong> {example.output}</div>
                          {example.explanation && <div style={{ color: '#6b7280', marginTop: 4 }}><em>{example.explanation}</em></div>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {codingQ.constraints && codingQ.constraints.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>Constraints:</div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#374151' }}>
                        {codingQ.constraints.map((constraint, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {codingQ.timeComplexity && (
                    <div style={{ display: 'flex', gap: 16, fontSize: '14px', color: '#6b7280' }}>
                      <span><strong>Time:</strong> {codingQ.timeComplexity}</span>
                      <span><strong>Space:</strong> {codingQ.spaceComplexity}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <form onSubmit={e => { e.preventDefault(); handleSubmitCoding(); }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>Your Solution:</label>
                  <textarea 
                    rows={12} 
                    style={{
                      width: '100%',
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: 14,
                      borderRadius: 8,
                      border: '2px solid #e0e7ff',
                      padding: 16,
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      ':focus': { borderColor: '#6366f1' }
                    }}
                    value={codingAns} 
                    onChange={e => setCodingAns(e.target.value)} 
                    placeholder={codingQ.starter || 'Write your solution here...'}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = '#e0e7ff'}
                  />
                </div>
                
                {codingQ.hints && codingQ.hints.length > 0 && (
                  <div style={{
                    background: '#fef3c7',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 20,
                    border: '1px solid #fbbf24'
                  }}>
                    <div style={{ fontWeight: '600', color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiAlertCircle size={16} />
                      Hints:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#92400e' }}>
                      {codingQ.hints.map((hint, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  style={{
                    ...btnStyle,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                  disabled={!codingAns.trim()}
                >
                  <FiCheck size={16} />
                  Submit Solution
                </button>
              </form>
            </div>
          )}
          
          {codingScore && (
            <div style={{
              marginTop: 24,
              background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
              border: '1px solid #e0e7ff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                <FiAward size={24} style={{ color: '#6366f1' }} />
                <h3 style={{ margin: 0, color: '#1f2937' }}>Solution Analysis</h3>
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                color: codingScore.score >= 70 ? '#10b981' : codingScore.score >= 50 ? '#f59e0b' : '#ef4444',
                marginBottom: 8
              }}>
                {codingScore.score}/100
              </div>
              <div style={{ color: '#374151', fontWeight: '600', marginBottom: 12 }}>
                {codingScore.feedback}
              </div>
              {codingScore.timeSpent && (
                <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <FiClock size={14} />
                  Time spent: {codingScore.timeSpent} minutes
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interview Option */}
      {mode === 'interview' && (
        <div style={{ marginTop: 32, background: '#f8fafc', borderRadius: 12, padding: 32, textAlign: 'center', fontSize: 22, color: '#6366f1', fontWeight: 700 }}>
          Interview Practice - Coming Soon...
        </div>
      )}
      </div>
    </div>
  );
}

function MCQStepper({ mcqs, mcqAnswers, setMcqAnswers, onSubmit }) {
  const [current, setCurrent] = useState(0);
  const q = mcqs[current];
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{
        marginBottom: 28,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 12px #6366f133',
        padding: 24,
        border: '1.5px solid #e0e7ff',
        textAlign: 'left',
      }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: '#23233a' }}>{current + 1}. {q.q}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {q.options.map((opt, j) => (
            <label key={j} style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              borderRadius: 8,
              padding: '10px 16px',
              border: '1.5px solid #e0e7ff',
              cursor: 'pointer',
              fontSize: 16,
              color: '#23233a',
              fontWeight: 500,
              marginBottom: 0,
              textAlign: 'left',
              gap: 16,
              transition: 'background 0.18s, border 0.18s',
            }}>
              <input type="radio" name={`mcq${current}`} value={j} checked={mcqAnswers[current] === j} onChange={() => setMcqAnswers(a => { const b = [...a]; b[current] = j; return b; })} style={{ marginRight: 10, accentColor: '#6366f1', width: 18, height: 18 }} />
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
                typeof opt === 'string' ? opt.replace(/^([A-Da-d][\.\:\)\-]?\s*)/, '') : opt
              }</span>
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 24 }}>
        <button
          style={{ ...btnStyle, background: '#eee', color: '#23233a' }}
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
        >Previous</button>
        {current < mcqs.length - 1 ? (
          <button
            style={btnStyle}
            onClick={() => setCurrent(c => Math.min(mcqs.length - 1, c + 1))}
          >Next</button>
        ) : (
          <button style={btnStyle} onClick={onSubmit}>Submit</button>
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
