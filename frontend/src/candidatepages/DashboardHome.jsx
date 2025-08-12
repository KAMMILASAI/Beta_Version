import React, { useEffect, useState } from 'react';
import { FiUser, FiMail, FiBriefcase, FiFileText, FiCheckCircle, FiTrendingUp, FiCalendar, FiCode, FiStar, FiAward, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';
import './DashboardHome.css';

export default function DashboardHome() {
  const [profile, setProfile] = useState(null);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [resumeScoreHistory, setResumeScoreHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dailyStreak, setDailyStreak] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        // Fetch profile data
        const profileRes = await axios.get('http://localhost:5000/api/candidate/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(profileRes.data);
        
        // Fetch practice history
        try {
          const practiceRes = await axios.get('http://localhost:5000/api/candidate/practice/history?limit=10', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPracticeHistory(practiceRes.data.sessions || []);
          calculateDailyStreak(practiceRes.data.sessions || []);
        } catch (practiceErr) {
          console.log('Practice history not available, using mock data');
          setMockPracticeData();
        }
        
        // Fetch resume score history
        try {
          console.log('Fetching resume score history...');
          const resumeRes = await axios.get('http://localhost:5000/api/candidate/resume-score-history', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Resume API Response:', resumeRes.data);
          setResumeScoreHistory(resumeRes.data.history || []);
          console.log('Resume history set to:', resumeRes.data.history || []);
        } catch (resumeErr) {
          console.error('Resume score history API error:', resumeErr);
          console.log('Using mock data for resume score history');
          // Set mock data if API fails
          const mockResumeData = [
            { period: 'Resume 0', score: 45, label: 'Initial' },
            { period: 'Resume 1', score: profile?.resumeScore || 75, label: 'Latest' }
          ];
          setResumeScoreHistory(mockResumeData);
          console.log('Mock resume data set:', mockResumeData);
        }
        
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const calculateDailyStreak = (sessions) => {
    if (!sessions || sessions.length === 0) {
      setDailyStreak(0);
      return;
    }
    
    const sortedSessions = sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let session of sortedSessions) {
      const sessionDate = new Date(session.createdAt);
      sessionDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    setDailyStreak(streak);
  };

  const setMockPracticeData = () => {
    const mockSessions = [
      { _id: '1', type: 'mcq', percentage: 85, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { _id: '2', type: 'coding', percentage: 78, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { _id: '3', type: 'mcq', percentage: 92, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { _id: '4', type: 'coding', percentage: 88, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { _id: '5', type: 'interview', percentage: 75, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { _id: '6', type: 'mcq', percentage: 95, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    ];
    setPracticeHistory(mockSessions);
    setDailyStreak(6);
  };

  // Prepare chart data (reverse to show chronological order: oldest first)
  const practiceChartData = practiceHistory
    .slice() // Create a copy to avoid mutating original array
    .reverse() // Reverse to get chronological order (oldest first)
    .map((session, index) => ({
      session: `Practice ${index + 1}`,
      score: session.percentage,
      date: new Date(session.createdAt).toLocaleDateString(),
      type: session.type
    }));

  // Resume score progress (dynamic data from API)
  const resumeScoreData = resumeScoreHistory.length > 0 ? resumeScoreHistory : [
    { period: 'Resume 0', score: 45, label: 'Initial' },
    { period: 'Resume 1', score: profile?.resumeScore || 75, label: 'Latest' }
  ];
  
  // Calculate dynamic resume score summary
  const getResumeScoreSummary = () => {
    if (resumeScoreData.length >= 2) {
      const lastScore = resumeScoreData[resumeScoreData.length - 1].score; // Latest resume score
      const previousScore = resumeScoreData[resumeScoreData.length - 2].score; // Previous resume score
      const improvement = lastScore - previousScore;
      return {
        before: previousScore, // Dynamic previous score
        current: lastScore,
        improvement: improvement
      };
    } else if (resumeScoreData.length === 1) {
      // Only one resume score available
      const currentScore = resumeScoreData[0].score;
      return {
        before: 45, // Default baseline for first resume
        current: currentScore,
        improvement: currentScore - 45
      };
    }
    // Fallback if no data
    return {
      before: 45,
      current: profile?.resumeScore || 75,
      improvement: (profile?.resumeScore || 75) - 45
    };
  };
  
  const resumeScoreSummary = getResumeScoreSummary();
  
  // Debug logs to check data
  console.log('Resume Score Data:', resumeScoreData);
  console.log('Resume Score History:', resumeScoreHistory);
  console.log('Resume Score Summary:', resumeScoreSummary);
  console.log('Practice Chart Data:', practiceChartData);
  console.log('Practice History (original):', practiceHistory);

  // Interview status data (mock data for demonstration)
  const interviewStatusData = [
    { 
      id: 1,
      company: 'TechCorp Solutions', 
      position: 'Frontend Developer', 
      stage: 'Applied', 
      date: '2024-01-15', 
      status: 'Completed',
      statusColor: '#27ae60'
    },
    { 
      id: 2,
      company: 'TechCorp Solutions', 
      position: 'Frontend Developer', 
      stage: 'Resume Shortlisted', 
      date: '2024-01-18', 
      status: 'Completed',
      statusColor: '#27ae60'
    },
    { 
      id: 3,
      company: 'TechCorp Solutions', 
      position: 'Frontend Developer', 
      stage: 'Online Assessment', 
      date: '2024-01-22', 
      status: 'Completed',
      statusColor: '#27ae60'
    },
    { 
      id: 4,
      company: 'TechCorp Solutions', 
      position: 'Frontend Developer', 
      stage: 'Technical Interview', 
      date: '2024-01-25', 
      status: 'Scheduled',
      statusColor: '#f39c12'
    },
    { 
      id: 5,
      company: 'DataFlow Inc', 
      position: 'Full Stack Developer', 
      stage: 'Applied', 
      date: '2024-01-20', 
      status: 'Under Review',
      statusColor: '#3498db'
    },
    { 
      id: 6,
      company: 'InnovateTech', 
      position: 'React Developer', 
      stage: 'HR Interview', 
      date: '2024-01-28', 
      status: 'Pending',
      statusColor: '#95a5a6'
    }
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        background: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666', fontSize: '16px' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '12px',
        margin: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ color: '#dc3545', fontSize: '18px', marginBottom: '10px' }}>⚠️ {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!profile) return null;

  return (
    <div style={{ 
      background: '#ffffff',
      minHeight: '100vh',
      padding: '12px 24px',
      maxWidth: '100%',
      width: '100%',
      margin: '0 auto'
    }}>
      {/* Enhanced Profile Card - White Background */}
      <div className="profile-card" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        color: '#333',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div className="profile-avatar" style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: '#f8f9fa',
            border: '3px solid #e9ecef',
            overflow: 'hidden', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            {profile.image ? (
              <img src={profile.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <FiUser size={60} style={{ color: '#6c757d' }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#333' }}>{profile.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '16px', color: '#666' }}>
              <FiMail size={16} style={{ color: '#667eea' }} /> {profile.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '16px', color: '#666' }}>
              <FiBriefcase size={16} style={{ color: '#4ecdc4' }} /> {profile.college}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '16px', color: '#666' }}>
              <FiFileText size={16} style={{ color: '#ff6b6b' }} /> Registration: {profile.regNo}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '16px', color: '#666' }}>
              <FiCheckCircle size={16} style={{ color: '#27ae60' }} /> {profile.location}
            </div>
          </div>
        </div>
        
        {/* Dynamic Skills Section */}
        {profile.skills && (
          <div style={{ marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FiCode size={20} style={{ color: '#667eea' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>Skills & Technologies</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {profile.skills.split(',').map((skill, i) => {
                const colors = ['#667eea', '#4ecdc4', '#ff6b6b', '#feca57', '#a8edea', '#fed6e3'];
                const color = colors[i % colors.length];
                return (
                  <div key={i} className="skill-card" style={{
                    background: 'white',
                    border: `2px solid ${color}`,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: color, marginBottom: '4px' }}>
                      {skill.trim()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999' }}>Skill</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards Row - 4 Cards in 1 Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Daily Streak Card */}
        <div className="stats-card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          color: '#333',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0'
        }}>
          <FiCalendar className="stats-icon" size={32} style={{ marginBottom: '12px', color: '#ff6b6b' }} />
          <div className="stats-value" style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', color: '#ff6b6b' }}>{dailyStreak}</div>
          <div style={{ fontSize: '16px', color: '#666' }}>Day Streak</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Keep it up! 🔥</div>
        </div>

        {/* Resume Score Card */}
        <div className="stats-card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          color: '#333',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0'
        }}>
          <FiFileText className="stats-icon" size={32} style={{ marginBottom: '12px', color: '#4ecdc4' }} />
          <div className="stats-value" style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', color: '#4ecdc4' }}>{profile.resumeScore || 0}/100</div>
          <div style={{ fontSize: '16px', color: '#666' }}>Resume Score</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Last updated</div>
        </div>

        {/* Interviews Card */}
        <div className="stats-card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          color: '#333',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0'
        }}>
          <FiStar className="stats-icon" size={32} style={{ marginBottom: '12px', color: '#a8edea' }} />
          <div className="stats-value" style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', color: '#a8edea' }}>{profile.interviewsAttended || 0}</div>
          <div style={{ fontSize: '16px', color: '#666' }}>Interviews</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Attended</div>
        </div>

        {/* Practice Sessions Card */}
        <div className="stats-card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          color: '#333',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0'
        }}>
          <FiCode className="stats-icon" size={32} style={{ marginBottom: '12px', color: '#667eea' }} />
          <div className="stats-value" style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px', color: '#667eea' }}>{practiceHistory.length}</div>
          <div style={{ fontSize: '16px', color: '#666' }}>Practice Sessions</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Completed</div>
        </div>
      </div>

      {/* Charts Section - Side by Side in 1 Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Practice Progress Chart */}
        <div className="chart-card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <FiTrendingUp size={24} style={{ color: '#667eea' }} />
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Practice Progress</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={practiceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="session" 
                tick={{ fontSize: 12, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#667eea" 
                strokeWidth={3}
                dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#667eea' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Resume Score Progress Chart */}
        <div className="chart-card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <FiFileText size={24} style={{ color: '#4ecdc4' }} />
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Resume Score Progress</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={resumeScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#666' }}
                axisLine={{ stroke: '#e0e0e0' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#4ecdc4" 
                fill="url(#colorGradient)"
                strokeWidth={3}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '16px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Before</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff6b6b' }}>{resumeScoreSummary.before}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Current</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#4ecdc4' }}>{resumeScoreSummary.current}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>Improvement</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: resumeScoreSummary.improvement >= 0 ? '#27ae60' : '#ff6b6b' }}>
                {resumeScoreSummary.improvement >= 0 ? '+' : ''}{resumeScoreSummary.improvement}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Status Table */}
      <div className="interview-table" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #f0f0f0',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <FiAward size={24} style={{ color: '#667eea' }} />
          <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Interview Status</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            background: 'white'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left',
                  borderBottom: '2px solid #e9ecef',
                  color: '#495057',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>Company</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left',
                  borderBottom: '2px solid #e9ecef',
                  color: '#495057',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>Position</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left',
                  borderBottom: '2px solid #e9ecef',
                  color: '#495057',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>Stage</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'left',
                  borderBottom: '2px solid #e9ecef',
                  color: '#495057',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>Date</th>
                <th style={{ 
                  padding: '16px', 
                  textAlign: 'center',
                  borderBottom: '2px solid #e9ecef',
                  color: '#495057',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {interviewStatusData.map((interview) => (
                <tr key={interview.id} style={{ 
                  borderBottom: '1px solid #f8f9fa',
                  transition: 'background-color 0.2s ease'
                }}>
                  <td style={{ 
                    padding: '16px',
                    fontSize: '14px',
                    color: '#333',
                    fontWeight: '500'
                  }}>
                    {interview.company}
                  </td>
                  <td style={{ 
                    padding: '16px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    {interview.position}
                  </td>
                  <td style={{ 
                    padding: '16px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    {interview.stage}
                  </td>
                  <td style={{ 
                    padding: '16px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    {new Date(interview.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td style={{ 
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <span className="interview-status-badge" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: interview.statusColor,
                      background: `${interview.statusColor}15`,
                      border: `1px solid ${interview.statusColor}30`
                    }}>
                      {interview.status === 'Completed' && <FiCheck size={12} />}
                      {interview.status === 'Scheduled' && <FiClock size={12} />}
                      {interview.status === 'Under Review' && <FiClock size={12} />}
                      {interview.status === 'Pending' && <FiClock size={12} />}
                      {interview.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Stats */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginTop: '24px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <div className="summary-stat" style={{ textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#27ae60', marginBottom: '4px' }}>
              {interviewStatusData.filter(i => i.status === 'Completed').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</div>
          </div>
          <div className="summary-stat" style={{ textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#f39c12', marginBottom: '4px' }}>
              {interviewStatusData.filter(i => i.status === 'Scheduled').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scheduled</div>
          </div>
          <div className="summary-stat" style={{ textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#3498db', marginBottom: '4px' }}>
              {interviewStatusData.filter(i => i.status === 'Under Review').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Under Review</div>
          </div>
          <div className="summary-stat" style={{ textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: '24px', fontWeight: '700', color: '#95a5a6', marginBottom: '4px' }}>
              {interviewStatusData.filter(i => i.status === 'Pending').length}
            </div>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</div>
          </div>
        </div>
      </div>

    </div>
  );
}
