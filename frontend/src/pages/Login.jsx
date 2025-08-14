import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
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

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const message = urlParams.get('message');
    const errorParam = urlParams.get('error');
    
    if (message === 'recruiter_pending') {
      showError('Your recruiter registration is pending admin approval. You will receive an email once reviewed.');
    }
    
    if (errorParam) {
      showError(errorParam);
    }
    
    // Check for OAuth2 success message
    if (location.state?.success) {
      showSuccess(location.state.success);
    }
    
    if (location.state?.error) {
      showError(location.state.error);
    }
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [location, showError, showSuccess]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (res.data.otpRequired) {
        showSuccess('OTP sent to your email! Please check your inbox.');
        setShowOtp(true);
      } else if (res.data.accessToken || res.data.token) {
        const token = res.data.accessToken || res.data.token;
        showSuccess('Login successful! Redirecting...');
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        setTimeout(() => {
          const userRole = res.data.user?.role || 'candidate';
          if (userRole === 'admin') {
            navigate('/admin/dashboard');
          } else if (userRole === 'recruiter') {
            navigate('/recruiter/dashboard');
          } else {
            navigate('/candidate/dashboard');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        showError('Invalid email or password. Please try again.');
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otp || otp.length !== 6) {
      showError('Please enter a valid 6-digit OTP.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/auth/verify-login-otp`, { email, otp });
      
      if (res.data.accessToken || res.data.token) {
        const token = res.data.accessToken || res.data.token;
        showSuccess('OTP verified successfully! Redirecting...');
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        }
        
        setTimeout(() => {
          const userRole = res.data.user?.role || 'candidate';
          if (userRole === 'admin') {
            navigate('/admin/dashboard');
          } else if (userRole === 'recruiter') {
            navigate('/recruiter/dashboard');
          } else {
            navigate('/candidate/dashboard');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="auth-container">
      <div className="left-box">
        <div className="floating-elements">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
          <div className="floating-element element-4"></div>
          <div className="floating-element element-5"></div>
        </div>
        <div className="brand-section">
          <div className="logo-container">
            <img src="/logo.png" alt="SmartHireX Logo" className="auth-logo" />
            <div className="logo-glow"></div>
          </div>
          <h1 className="brand-title">
            Welcome to <span className="brand-highlight">SmartHireX</span>
          </h1>
          <p className="brand-subtitle">Your gateway to exceptional talent and opportunities</p>
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">🚀</div>
              <span>Fast & Secure Login</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <span>Advanced Security</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="right-box">
        <div className="auth-card">
          <div className="card-header">
            <h2 className="card-title">Welcome Back</h2>
            <p className="card-subtitle">Sign in to continue your journey</p>
          </div>
          
          <form onSubmit={showOtp ? (e) => { e.preventDefault(); handleOtpVerify(); } : handleLogin} className="auth-form">
            <div className="input-group">
              <div className="input-container">
                <input 
                  id="loginEmail" 
                  type="email"
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  placeholder=" " 
                  required 
                  className={email ? 'has-value' : ''}
                />
                <label htmlFor="loginEmail">Email Address</label>
              </div>
              
              {!showOtp && (
                <div className="input-container password-container">
                  <input 
                    id="loginPassword" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    placeholder=" " 
                    required 
                    className={password ? 'has-value' : ''}
                  />
                  <label htmlFor="loginPassword">Password</label>
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 999,
                      width: '20px',
                      height: '20px'
                    }}
                  >
                    {showPassword ? eyeOffIcon : eyeIcon}
                  </button>
                </div>
              )}
              
              {showOtp && (
                <div className="input-container otp-container">
                  <input 
                    id="loginOtp" 
                    value={otp} 
                    onChange={e=>setOtp(e.target.value)} 
                    placeholder=" " 
                    required 
                    maxLength="6"
                    className={otp ? 'has-value' : ''}
                  />
                  <label htmlFor="loginOtp">Enter 6-digit OTP</label>
                </div>
              )}
            </div>
            
            {!showOtp && (
              <div className="form-options">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot password?
                </Link>
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
                  <span>{showOtp ? 'Verifying...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{showOtp ? 'Verify OTP' : 'Sign In'}</span>
                  <div className="btn-arrow">→</div>
                </>
              )}
            </button>
            
            {/* Success Message */}
            {success && (
              <div className="success-message">
                <div className="success-icon">✅</div>
                <span>{success}</span>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="error-message">
                <div className="error-icon">❌</div>
                <span>{error}</span>
              </div>
            )}
            
            {!showOtp && (
              <>
                {/* Divider */}
                <div className="divider">
                  <span>or continue with</span>
                </div>
                
                {/* Social Login Buttons */}
                <div className="social-login-container">
                  <button 
                    type="button"
                    className="social-btn google-btn" 
                    onClick={() => {
                      const redirectUri = `${window.location.origin}/oauth2/redirect`;
                      window.location.href = `${API_URL}/oauth2/authorize/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
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
                      window.location.href = `${API_URL}/oauth2/authorize/github?redirect_uri=${encodeURIComponent(redirectUri)}`;
                    }}
                    title="Continue with GitHub"
                  >
                    {githubLogo}
                  </button>
                </div>
              </>
            )}
            
            {/* Navigation Link to Register */}
            <div className="auth-nav-link">
              Don't have an account? <span className="nav-link-btn" onClick={() => navigate('/register')}>Create Account</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;