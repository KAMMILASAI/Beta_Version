import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

const googleLogo = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const githubLogo = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

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

const Register = () => {
  // Force refresh - updated styles
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('candidate');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'oauth_register_required') {
      setError('Please register first before using social login.');
    }
  }, [location]);

  const sendOtp = async () => {
    if (!email) {
      setError('Please enter email first');
      return;
    }
    setError('');
    setLoadingOtp(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/send-otp', { email });
      if (res.data.message === 'OTP sent successfully') {
        alert('OTP sent to your email');
        setShowOtpInput(true);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoadingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      setError('Please enter OTP');
      return;
    }
    setError('');
    setLoadingVerify(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
      if (res.data.message === 'OTP Verified') {
        alert('Email verified successfully!');
        setEmailVerified(true);
        setShowOtpInput(false);
      } else {
        setError(res.data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        firstName, lastName, email, phone, password, role
      });
      alert(res.data.message);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
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
        <h1>Create Your <span>SmartHireX</span> Account</h1>
        <p className="tagline">Join our platform to unlock new opportunities</p>
        
        {/* Simple Role Selection on Left Side */}
        <div className="role-selection-simple">
          <h3>Select Your Role</h3>
          <div className="role-buttons">
            <button 
              type="button"
              className={`role-btn ${role === 'candidate' ? 'active' : ''}`}
              onClick={() => setRole('candidate')}
            >
              👤 Candidate
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'recruiter' ? 'active' : ''}`}
              onClick={() => setRole('recruiter')}
            >
              💼 Recruiter
            </button>
          </div>
        </div>
      </div>
      <div className="right-box">
        <div className="auth-card">
          <h2>Sign Up as {role === 'candidate' ? 'Candidate' : 'Recruiter'}</h2>
          
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-row">
              <div className="input-container">
                <input id="firstName" type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder=" " required />
                <label htmlFor="firstName">First Name</label>
              </div>
              <div className="input-container">
                <input id="lastName" type="text" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder=" " required />
                <label htmlFor="lastName">Last Name</label>
              </div>
            </div>
            
            {/* Email Verification Section */}
            <div className="email-verify-container">
              <div className="input-container" style={{flex:1}}>
                <input 
                  id="registerEmail"
                  type="email"
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  placeholder=" " 
                  disabled={emailVerified}
                  style={{opacity: emailVerified ? 0.7 : 1}}
                  required
                />
                <label htmlFor="registerEmail">Email</label>
              </div>
              {!emailVerified && (
                <button 
                  type="button"
                  onClick={sendOtp}
                  disabled={!email || loadingOtp}
                  className="verify-btn"
                >
                  {loadingOtp ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : 'Verify'}
                </button>
              )}
              {emailVerified && (
                <span className="verification-status">✓ Verified</span>
              )}
            </div>
            
            {/* OTP Input */}
            {showOtpInput && (
              <div className="otp-verify-container">
                <div className="input-container" style={{flex:1}}>
                  <input 
                    id="registerOtp"
                    value={otp} 
                    onChange={e=>setOtp(e.target.value)} 
                    placeholder=" " 
                    required
                  />
                  <label htmlFor="registerOtp">Enter OTP</label>
                </div>
                <button 
                  type="button"
                  onClick={verifyOtp}
                  disabled={!otp || loadingVerify}
                  className="verify-btn"
                >
                  {loadingVerify ? (
                    <>
                      <span className="spinner"></span>
                      Verifying...
                    </>
                  ) : 'Verify OTP'}
                </button>
              </div>
            )}
            
            <div className="input-container">
              <input id="phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder=" " required />
              <label htmlFor="phone">Phone</label>
            </div>
            <div className="input-container password-container">
              <input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder=" " 
                required 
                className={password ? 'has-value' : ''}
              />
              <label htmlFor="password">Password</label>
              <button 
                type="button" 
                className="password-eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? eyeOffIcon : eyeIcon}
              </button>
            </div>
            <div className="input-container password-container">
              <input 
                id="confirmPassword" 
                type={showConfirmPassword ? 'text' : 'password'} 
                value={confirm} 
                onChange={e=>setConfirm(e.target.value)} 
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
              >
                {showConfirmPassword ? eyeOffIcon : eyeIcon}
              </button>
            </div>
            <button 
              type="submit"
              className="auth-btn"
              disabled={!(firstName && lastName && emailVerified && phone && password && confirm) || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : 'Sign Up'}
            </button>
            
            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}
            
            {/* Social Login Buttons */}
            <div className="social-login-section">
              <p className="social-login-title">Or sign up with</p>
              <div className="social-login-container">
                <button className="social-btn" onClick={()=>window.location.href=`http://localhost:5000/api/auth/google?role=${role}`}>
                  {googleLogo}
                </button>
                <button className="social-btn" onClick={()=>window.location.href=`http://localhost:5000/api/auth/github?role=${role}`}>
                  {githubLogo}
                </button>
              </div>
            </div>
            
            {/* Navigation Link to Login */}
            <div className="auth-nav-link">
              Already have an account? <span className="nav-link-btn" onClick={() => navigate('/')}>Sign In</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;