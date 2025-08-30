import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiBell, FiUser, FiX, FiHome, FiMessageSquare, FiBriefcase, FiUsers } from 'react-icons/fi';
/* removed theme toggle icons */
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

function getUserEmail() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || '';
  } catch {
    return '';
  }
}

function formatDateSafe(dt) {
  if (!dt) return '-';
  const ms = Date.parse(dt);
  if (isNaN(ms)) return '-';
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return '-';
  }
}

export default function DashboardLayout({ children, menuItems }) {
  const defaultMenu = [
    { label: 'Dashboard', path: '/dashboard' },
  ];
  menuItems = menuItems || defaultMenu;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [username, setUsername] = useState('');
  const [profileImg, setProfileImg] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  // removed theme mode state
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);

  // Dynamically derive notification count from unread items
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setNotifCount(unread);
  }, [notifications]);

  useEffect(() => {
    setUsername(getUsername());
    // Fetch profile image
    async function fetchProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('/api/candidate/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileImg(res.data.image);
      } catch {}
    }
    fetchProfile();
  }, []);

  // Track viewport for mobile-specific UI
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Show/hide bottom nav on scroll of the main container (mobile only)
  const [bottomVisible, setBottomVisible] = useState(true);
  useEffect(() => {
    if (!isMobile) { setBottomVisible(true); return; }

    const el = mainRef.current || window;
    let getScroll = () => (mainRef.current ? mainRef.current.scrollTop : window.scrollY);

    let lastY = getScroll();
    let ticking = false;
    let lastScrollTime = 0;
    const SCROLL_THROTTLE = 100; // ms

    const updateVisibility = () => {
      const y = getScroll();
      const goingDown = y > lastY;
      // Keep it visible near top; otherwise hide on down, show on up
      if (y < 80 || !goingDown) {
        setBottomVisible(true);
      } else {
        setBottomVisible(false);
      }
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < SCROLL_THROTTLE) return;
      lastScrollTime = now;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    };

    // Attach listener to the actual scrolling element
    (mainRef.current ? mainRef.current : window).addEventListener('scroll', onScroll, { passive: true });

    return () => {
      (mainRef.current ? mainRef.current : window).removeEventListener('scroll', onScroll);
    };
  }, [isMobile]);

  // removed theme body class effect

  // Notifications
  const fetchNotifications = async () => {
    try {
      // Only show loading state when drawer is open to avoid UI flicker
      if (notifOpen) setNotifLoading(true);
      setNotifError(null);
      const token = localStorage.getItem('token');
      const role = getUserRole(); // candidate | recruiter | admin
      // For admin users, still show general feed (all + recruiter by default)
      const audience = role === 'recruiter' ? 'recruiter' : 'candidate';
      const res = await axios.get(`/api/notifications?audience=${encodeURIComponent(audience)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      // Fetch read IDs for this user to persist state across sessions
      const email = getUserEmail();
      let readIds = [];
      if (email) {
        try {
          const readRes = await axios.get(`/api/notifications/read-ids?email=${encodeURIComponent(email)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          readIds = readRes.data || [];
        } catch {}
      }
      const existing = new Map(notifications.map(n => [n._id, n]));
      const list = (res.data || []).map(n => ({
        _id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        isRead: existing.has(n.id) ? !!existing.get(n.id).isRead : readIds.includes(n.id),
        audience: n.audience,
      }));
      setNotifications(list);
    } catch (e) {
      setNotifError('Failed to load notifications');
    } finally {
      if (notifOpen) setNotifLoading(false);
    }
  };

  // Fetch when drawer opens
  useEffect(() => {
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen]);

  // Background fetch on mount and every 30s to keep count in sync
  useEffect(() => {
    fetchNotifications(); // initial
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  // Handle navigation for menu items
  const handleNavigation = (item) => {
    if (item.type === 'logout') {
      handleLogout();
    } else if (item.path) {
      if (item.path.startsWith('http')) {
        window.open(item.path, '_blank');
      } else {
        navigate(item.path);
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  async function markAsRead(id) {
    // Update state locally first for instant feedback
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    // Persist on backend
    try {
      const token = localStorage.getItem('token');
      const email = getUserEmail();
      if (email) {
        await axios.post(`/api/notifications/${id}/read?email=${encodeURIComponent(email)}`, {}, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }
    } catch {}
  }

  // Filter menu items based on role and mobile/desktop view
  const role = getUserRole();
  let filteredMenu = [];
  
  if (isMobile) {
    // For mobile view, create a simplified menu with only essential items
    const baseMenu = role === 'recruiter' ? [
      { 
        label: 'Home',
        path: '/recruiter/dashboard',
        icon: <FiHome />,
        type: 'link'
      },
      { 
        label: 'Chat',
        path: '/recruiter/chat',
        icon: <FiMessageSquare />,
        type: 'link'
      },
      { 
        label: 'Jobs',
        path: '/recruiter/job-history',
        icon: <FiBriefcase />,
        type: 'link'
      },
      { 
        label: 'Candidates',
        path: '/recruiter/candidate-profiles',
        icon: <FiUsers />,
        type: 'link'
      }
    ] : (Array.isArray(menuItems) ? menuItems : []).filter(mi => {
      // For candidates, filter out unwanted items
      if (!mi || typeof mi !== 'object') return false;
      const label = String(mi.label || '').toLowerCase();
      return !(label.includes('practice') || label.includes('partices') || label.includes('payment') || label.includes('resume'));
    });
    
    // Add logout button
    filteredMenu = [
      ...baseMenu,
      { 
        label: 'Logout',
        path: '#logout',
        icon: <FiLogOut />,
        type: 'logout'
      }
    ];
  } else {
    // For desktop view, show all items
    filteredMenu = Array.isArray(menuItems) ? [...menuItems] : [];
  }

  // Bottom nav items - always icon-only for all roles
  const bottomMenu = useMemo(() => {
    if (!isMobile) return [];
    
    const role = getUserRole();
    // Only include the main navigation items, no exit button
    return (filteredMenu || []).map(item => ({
      ...item,
      label: '' // Remove text label for all items
    }));
  }, [filteredMenu, isMobile]);

  // Active index for animated indicator (do not activate on logout)
  const activeIndex = useMemo(() => {
    const idx = filteredMenu.findIndex(item => typeof item?.path === 'string' && (location.pathname === item.path || location.pathname.startsWith(item.path + '/')));
    return idx >= 0 ? idx : 0;
  }, [filteredMenu, location.pathname]);

  return (
    <div className="dashboard-root">
      <header className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '2rem', paddingRight: '2rem'}}>
        {/* Left: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#ffffff', borderRadius: 8, padding: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
            <img src="/SmarthireX-logo.png" alt="SmartHireX" style={{ height: 28, width: 'auto', display: 'block' }} />
          </div>
        </div>
        {/* Right: Welcome, username, notification, profile pic */}
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <span style={{ fontSize: 18 }}>Welcome, <b>{username}</b></span>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer'}} onClick={() => setNotifOpen(prev => !prev)}>
            <FiBell size={24} />
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
            <div className={`notif-card${n.isRead ? ' read' : ''}`} key={n._id} onClick={() => !n.isRead && markAsRead(n._id)}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-message">{n.message}</div>
              <div className="notif-meta">
                <span>{formatDateSafe(n.createdAt)}</span>
                {!n.isRead && <button className="notif-mark-btn" onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}>Read & Mark</button>}
                {n.isRead && <span className="notif-read-label">Read</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="dashboard-body">
        {/* Sidebar: hide on mobile */}
        <aside className={`dashboard-sidebar${isMobile ? ' hidden-mobile' : ''}`}>          
          <nav>
            <ul>
              {filteredMenu.map(item => (
                <li key={item.path} onClick={() => handleNavigation(item)}>
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
        <main ref={mainRef} className="dashboard-main">
          <div key={location.pathname} className="page-anim">
            {children}
          </div>
        </main>
      </div>
      {/* Bottom navigation - icon only */}
      {isMobile && (
        <div className="bottom-nav-container">
          <div 
            className={`bottom-nav${bottomVisible ? '' : ' hidden'}`}
            style={{ '--item-count': bottomMenu.length }}
          >
            {bottomMenu.map((item, idx) => {
              const isActive = location.pathname === item.path || 
                             (item.path && item.path !== '/' && location.pathname.startsWith(item.path));
              const handleClick = () => handleNavigation(item);

              return (
                <div
                  key={`${item.path || 'item'}-${idx}`}
                  className={`nav-icon ${isActive ? 'active' : ''}`}
                  onClick={handleClick}
                  aria-label={item.label || 'menu-item'}
                  title={item.label || ''}
                >
                  {React.cloneElement(item.icon, {
                    size: 24,
                    style: {
                      color: isActive ? '#0ea5e9' : '#94a3b8',
                      transition: 'color 0.2s ease',
                      cursor: 'pointer'
                    }
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Online Counter - Fixed Bottom Right (hidden on mobile) */}
      {!isMobile && <OnlineCounter />}
    </div>
  );
}
