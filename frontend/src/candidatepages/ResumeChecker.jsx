import React, { useRef, useState } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiFile, FiCheckCircle } from 'react-icons/fi';
import './ResumeChecker.css';

export default function ResumeChecker() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleDrop = e => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = e => e.preventDefault();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDesc);
      const res = await axios.post('http://localhost:8080/api/candidate/resume-check', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
    } catch (err) {
      setError('Failed to check resume: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="resume-checker-container">
      <div className="resume-checker-content">
        <h1 className="resume-checker-title">AI Resume Checker</h1>
        <p className="resume-checker-subtitle">
          Get instant AI-powered feedback on your resume and improve your chances of landing your dream job
        </p>
        
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="resume-form">
          <div
            className={`upload-zone ${file ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
          >
            <div className="upload-icon">
              {file ? <FiCheckCircle size={48} /> : <FiUploadCloud size={48} />}
            </div>
            {file ? (
              <div className="file-selected">
                <FiFile className="file-icon" />
                <span className="file-name">{file.name}</span>
              </div>
            ) : (
              <div className="upload-text">
                <p className="upload-primary">Drag & drop your resume here</p>
                <p className="upload-secondary">or click to browse files</p>
                <p className="upload-formats">Supports PDF, DOCX, TXT</p>
              </div>
            )}
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          </div>
          
          <div className="job-description-section">
            <label className="job-desc-label">Job Description</label>
            <textarea
              className="job-desc-textarea"
              placeholder="Paste or write the job description here..."
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              rows={6}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`submit-button ${loading ? 'loading' : ''}`}
            disabled={loading || !file || !jobDesc}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Analyzing Resume...
              </>
            ) : (
              'Generate AI Score'
            )}
          </button>
        </form>
        
        {error && (
          <div className="error-message">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {result && (
          <div className="results-container">
            <div className="results-header">
              <h3 className="results-title">AI Resume Analysis</h3>
              <div className="score-display">
                <div className="score-number">{result.score}</div>
                <div className="score-divider">/</div>
                <div className="score-total">100</div>
              </div>
            </div>
            
            <div className="analysis-grid">
              <div className="analysis-section strengths">
                <div className="section-header">
                  <span className="section-icon">✅</span>
                  <h4 className="section-title">Strengths</h4>
                </div>
                <ul className="analysis-list">
                  {result.strengths && result.strengths.map((s, i) => (
                    <li key={i} className="analysis-item">{s}</li>
                  ))}
                </ul>
              </div>
              
              <div className="analysis-section weaknesses">
                <div className="section-header">
                  <span className="section-icon">🔍</span>
                  <h4 className="section-title">Areas for Improvement</h4>
                </div>
                <ul className="analysis-list">
                  {result.weaknesses && result.weaknesses.map((w, i) => (
                    <li key={i} className="analysis-item">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
