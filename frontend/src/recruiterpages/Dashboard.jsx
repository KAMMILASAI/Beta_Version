import DashboardLayout from '../components/DashboardLayout';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FiHome, FiFilePlus, FiUsers, FiMessageCircle, FiUser, FiEdit, FiBarChart2, FiCreditCard, FiClock } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Payment from './Payment';
import PaymentConfirm from './PaymentConfirm';
import GenerateTest from './GenerateTest';
import Interview from './Interview';
import Chat from './Chat';
import CandidateProfiles from './CandidateProfiles';
import EditProfile from './EditProfile';
import Results from './Results';
import JobHistory from './JobHistory';
import DashboardHome from './DashboardHome';

export default function RecruiterDashboard() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch unread messages count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/chat/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(res.data.totalUnreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
        setUnreadCount(0);
      }
      setLoading(false);
    };

    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const recruiterMenu = [
    { label: 'Dashboard', path: '/recruiter/dashboard', icon: <FiHome /> },
    { label: 'Generate Test', path: '/recruiter/generate-test', icon: <FiFilePlus /> },
    { label: 'Interview', path: '/recruiter/interview', icon: <FiUsers /> },
    { 
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Chat</span>
          {!loading && unreadCount > 0 && (
            <span style={{
              background: '#dc3545',
              color: 'white',
              padding: '0.15rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </div>
      ), 
      path: '/recruiter/chat', 
      icon: <FiMessageCircle /> 
    },
    { label: 'Candidate Profiles', path: '/recruiter/candidate-profiles', icon: <FiUser /> },
    { label: 'Edit Profile', path: '/recruiter/edit-profile', icon: <FiEdit /> },
    { label: 'Job History', path: '/recruiter/job-history', icon: <FiClock /> },
    { label: 'Results', path: '/recruiter/results', icon: <FiBarChart2 /> },
    { label: 'Support / Payment', path: '/recruiter/payment-confirm', icon: <FiCreditCard /> },
  ];
  return (
    <DashboardLayout menuItems={recruiterMenu}>
      <Routes>
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="generate-test" element={<GenerateTest />} />
        <Route path="interview" element={<Interview />} />
        <Route path="chat" element={<Chat />} />
        <Route path="candidate-profiles" element={<CandidateProfiles />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="job-history" element={<JobHistory />} />
        <Route path="results" element={<Results />} />
        <Route path="payment-confirm" element={<PaymentConfirm />} />
        <Route path="payment" element={<Payment />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
