import DashboardLayout from '../components/DashboardLayout';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FiHome, FiUsers, FiUserCheck, FiBarChart2, FiMessageCircle, FiInbox, FiCreditCard, FiBell } from 'react-icons/fi';
import Payments from './Payments';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Candidates from './Candidates';
import Recruiters from './Recruiters';
import Analysis from './Analysis';
import Chat from './Chat';
import SendNotification from './SendNotification';
import Requests from './Requests';
import AdminDashboardHome from './DashboardHome';

export default function AdminDashboard() {
  const [requestsCount, setRequestsCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch pending requests count
  useEffect(() => {
    const fetchRequestsCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/pending-recruiters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequestsCount(res.data.count || 0);
      } catch (err) {
        console.error('Failed to fetch requests count:', err);
        setRequestsCount(0);
      }
      setLoading(false);
    };

    fetchRequestsCount();

    const fetchTotal = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/payments/total', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTotalAmount(res.data.total || 0);
      } catch (e) {
        setTotalAmount(0);
      }
    };

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
    };

    fetchTotal();
    fetchUnreadCount();
 
    // Refresh every 30 seconds
    const interval = setInterval(()=>{fetchRequestsCount();fetchTotal();fetchUnreadCount();}, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic menu with count
  const adminMenu = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <FiHome /> },
    { 
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Requests</span>
          {!loading && requestsCount > 0 && (
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
              {requestsCount}
            </span>
          )}
        </div>
      ), 
      path: '/admin/requests', 
      icon: <FiInbox /> 
    },
    { label: 'Candidates', path: '/admin/candidates', icon: <FiUsers /> },
    { label: 'Recruiters', path: '/admin/recruiters', icon: <FiUserCheck /> },
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
      path: '/admin/chat', 
      icon: <FiMessageCircle /> 
    },
    { label: 'Send Notification', path: '/admin/send-notification', icon: <FiBell /> },
    { label: (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
          <span>Payments</span>
          <span style={{ fontSize:'.75rem', fontWeight:'600', color:'#28a745' }}>
            ₹{totalAmount}
          </span>
        </div>
      ), path:'/admin/payments', icon:<FiCreditCard /> },
  ];

  return (
    <DashboardLayout menuItems={adminMenu}>
      <Routes>
        <Route path="dashboard" element={<AdminDashboardHome />} />
        <Route path="requests" element={<Requests />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="recruiters" element={<Recruiters />} />
        <Route path="chat" element={<Chat />} />
        <Route path="send-notification" element={<SendNotification />} />
        <Route path="payments" element={<Payments />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
