import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiFileText, FiTrendingUp, FiBriefcase, FiPlusCircle, FiCalendar, FiUserCheck, FiUser, FiMessageCircle } from 'react-icons/fi';
import './DashboardHome.css';

// CSS for the mini bar charts
const chartContainerStyle = {
  height: '150px',
  display: 'flex',
  alignItems: 'flex-end',
  gap: '10px',
  padding: '15px 0',
  margin: '10px 0 20px',
};

const barStyle = (height, isMax) => ({
  flex: 1,
  height: `${height}%`,
  background: isMax ? 'linear-gradient(45deg, #4f46e5, #7c3aed)' : 'linear-gradient(45deg, #e0e7ff, #c7d2fe)',
  borderRadius: '6px',
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scaleY(1.05)',
  },
});

const labelStyle = {
  position: 'absolute',
  bottom: '-25px',
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '0.75rem',
  color: '#6b7280',
};

const StatCard = ({ title, value, icon, gradient }) => (
  <div className="rdh-card rdh-stat">
    <div className="head">
      <h3 className="title">{title}</h3>
      <div className={`icon ${gradient}`}>{icon}</div>
    </div>
    <p className="value">{value}</p>
  </div>
);

const QuickAction = ({ title, icon, to, gradient }) => (
  <Link to={to} className={`rdh-quick-item ${gradient}`}>
    <div className="ico">{icon}</div>
    <span>{title}</span>
  </Link>
);

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeChats: 0,
    drivesConducted: 0,
    totalEmployees: 0,
    charts: {
      candidatesByMonth: [],
      drivesByMonth: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    companyName: 'Your Company',
    location: 'Location not set',
    website: '',
    numEmployees: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [statsRes, profileRes] = await Promise.all([
          axios.get('/api/recruiter/dashboard-stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/recruiter/profile', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        // Normalize charts to avoid undefined access
        const incoming = statsRes.data || {};
        const normalized = {
          totalCandidates: incoming.totalCandidates ?? 0,
          activeChats: incoming.activeChats ?? 0,
          drivesConducted: incoming.drivesConducted ?? 0,
          totalEmployees: incoming.totalEmployees ?? 0,
          charts: {
            candidatesByMonth: Array.isArray(incoming?.charts?.candidatesByMonth) ? incoming.charts.candidatesByMonth : [],
            drivesByMonth: Array.isArray(incoming?.charts?.drivesByMonth) ? incoming.charts.drivesByMonth : [],
          },
        };
        setStats(normalized);
        setProfile(profileRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Fallback data for demo
        setStats({
          totalCandidates: 124,
          activeChats: 12,
          drivesConducted: 8,
          totalEmployees: profile.numEmployees || 50,
          charts: {
            candidatesByMonth: [
              { month: 'Mar', count: 15 },
              { month: 'Apr', count: 25 },
              { month: 'May', count: 18 },
              { month: 'Jun', count: 32 },
              { month: 'Jul', count: 28 },
              { month: 'Aug', count: 6 },
            ],
            drivesByMonth: [
              { month: 'Mar', count: 1 },
              { month: 'Apr', count: 2 },
              { month: 'May', count: 0 },
              { month: 'Jun', count: 3 },
              { month: 'Jul', count: 1 },
              { month: 'Aug', count: 1 },
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Safe chart arrays and max scaling
  const candidatesByMonth = Array.isArray(stats?.charts?.candidatesByMonth) ? stats.charts.candidatesByMonth : [];
  const drivesByMonth = Array.isArray(stats?.charts?.drivesByMonth) ? stats.charts.drivesByMonth : [];
  const maxCandidates = Math.max(1, ...candidatesByMonth.map(d => d?.count || 0));
  const maxDrives = Math.max(1, ...drivesByMonth.map(d => d?.count || 0));

  if (loading) {
    return (
      <div className="rdh-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="rdh-container">
      {/* Welcome Header */}
      <div className="rdh-card rdh-welcome">
        <h1>Welcome back, {profile.companyName}!</h1>
        <div className="meta">
          {profile.location && <span>📍 {profile.location}</span>}
          {profile.website && <span>🌐 {profile.website}</span>}
          <span>👥 {profile.numEmployees || stats.totalEmployees} employees</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="rdh-grid-4">
        <StatCard 
          title="Candidates Contacted" 
          value={stats.totalCandidates} 
          icon={<FiUsers size={20} />} 
          gradient="grad-blue"
        />
        <StatCard 
          title="Active Conversations" 
          value={stats.activeChats} 
          icon={<FiMessageCircle size={20} />} 
          gradient="grad-green"
        />
        <StatCard 
          title="Drives Conducted" 
          value={stats.drivesConducted} 
          icon={<FiBriefcase size={20} />} 
          gradient="grad-purple"
        />
        <StatCard 
          title="Total Employees" 
          value={profile.numEmployees || stats.totalEmployees} 
          icon={<FiUsers size={20} />} 
          gradient="grad-amber"
        />
      </div>

      {/* Charts */}
      <div className="rdh-grid-2">
        <div className="rdh-card rdh-chart">
          <h3 className="rdh-title">Candidates Contacted</h3>
          <div className="rdh-bars">
            {candidatesByMonth.map((item, index) => {
              const height = (item.count / maxCandidates) * 100;
              const isMax = item.count === maxCandidates && item.count > 0;
              return (
                <div key={index} className={`rdh-bar ${isMax ? 'max' : 'norm'}`} style={{ height: `${height}%` }}>
                  <span className="rdh-label">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rdh-card rdh-chart">
          <h3 className="rdh-title">Drives Conducted</h3>
          <div className="rdh-bars">
            {drivesByMonth.map((item, index) => {
              const height = item.count > 0 ? (item.count / maxDrives) * 100 : 5;
              const isMax = item.count === maxDrives && item.count > 0;
              return (
                <div key={index} className={`rdh-bar ${isMax ? 'max' : 'norm'}`} style={{ height: `${height}%` }}>
                  <span className="rdh-label">{item.month}\n                    <div style={{ fontSize: '10px' }}>{item.count}</div>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rdh-card rdh-quick">
        <h3 className="rdh-title">Quick Actions</h3>
        <div className="rdh-quick-grid">
          <QuickAction 
            title="Generate Test" 
            icon={<FiFileText />}
            to="/recruiter/generate-test"
            gradient="grad-blue"
          />
          <QuickAction 
            title="Schedule Interview" 
            icon={<FiCalendar />}
            to="/recruiter/interview"
            gradient="grad-green"
          />
          <QuickAction 
            title="View Candidates" 
            icon={<FiUserCheck />}
            to="/recruiter/candidate-profiles"
            gradient="grad-purple"
          />
          <QuickAction 
            title="Update Profile" 
            icon={<FiUser />}
            to="/recruiter/edit-profile"
            gradient="grad-amber"
          />
        </div>
      </div>
    </div>
  );
}
