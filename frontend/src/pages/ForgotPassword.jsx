import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: email, 2: reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendOtp = async () => {
    if (!email) return;
    try {
      setLoading(true);
      setMessage('');
      await axios.post('http://localhost:5000/api/auth/forgot-password/send-otp', { email });
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp || !password || password !== confirm) {
      setMessage('Please enter all fields and ensure passwords match.');
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      await axios.post('http://localhost:5000/api/auth/forgot-password/reset', {
        email,
        otp,
        newPassword: password,
      });
      alert('Password updated successfully! Please login with new password.');
      navigate('/');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reset password');
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
          
          {message && (
            <div className={`auth-message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
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
