import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

// API base URL
const API_URL = 'http://localhost:8080/api';

const eyeIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const eyeOffIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [step, setStep] = useState(1); // 1: email, 2: reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const sendOtp = async () => {
    if (!email) {
      showError('Please enter your email address.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      
      if (response.data.message) {
        showSuccess('Reset code sent to your email! Please check your inbox.');
        setStep(2);
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      showError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp) {
      showError('Please enter the reset code.');
      return;
    }
    if (!newPassword) {
      showError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword: newPassword,
      });
      
      if (response.data.message) {
        showSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      showError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      sendOtp();
    } else if (step === 2) {
      setStep(3);
    } else {
      resetPassword();
    }
  };

  return (
    <div className="auth-container forgot-page">
      {/* Left: Form (match Login layout) */}
      <div className="left-box">
        <div className="auth-card">
          <div className="card-header">
            <h2 className="card-title">{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <div className="input-container">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    required
                    className={email ? 'has-value' : ''}
                  />
                  <label htmlFor="email">Email Address</label>
                </div>
                
                <button 
                  type="button"
                  className={`auth-btn ${loading ? 'loading' : ''}`}
                  disabled={!email || loading}
                  onClick={sendOtp}
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </>
            ) : (
              <>
                <div className="input-container">
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder=" "
                    required
                    className={otp ? 'has-value' : ''}
                  />
                  <label htmlFor="otp">Reset Code</label>
                </div>
                
                <div className="input-container password-container">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    required
                    className={password ? 'has-value' : ''}
                  />
                  <label htmlFor="newPassword">New Password</label>
                  <button
                    type="button"
                    className="password-eye-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className="input-container password-container">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder=" "
                    required
                    className={confirm ? 'has-value' : ''}
                  />
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <button
                    type="button"
                    className="password-eye-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                <button 
                  type="button"
                  className={`auth-btn ${loading ? 'loading' : ''}`}
                  disabled={loading || !otp || !password || password !== confirm}
                  onClick={resetPassword}
                >
                  {loading ? 'Updating...' : 'Reset Password'}
                </button>
              </>
            )}
            
            {/* Navigation Link */}
            <div className="auth-nav-link">
              Remember your password? <Link to="/" className="nav-link-btn">Back to Login</Link>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right: Illustration (match Login layout) */}
      <div className="right-box">
        <div className="illustration-wrap">
          <div className="right-oval"></div>
          <img src="/Auth-logo.png" alt="Illustration" className="illustration-img" />
        </div>
        
        {/* Mobile Form - Duplicate for mobile view */}
        <div className="mobile-auth-card">
          <div className="mobile-auth-header">
            <div className="mobile-logo-section">
              <h1>Reset Password</h1>
              <img src="/Auth-logo.png" alt="SmartHireX Logo" className="mobile-auth-logo" />
            </div>
          </div>
          <div className="card-header">
            <p className="card-subtitle">Enter your email to receive a password reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {step === 1 && (
              <div className="input-container">
                <input 
                  id="mobileForgotEmail" 
                  type="email" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  placeholder=" " 
                  required 
                  className={email ? 'has-value' : ''}
                />
                <label htmlFor="mobileForgotEmail">Email Address</label>
              </div>
            )}

            {step === 2 && (
              <div className="input-container">
                <input 
                  id="mobileForgotOtp" 
                  type="text" 
                  value={otp} 
                  onChange={e=>setOtp(e.target.value)} 
                  placeholder=" " 
                  required 
                  maxLength="6"
                  className={otp ? 'has-value' : ''}
                />
                <label htmlFor="mobileForgotOtp">Enter 6-digit OTP</label>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="input-container password-container">
                  <input 
                    id="mobileNewPassword" 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={e=>setNewPassword(e.target.value)} 
                    placeholder=" " 
                    required 
                    className={newPassword ? 'has-value' : ''}
                  />
                  <label htmlFor="mobileNewPassword">New Password</label>
                  <button 
                    type="button" 
                    className="password-eye-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? eyeOffIcon : eyeIcon}
                  </button>
                </div>

                <div className="input-container password-container">
                  <input 
                    id="mobileConfirmNewPassword" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={e=>setConfirmPassword(e.target.value)} 
                    placeholder=" " 
                    required 
                    className={confirmPassword ? 'has-value' : ''}
                  />
                  <label htmlFor="mobileConfirmNewPassword">Confirm New Password</label>
                  <button 
                    type="button" 
                    className="password-eye-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? eyeOffIcon : eyeIcon}
                  </button>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className={`auth-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>
                    {step === 1 ? 'Sending...' : step === 2 ? 'Verifying...' : 'Updating...'}
                  </span>
                </>
              ) : (
                <span>
                  {step === 1 ? 'Send Reset Link' : step === 2 ? 'Verify OTP' : 'Reset Password'}
                </span>
              )}
            </button>
            
            <div className="auth-nav-link">
              Remember your password? <span className="nav-link-btn" onClick={() => navigate('/')}>Back to Login</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
