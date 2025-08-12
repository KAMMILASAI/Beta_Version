import React, { useState } from 'react';
import axios from 'axios';
import './GenerateTest.css';

export default function GenerateTest() {
  const [step, setStep] = useState('choose'); // choose | form | done | demo
  const [mode, setMode] = useState('manual'); // manual | ai | demo
  const [form, setForm] = useState({ title: '', company: '', description: '', skills: '', college: '', minCgpa: '', maxCgpa: '', expiresAt: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [demoLinks, setDemoLinks] = useState({});
  return (
    <div className="generate-test-container">
      <div className="generate-test-card">
        <h2 className="page-title">Generate Assessment Tests</h2>
        
        {step === 'choose' && (
          <div className="choice-section">
            <p className="choice-description">How would you like to create the assessment?</p>
            <div className="choice-buttons">
              <button 
                onClick={() => { setMode('ai'); setStep('form'); }} 
                className="choice-btn ai-btn"
              >
                <div className="btn-icon">🤖</div>
                <div className="btn-content">
                  <h3>AI Generated</h3>
                  <p>Let AI create personalized tests</p>
                </div>
              </button>
              
              <button 
                onClick={() => { setMode('manual'); setStep('form'); }} 
                className="choice-btn manual-btn"
              >
                <div className="btn-icon">✏️</div>
                <div className="btn-content">
                  <h3>Manual Creation</h3>
                  <p>Create custom tests manually</p>
                </div>
              </button>
              
              <button 
                onClick={() => { setMode('demo'); setStep('demo'); }} 
                className="choice-btn demo-btn"
              >
                <div className="btn-icon">🎯</div>
                <div className="btn-content">
                  <h3>Demo Tests</h3>
                  <p>Try sample test components</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 'demo' && (
          <div className="demo-section">
            <div className="demo-header">
              <h3>Demo Test Components</h3>
              <p>Try out our sample test components for candidates</p>
              <button 
                onClick={() => setStep('choose')} 
                className="back-btn"
              >
                ← Back to Options
              </button>
            </div>
            
            <div className="demo-cards">
              <div className="demo-card mcq-card">
                <div className="demo-card-header">
                  <div className="demo-icon">📝</div>
                  <h4>MCQs Test</h4>
                </div>
                <div className="demo-card-content">
                  <p>Multiple choice questions with timer and scoring</p>
                  <ul>
                    <li>• 30-minute timer</li>
                    <li>• Question navigation</li>
                    <li>• Auto-submit on timeout</li>
                    <li>• Instant scoring</li>
                  </ul>
                </div>
                <div className="demo-card-actions">
                  <button 
                    onClick={() => generateDemoLink('mcqs')} 
                    className="demo-generate-btn"
                  >
                    Generate Demo Link
                  </button>
                  {demoLinks.mcqs && (
                    <div className="demo-link-section">
                      <div className="demo-link">{demoLinks.mcqs}</div>
                      <div className="demo-link-actions">
                        <button onClick={() => copyDemoLink('mcqs')} className="copy-btn">📋 Copy</button>
                        <button onClick={() => openDemoLink('mcqs')} className="open-btn">🔗 Open</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="demo-card coding-card">
                <div className="demo-card-header">
                  <div className="demo-icon">💻</div>
                  <h4>Coding Test</h4>
                </div>
                <div className="demo-card-content">
                  <p>Programming challenges with code editor</p>
                  <ul>
                    <li>• 60-minute timer</li>
                    <li>• Multiple languages</li>
                    <li>• Code editor interface</li>
                    <li>• Problem descriptions</li>
                  </ul>
                </div>
                <div className="demo-card-actions">
                  <button 
                    onClick={() => generateDemoLink('coding')} 
                    className="demo-generate-btn"
                  >
                    Generate Demo Link
                  </button>
                  {demoLinks.coding && (
                    <div className="demo-link-section">
                      <div className="demo-link">{demoLinks.coding}</div>
                      <div className="demo-link-actions">
                        <button onClick={() => copyDemoLink('coding')} className="copy-btn">📋 Copy</button>
                        <button onClick={() => openDemoLink('coding')} className="open-btn">🔗 Open</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="demo-card interview-card">
                <div className="demo-card-header">
                  <div className="demo-icon">🎤</div>
                  <h4>Interview Test</h4>
                </div>
                <div className="demo-card-content">
                  <p>Behavioral and technical interview questions</p>
                  <ul>
                    <li>• 45-minute timer</li>
                    <li>• Question categories</li>
                    <li>• Recording practice</li>
                    <li>• Answer tips</li>
                  </ul>
                </div>
                <div className="demo-card-actions">
                  <button 
                    onClick={() => generateDemoLink('interview')} 
                    className="demo-generate-btn"
                  >
                    Generate Demo Link
                  </button>
                  {demoLinks.interview && (
                    <div className="demo-link-section">
                      <div className="demo-link">{demoLinks.interview}</div>
                      <div className="demo-link-actions">
                        <button onClick={() => copyDemoLink('interview')} className="copy-btn">📋 Copy</button>
                        <button onClick={() => openDemoLink('interview')} className="open-btn">🔗 Open</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          !link ? (
            <div className="form-section">
              <div className="form-header">
                <h3>{mode === 'ai' ? 'AI Generated Test' : 'Manual Test Creation'}</h3>
                <button 
                  onClick={() => setStep('choose')} 
                  className="back-btn"
                >
                  ← Back to Options
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="test-form">
                {[
                  { name: 'title', label: 'Job Title', required: true },
                  { name: 'company', label: 'Company', required: true },
                  { name: 'description', label: 'Description', type: 'textarea', required: true },
                  { name: 'skills', label: 'Required Skills (comma separated)' },
                  { name: 'college', label: 'College Filter (optional)' },
                  { name: 'minCgpa', label: 'Min CGPA', type: 'number' },
                  { name: 'maxCgpa', label: 'Max CGPA', type: 'number' },
                  { name: 'expiresAt', label: 'Expiry Date & Time', type: 'datetime-local', required: true }
                ].map(f => (
                  <div key={f.name} className="form-group">
                    <label className="form-label">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        name={f.name}
                        value={form[f.name]}
                        onChange={handleChange}
                        required={f.required}
                        className="form-textarea"
                        rows={4}
                      />
                    ) : (
                      <input
                        type={f.type || 'text'}
                        name={f.name}
                        value={form[f.name]}
                        onChange={handleChange}
                        required={f.required}
                        step={f.type === 'number' ? '0.01' : undefined}
                        className="form-input"
                      />
                    )}
                  </div>
                ))}
                
                <button disabled={loading} className="submit-btn">
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Test Link'
                  )}
                </button>
                
                {error && <div className="error-message">{error}</div>}
              </form>
            </div>
          ) : (
            <div className="result-section">
              <div className="result-header">
                <h3>Test Link Generated Successfully!</h3>
                <button 
                  onClick={() => { setStep('choose'); setLink(''); setError(''); }} 
                  className="back-btn"
                >
                  ← Create Another Test
                </button>
              </div>
              
              <div className="result-content">
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <p>Your test link has been generated and is ready to share!</p>
                </div>
                
                <div className="link-display">
                  <label className="link-label">Generated Link:</label>
                  <div className="link-container">
                    <div className="link-text">{link}</div>
                    <button onClick={copyLink} className="copy-link-btn">📋 Copy</button>
                  </div>
                </div>
                
                <div className="result-actions">
                  <button onClick={copyLink} className="action-btn copy-btn-large">
                    📋 Copy Link
                  </button>
                  <button 
                    onClick={() => window.open(link, '_blank')} 
                    className="action-btn open-btn-large"
                  >
                    🔗 Open Link
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );

  // component body helpers
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        minCgpa: form.minCgpa ? parseFloat(form.minCgpa) : undefined,
        maxCgpa: form.maxCgpa ? parseFloat(form.maxCgpa) : undefined,
        expiresAt: form.expiresAt
      };
      const res = await axios.post('/api/jobs', payload, { headers: { Authorization: `Bearer ${token}` } });
      setLink(res.data.link);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to generate');
    }
    setLoading(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  }

  function generateDemoLink(testType) {
    const baseUrl = window.location.origin;
    const demoLink = `${baseUrl}/candidate/${testType}`;
    setDemoLinks({
      ...demoLinks,
      [testType]: demoLink
    });
  }

  function copyDemoLink(testType) {
    navigator.clipboard.writeText(demoLinks[testType]);
    alert(`${testType.toUpperCase()} demo link copied to clipboard!`);
  }

  function openDemoLink(testType) {
    window.open(demoLinks[testType], '_blank');
  }
}
