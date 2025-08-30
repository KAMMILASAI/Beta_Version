import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

// API base URL
const API_URL = 'http://localhost:8080/api';

const googleLogo = (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const appleLogo = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.365 1.43c0 1.14-.47 2.22-1.11 3.02-.66.82-1.77 1.45-2.87 1.36-.11-1.1.48-2.23 1.11-2.94.7-.85 1.93-1.46 2.87-1.44zM20.94 17.06c-.6 1.39-.9 1.99-1.7 3.21-1.1 1.67-2.65 3.75-4.55 3.76-1.06.02-1.78-.71-3.12-.71-1.35 0-2.13.69-3.2.72-1.9.07-3.35-1.8-4.45-3.46-2.43-3.7-2.69-8.03-1.19-10.34 1.07-1.7 2.76-2.68 4.35-2.68 1.62 0 2.64.73 3.98.73 1.31 0 2.09-.73 3.97-.73 1.47 0 3.02.8 4.09 2.19-3.6 1.98-3.02 7.13.82 8.11z"/>
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
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();
  const [role, setRole] = useState('candidate');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [isOAuth2, setIsOAuth2] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    const oauth2User = location.state?.oauthUser || urlParams.get('oauth2User') === 'true';
    const oauthEmail = location.state?.email || urlParams.get('email');
    const oauthName = location.state?.name || urlParams.get('name');
    
    if (errorParam === 'oauth_register_required') {
      showError('Please register first before using social login.');
    }
    
    // Handle OAuth2 user data
    if (oauth2User && oauthEmail) {
      setEmail(oauthEmail);
      setEmailVerified(true);
      setIsOAuth2(true);
      setShowOtpInput(false);
      showInfo('Email verified via OAuth2. Please complete your registration.');
      
      // Try to extract first and last name from OAuth2 name
      if (oauthName) {
        const nameParts = oauthName.split(' ');
        if (nameParts.length > 0) {
          setFirstName(nameParts[0]);
          if (nameParts.length > 1) {
            setLastName(nameParts.slice(1).join(' '));
          }
        }
      }
      
      // Show success message
      setSuccess('Please complete your registration to continue');
    }
  }, [location]);

  const sendOtp = async () => {
    if (!email) {
      setError('Please enter email first');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    setLoadingOtp(true);
    
    try {
      const res = await axios.post(`${API_URL}/auth/send-registration-otp`, { 
        email,
        name: firstName || 'User' // Send name for personalized email
      });
      
      if (res.data.message === 'OTP sent successfully to your email' || res.data.success) {
        setSuccess('OTP has been sent to your email');
        setShowOtpInput(true);
      } else {
        const msg = res.data.message || 'Failed to send OTP. Please try again.';
        showError(msg);
        setError(msg);
        setShowOtpInput(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to send OTP. Please try again.';
      showError(errorMessage);
      setError(errorMessage);
      setShowOtpInput(false);
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      setError('Please enter the OTP sent to your email');
      return;
    }
    
    // Basic OTP validation
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const res = await axios.post(`${API_URL}/auth/verify-registration-otp`, { 
        email, 
        otp
      });
      
      if (res.data.message === 'OTP verified successfully' || res.data.success) {
        showSuccess('Email verified successfully!');
        setEmailVerified(true);
        setShowOtp(false);
        setShowOtpInput(false);
      } else {
        setError(res.data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to verify OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP sent to your email');
      return;
    }
    
    // Basic OTP validation
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setError('');
    setLoadingVerify(true);
    
    try {
      const res = await axios.post(`${API_URL}/auth/verify-registration-otp`, { 
        email, 
        otp
      });
      
      if (res.data.message === 'OTP verified successfully' || res.data.success) {
        setSuccess('Email verified successfully!');
        setEmailVerified(true);
        setShowOtpInput(false);
      } else {
        setError(res.data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to verify OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!firstName.trim()) {
      showError('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      showError('Last name is required.');
      return;
    }
    if (!emailVerified) {
      showError('Please verify your email first.');
      return;
    }
    if (!isOAuth2) {
      if (!phone.trim()) {
        showError('Phone number is required.');
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
    } else {
      // If coming from OAuth2, allow empty phone/password. If password provided, ensure match.
      if (password || confirm) {
        if (password.length < 6) {
          showError('Password must be at least 6 characters long.');
          return;
        }
        if (password !== confirm) {
          showError('Passwords do not match.');
          return;
        }
      }
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: role || 'candidate',
        otp: otp, // Include OTP for backend verification (not used for OAuth2)
        verified: true // Since we've verified via OTP or OAuth2
      };
      if (phone.trim()) userData.phone = phone.trim();
      if (password) userData.password = password;
      if (isOAuth2) userData.oauth2 = true;
      
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      
      // Success path: token present OR success message
      if (res.data.accessToken || res.data.token || res.data.message) {
        // Check if we got a token for auto-login
        const token = res.data.accessToken || res.data.token;
        
        if (token && res.data.user) {
          // Auto-login after successful registration
          showSuccess('Registration successful! Redirecting to your dashboard...');
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          
          // Clear form
          setFirstName('');
          setLastName('');
          setEmail('');
          setPhone('');
          setPassword('');
          setConfirm('');
          setEmailVerified(false);
          
          // Redirect to dashboard based on role
          setTimeout(() => {
            const userRole = res.data.user?.role || role || 'candidate';
            if (userRole === 'admin') {
              navigate('/admin/dashboard');
            } else if (userRole === 'recruiter') {
              navigate('/recruiter/dashboard');
            } else {
              navigate('/candidate/dashboard');
            }
          }, 1500);
        } else {
          // Registration successful but no token (e.g., recruiter pending approval)
          const msg = res.data.message || 'Registration successful! Please login with your credentials.';
          showSuccess(msg);
          
          // Clear form
          setFirstName('');
          setLastName('');
          setEmail('');
          setPhone('');
          setPassword('');
          setConfirm('');
          setEmailVerified(false);
          
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        showError(res.data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left: Register form */}
      <div className="left-box">
        <div className="auth-card">
          {/* Role toggle at top of form */}
          <div className="role-toggle" aria-label="Select role">
            <label className="role-switch">
              <input
                type="checkbox"
                className="role-switch-input"
                checked={role === 'recruiter'}
                onChange={(e) => setRole(e.target.checked ? 'recruiter' : 'candidate')}
                aria-checked={role === 'recruiter'}
                aria-label="Toggle between Candidate and Recruiter"
              />
              <span className="role-switch-track">
                <span className={`role-switch-option left ${role === 'candidate' ? 'active' : ''}`}>
                  <span className="role-text">Candidate</span>
                </span>
                <span className={`role-switch-option right ${role === 'recruiter' ? 'active' : ''}`}>
                  <span className="role-text">Recruiter</span>
                </span>
                <span className={`role-switch-knob ${role === 'recruiter' ? 'right' : 'left'}`}></span>
              </span>
            </label>
          </div>

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
          
          {/* Email + OTP side-by-side when OTP is shown */}
          {showOtpInput ? (
            <div className="input-row">
              <div className="col" style={{flex:1}}>
                <div className="input-container">
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
                {!emailVerified ? (
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
                    ) : 'Resend OTP'}
                  </button>
                ) : (
                  <span className="verification-status">✓ Verified</span>
                )}
              </div>
              <div className="col" style={{flex:1}}>
                <div className="input-container">
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
            </div>
          ) : (
            /* Email only row (before OTP is requested) */
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
              {!emailVerified ? (
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
              ) : (
                <span className="verification-status">✓ Verified</span>
              )}
            </div>
          )}
            
          <div className="input-container">
            <input id="phone" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder=" " required={!isOAuth2} />
            <label htmlFor="phone">Phone</label>
          </div>
          {/* Stack password fields vertically */}
          <div className="input-container password-container">
            <input 
              id="password" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              placeholder=" " 
              required={!isOAuth2} 
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
              required={!isOAuth2} 
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
                disabled={!(firstName && lastName && emailVerified && (isOAuth2 || (phone && password && confirm))) || isLoading}
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
                  <button 
                    type="button"
                    className="social-btn google-btn"
                    onClick={() => {
                      const redirectUri = `${window.location.origin}/oauth2/redirect`;
                      const desiredRole = role || 'candidate';
                      window.location.href = `${API_URL}/oauth2/authorize/google?redirect_uri=${encodeURIComponent(redirectUri)}&role=${encodeURIComponent(desiredRole)}&source=register`;
                    }}
                    title="Continue with Google"
                  >
                    {googleLogo}
                    <span>Continue with Google</span>
                  </button>
                  <button 
                    type="button"
                    className="social-btn github-btn"
                    onClick={() => {
                      const redirectUri = `${window.location.origin}/oauth2/redirect`;
                      const desiredRole = role || 'candidate';
                      window.location.href = `${API_URL}/oauth2/authorize/github?redirect_uri=${encodeURIComponent(redirectUri)}&role=${encodeURIComponent(desiredRole)}&source=register`;
                    }}
                    title="Continue with GitHub"
                  >
                    {githubLogo}
                    <span>Continue with GitHub</span>
                  </button>
                  <button 
                    type="button"
                    className="social-btn apple-btn"
                    title="Continue with Apple"
                  >
                    {appleLogo}
                    <span>Continue with Apple</span>
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

      {/* Right: Illustration */}
      <div className="right-box">
        <div className="illustration-wrap">
          <div className="right-oval"></div>
          <img src="/Auth-logo.png" alt="Illustration" className="illustration-img" />
        </div>
        
        {/* Mobile Form - Duplicate for mobile view */}
        <div className="mobile-auth-card">
          <div className="mobile-auth-header">
            <div className="mobile-logo-section">
              <h1>Register</h1>
              <img src="/Auth-logo.png" alt="SmartHireX Logo" className="mobile-auth-logo" />
            </div>
          </div>
          <div className="card-header">
            <p className="card-subtitle">Join SmartHireX to find your dream job or hire top talent.</p>
          </div>

          <form onSubmit={showOtp ? handleOtpVerify : handleRegister} className="auth-form">
            {/* Role Toggle */}
            <div className="role-toggle">
              <button
                type="button"
                className={`role-option ${role === 'candidate' ? 'active' : ''}`}
                onClick={() => setRole('candidate')}
              >
                <span className="role-text">Candidate</span>
              </button>
              <button
                type="button"
                className={`role-option ${role === 'recruiter' ? 'active' : ''}`}
                onClick={() => setRole('recruiter')}
              >
                <span className="role-text">Recruiter</span>
              </button>
            </div>

            {!showOtp ? (
              <>
                <div className="input-row">
                  <div className="input-container">
                    <input 
                      id="mobileFirstName" 
                      type="text" 
                      value={firstName} 
                      onChange={e=>setFirstName(e.target.value)} 
                      placeholder=" " 
                      required 
                      className={firstName ? 'has-value' : ''}
                    />
                    <label htmlFor="mobileFirstName">First Name</label>
                  </div>
                  <div className="input-container">
                    <input 
                      id="mobileLastName" 
                      type="text" 
                      value={lastName} 
                      onChange={e=>setLastName(e.target.value)} 
                      placeholder=" " 
                      required 
                      className={lastName ? 'has-value' : ''}
                    />
                    <label htmlFor="mobileLastName">Last Name</label>
                  </div>
                </div>

                <div className="email-verify-row">
                  <div className="email-input-wrapper">
                    <div className="input-container">
                      <input 
                        id="mobileRegEmail" 
                        type="email" 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        placeholder=" " 
                        required 
                        className={email ? 'has-value' : ''}
                      />
                      <label htmlFor="mobileRegEmail">Email Address</label>
                    </div>
                  </div>
                  <div className="verify-btn-wrapper">
                    {!emailVerified && !showOtpInput && (
                      <button 
                        type="button" 
                        className="verify-email-btn-side"
                        onClick={sendOtp}
                        disabled={loadingOtp || !email}
                      >
                        {loadingOtp ? 'Sending...' : 'Verify'}
                      </button>
                    )}
                    {emailVerified && (
                      <span className="verified-badge-side">✓ Verified</span>
                    )}
                  </div>
                </div>

                {showOtpInput && (
                  <div className="input-container otp-verify-container">
                    <input 
                      id="mobileOtpInput" 
                      type="text" 
                      value={otp} 
                      onChange={e=>setOtp(e.target.value)} 
                      placeholder=" " 
                      required 
                      maxLength="6"
                      className={otp ? 'has-value' : ''}
                    />
                    <label htmlFor="mobileOtpInput">Enter 6-digit OTP</label>
                    <button 
                      type="button" 
                      className="verify-otp-btn"
                      onClick={verifyOtp}
                      disabled={loadingVerify || !otp}
                    >
                      {loadingVerify ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                )}

                <div className="input-container password-container">
                  <input 
                    id="mobileRegPassword" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    placeholder=" " 
                    required 
                    className={password ? 'has-value' : ''}
                  />
                  <label htmlFor="mobileRegPassword">Password</label>
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
                    id="mobileConfirmPassword" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={e=>setConfirmPassword(e.target.value)} 
                    placeholder=" " 
                    required 
                    className={confirmPassword ? 'has-value' : ''}
                  />
                  <label htmlFor="mobileConfirmPassword">Confirm Password</label>
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
            ) : (
              <div className="input-container">
                <input 
                  id="mobileRegOtp" 
                  type="text" 
                  value={otp} 
                  onChange={e=>setOtp(e.target.value)} 
                  placeholder=" " 
                  required 
                  maxLength="6"
                  className={otp ? 'has-value' : ''}
                />
                <label htmlFor="mobileRegOtp">Enter 6-digit OTP</label>
              </div>
            )}

            <button 
              type="submit" 
              className={`auth-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  {showOtp ? 'Verifying OTP...' : 'Creating Account...'}
                </>
              ) : (showOtp ? 'Verify OTP' : 'Sign Up')}
            </button>
            
            {error && <div className="error-message">{error}</div>}
            
            {!showOtp && (
              <>
                <div className="divider">
                  <span>- or -</span>
                </div>
                <div className="social-login-container">
                  <button 
                    type="button"
                    className="social-btn google-btn"
                    onClick={() => {
                      const redirectUri = `${window.location.origin}/oauth2/redirect`;
                      const desiredRole = role || 'candidate';
                      window.location.href = `${API_URL}/oauth2/authorize/google?redirect_uri=${encodeURIComponent(redirectUri)}&role=${encodeURIComponent(desiredRole)}&source=register`;
                    }}
                    title="Continue with Google"
                  >
                    {googleLogo}
                  </button>
                  <button 
                    type="button"
                    className="social-btn github-btn"
                    onClick={() => {
                      const redirectUri = `${window.location.origin}/oauth2/redirect`;
                      const desiredRole = role || 'candidate';
                      window.location.href = `${API_URL}/oauth2/authorize/github?redirect_uri=${encodeURIComponent(redirectUri)}&role=${encodeURIComponent(desiredRole)}&source=register`;
                    }}
                    title="Continue with GitHub"
                  >
                    {githubLogo}
                  </button>
                  <button 
                    type="button"
                    className="social-btn apple-btn"
                    title="Continue with Apple"
                  >
                    {appleLogo}
                  </button>
                </div>
              </>
            )}
            
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