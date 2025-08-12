import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function OAuthSuccess() {
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    if (token && role) {
      localStorage.setItem('token', token);
      if (role === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else if (role === 'recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      setTimeout(() => navigate('/', { replace: true }), 1500);
    }
  }, [navigate]);
  return <div>Redirecting...</div>;
}

export default OAuthSuccess;
