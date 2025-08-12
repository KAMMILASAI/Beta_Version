import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiBell, FiUser, FiX } from 'react-icons/fi';
import axios from 'axios';
import OnlineCounter from './OnlineCounter';
import './DashboardLayout.css';
import './NotificationDrawer.css';

function getUsername() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.firstName || payload.email || 'User';
  } catch {
    return 'User';
  }
}

function getUserRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'candidate';
  } catch {
    return 'candidate';
  }
}

export default function DashboardLayout({ children, menuItems }) {
  const defaultMenu = [
    { label: 'Dashboard', path: '/dashboard' },
  ];
  menuItems = menuItems || defaultMenu;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [profileImg, setProfileImg] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setUsername(getUsername());
    // Fetch profile image
    async function fetchProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('http://localhost:5000/api/candidate/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileImg(res.data.image);
      } catch {}
    }
    fetchProfile();
  }, []);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      setNotifLoading(true);
      setNotifError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const userRole = getUserRole();
        const apiEndpoint = `http://localhost:5000/api/${userRole}/notifications`;
        
        const res = await axios.get(apiEndpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
        setNotifCount(res.data.filter(n => !n.isRead).length);
      } catch (err) {
        console.error('Notification fetch error:', err);
        setNotifError('Failed to load notifications');
      }
      setNotifLoading(false);
    }
    fetchNotifications();
  }, [notifOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  async function markAsRead(id) {
    try {
      const token = localStorage.getItem('token');
      const userRole = getUserRole();
      const apiEndpoint = `http://localhost:5000/api/${userRole}/notifications/${id}/read`;
      
      await axios.patch(apiEndpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }

  return (
    <div className="dashboard-root">
      <header className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '2rem', paddingRight: '2rem'}}>
        {/* Left: Website Name with dynamic colors */}
        <div className="dynamic-gradient-text" style={{ fontWeight: 900, fontSize: 28, letterSpacing: 1 }}>
          SmartHireX
        </div>
        {/* Right: Welcome, username, notification, profile pic */}
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <span style={{ fontSize: 18, color: '#fff' }}>Welcome, <b style={{ color: '#fff' }}>{username}</b></span>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center', color: '#fff', cursor: 'pointer'}} onClick={() => setNotifOpen(true)}>
            <FiBell size={24} color="#fff" />
            {notifCount > 0 && <span style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#0dcaf0',
              color: '#fff',
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 'bold',
              boxShadow: '0 0 2px #0002'
            }}>{notifCount}</span>}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0dcaf0' }}>
            {profileImg ? (
              <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <FiUser size={28} style={{ color: '#bbb' }} />
            )}
          </div>
        </div>
      </header>
      {/* Notification Drawer */}
      {notifOpen && (
        <div className="notif-drawer-overlay" onClick={() => setNotifOpen(false)} />
      )}
      <div className={`notif-drawer${notifOpen ? ' open' : ''}`}>
        <div className="notif-drawer-header">
          <span>Notifications</span>
          <button className="notif-drawer-close" onClick={() => setNotifOpen(false)}><FiX size={22} /></button>
        </div>
        <div className="notif-drawer-body">
          {notifLoading && <div>Loading...</div>}
          {notifError && <div style={{color: 'red'}}>{notifError}</div>}
          {notifications.length === 0 && !notifLoading && <div style={{color:'#888', marginTop: '2rem'}}>No notifications</div>}
          {notifications.map(n => (
            <div className={`notif-card${n.isRead ? ' read' : ''}`} key={n._id}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-message">{n.message}</div>
              <div className="notif-meta">
                <span>{new Date(n.createdAt).toLocaleString()}</span>
                {!n.isRead && <button className="notif-mark-btn" onClick={() => markAsRead(n._id)}>Read & Mark</button>}
                {n.isRead && <span className="notif-read-label">Read</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="dashboard-body">
        <aside className="dashboard-sidebar">          
          <nav>
            <ul>
              {menuItems.map(item => (
                <li key={item.path} onClick={() => navigate(item.path)}>
                  {item.icon && <span style={{display: 'flex', alignItems: 'center', fontSize: '1.2rem'}}>{item.icon}</span>}
                  <span className="sidebar-menu-text">{item.label}</span>
                </li>
              ))}
            </ul>
          </nav>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut size={20} /> 
            <span className="sidebar-menu-text">Logout</span>
          </button>
        </aside>
        <main className="dashboard-main">{children}</main>
      </div>
      
      {/* Online Counter - Fixed Bottom Right */}
      <OnlineCounter />
    </div>
  );
}
