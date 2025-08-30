import DashboardLayout from '../components/DashboardLayout';
import { Outlet, Routes, Route, Navigate } from 'react-router-dom';
import { FiHome, FiBriefcase, FiMessageCircle, FiEdit, FiUserCheck, FiFileText, FiCreditCard, FiList } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Payment from './Payment';
import PaymentConfirm from './PaymentConfirm';
import EditProfile from './EditProfile';

import Applications from './Applications';
import Jobs from './Jobs';
import Chat from './Chat';
import Partices from './Partices';
import ResumeChecker from './ResumeChecker';
import DashboardHome from './DashboardHome';
import MCQs from './MCQs';
import Coding from './Coding';
import Interview from './Interview';

export default function CandidateDashboard() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch unread messages count (dynamic from /chat/chats)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/chat/chats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = Array.isArray(res.data) ? res.data : [];
        const total = list.reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0);
        setUnreadCount(total);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
        setUnreadCount(0);
      }
      setLoading(false);
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const candidateMenu = [
    { label: 'Dashboard', path: '/candidate/dashboard', icon: <FiHome /> },
    { label: 'My Applications', path: '/candidate/applications', icon: <FiList /> },
    { label: 'Find Jobs', path: '/candidate/jobs', icon: <FiBriefcase /> },
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
      path: '/candidate/chat', 
      icon: <FiMessageCircle /> 
    },
    { label: 'Partices', path: '/candidate/partices', icon: <FiUserCheck /> },
    { label: 'Edit Profile', path: '/candidate/edit-profile', icon: <FiEdit /> },
    { label: 'Resume Checker', path: '/candidate/resume-checker', icon: <FiFileText /> },
    { label: 'Support / Payment', path: '/candidate/payment-confirm', icon: <FiCreditCard /> },
  ];
  return (
    <DashboardLayout menuItems={candidateMenu}>
      <Routes>
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="applications" element={<Applications />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="chat" element={<Chat />} />
        <Route path="partices" element={<Partices />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="resume-checker" element={<ResumeChecker />} />
        <Route path='payment-confirm' element={<PaymentConfirm />} />
        <Route path='payment' element={<Payment />} />
        
        {/* Test Components */}
        <Route path="mcqs" element={<MCQs />} />
        <Route path="coding" element={<Coding />} />
        <Route path="interview" element={<Interview />} />
        
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
