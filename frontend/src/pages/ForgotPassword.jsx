import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

// API base URL
const API_URL = 'http://localhost:8080/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [step, setStep] = useState(1); // 1: email, 2: reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!password) {
      showError('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      showError('Passwords do not match.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword: password,
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

  return (
    <div className="auth-container">
      <div className="left-box">
        <div className="floating-elements">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
        </div>
        <img src="/logo.png" alt="SmartHireX Logo" className="auth-logo" />
        <h1>Reset Your <span>Password</span></h1>
        <p className="tagline">
          {step === 1 ? 'Enter your email to receive reset code' : 'Enter code and new password'}
        </p>
      </div>
      
      <div className="right-box">
        <div className="auth-card">
          <h2>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
          
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
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
                  />
                  <label htmlFor="otp">Reset Code</label>
                </div>
                
                <div className="input-container">
                  <input
                    id="newPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="newPassword">New Password</label>
                </div>
                
                <div className="input-container">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label htmlFor="confirmPassword">Confirm Password</label>
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
    </div>
  );
}
