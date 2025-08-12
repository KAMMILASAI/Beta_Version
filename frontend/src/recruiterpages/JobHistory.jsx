import React, { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import axios from 'axios';

export default function JobHistory() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const gradientClasses = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
  ];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/jobs', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setJobs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteJob = async (e, jobId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this job? It will no longer be visible to candidates.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  const loadApplications = async (jobId) => {
    setSelectedJob(jobId);
    setAppsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/jobs/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApps(res.data);
    } catch (err) {
      console.error(err);
      setApps([]);
    }
    setAppsLoading(false);
  };

  if (loading) return <p className="mt-10 text-center">Loading...</p>;

  if (!jobs.length) return <p className="mt-10 text-center">No jobs created yet.</p>;

  if (selectedJob) {
    return (
      <div style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <button 
          onClick={() => setSelectedJob(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: '#3b82f6',
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '20px',
            padding: '6px 0',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Jobs
        </button>
        
        {appsLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px'
          }}>
            <p>Loading applications...</p>
          </div>
        ) : !apps.length ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #e2e8f0'
          }}>
            <p style={{
              fontSize: '1.1rem',
              color: '#64748b',
              marginBottom: '10px'
            }}>No applications yet</p>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.95rem'
            }}>Candidates who apply will appear here</p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b'
              }}>Candidates ({apps.length})</h2>
              <div style={{
                fontSize: '0.9rem',
                color: '#64748b'
              }}>
                {new Date().toLocaleDateString()}
              </div>
            </div>
            
            <div style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Name</th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Email</th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>College</th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>CGPA</th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a, index) => (
                    <tr 
                      key={a._id} 
                      style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5ff'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'}
                    >
                      <td style={{
                        padding: '16px 20px',
                        color: '#1e293b',
                        fontSize: '0.95rem',
                        fontWeight: '500'
                      }}>{a.name}</td>
                      <td style={{
                        padding: '16px 20px',
                        color: '#475569',
                        fontSize: '0.9rem'
                      }}>{a.email}</td>
                      <td style={{
                        padding: '16px 20px',
                        color: '#475569',
                        fontSize: '0.9rem'
                      }}>{a.college || '-'}</td>
                      <td style={{
                        padding: '16px 20px',
                        color: '#475569',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        fontWeight: '500'
                      }}>{a.cgpa || '-'}</td>
                      <td style={{
                        padding: '16px 20px'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor: a.status === 'applied' ? '#e0f2fe' : 
                                         a.status === 'reviewed' ? '#fef3c7' :
                                         a.status === 'interviewed' ? '#dbeafe' :
                                         a.status === 'hired' ? '#dcfce7' :
                                         a.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                          color: a.status === 'applied' ? '#0369a1' :
                                a.status === 'reviewed' ? '#92400e' :
                                a.status === 'interviewed' ? '#1e40af' :
                                a.status === 'hired' ? '#166534' :
                                a.status === 'rejected' ? '#991b1b' : '#4b5563',
                          textTransform: 'capitalize'
                        }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {jobs.map((j, i) => (
        <div key={j._id} style={{
          background: gradientClasses[i % gradientClasses.length],
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        onClick={() => loadApplications(j._id)}
        >
          <button style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onClick={(e) => deleteJob(e, j._id)}
          >
            <FiTrash2 size={16} />
          </button>
          <h3 style={{
            fontSize: '1.4rem',
            fontWeight: '700',
            marginBottom: '12px',
            lineHeight: '1.3',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
          >
            {j.title}
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.85rem',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {new Date(j.createdAt).toLocaleDateString()}
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.85rem',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Expires: {new Date(j.expiresAt).toLocaleString()}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '12px',
              background: j.status === 'active' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 191, 36, 0.2)',
              color: j.status === 'active' ? '#4ade80' : '#fbbf24',
              fontSize: '0.8rem',
              fontWeight: '600',
              marginBottom: '12px',
              border: '1px solid',
              borderColor: j.status === 'active' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(251, 191, 36, 0.3)'
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: j.status === 'active' ? '#4ade80' : '#fbbf24',
                marginRight: '6px'
              }}></span>
              {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`${window.location.origin}/jobs/${j.linkId}`);
                alert('Link copied to clipboard!');
              }}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Job Link
            </button>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: 'auto'
          }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                loadApplications(j._id);
              }}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              View Candidates
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
