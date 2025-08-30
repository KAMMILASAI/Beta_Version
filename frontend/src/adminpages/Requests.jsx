import { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboardHome.css';

export default function Requests() {
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingRecruiters();
  }, []);

  const fetchPendingRecruiters = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/admin/pending-recruiters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRecruiters(res.data.requests || []);
    } catch (err) {
      setError('Failed to load pending requests');
      console.error('Failed to load pending recruiters:', err);
    }
    setLoading(false);
  };

  const handleApproveRecruiter = async (userId) => {
    const adminMessage = prompt('Enter an optional message for the recruiter (optional):');
    setProcessingRequest(userId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/admin/approve-recruiter/${userId}`, 
        { adminMessage }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove from pending list
      setPendingRecruiters(prev => prev.filter(r => r._id !== userId));
      alert('Recruiter approved successfully! They will receive an email notification.');
    } catch (err) {
      alert('Failed to approve recruiter: ' + (err.response?.data?.message || err.message));
    }
    setProcessingRequest(null);
  };

  const handleRejectRecruiter = async (userId) => {
    const adminMessage = prompt('Enter a reason for rejection (required):');
    if (!adminMessage) {
      alert('Please provide a reason for rejection.');
      return;
    }
    
    setProcessingRequest(userId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/admin/reject-recruiter/${userId}`, 
        { adminMessage }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove from pending list
      setPendingRecruiters(prev => prev.filter(r => r._id !== userId));
      alert('Recruiter rejected. They will receive an email notification.');
    } catch (err) {
      alert('Failed to reject recruiter: ' + (err.response?.data?.message || err.message));
    }
    setProcessingRequest(null);
  };

  return (
    <div className="admin-dashboard-home">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Recruiter Requests</h2>
        <div 
          className={`refresh-icon ${loading ? 'spinning' : ''}`}
          title={loading ? 'Refreshing...' : 'Refresh'}
          aria-label="Refresh"
          role="button"
          onClick={() => !loading && fetchPendingRecruiters()}
        >
          <span className="refresh-glyph">↻</span>
        </div>
      </div>

      {error && (
        <div className="error-banner dark">
          {error}
        </div>
      )}

      <div className="recruiter-requests-section" style={{ marginTop: 0 }}>
        <h3>Pending Recruiter Requests 
          {!loading && pendingRecruiters.length > 0 && (
            <span className="request-count">({pendingRecruiters.length})</span>
          )}
        </h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            Loading requests...
          </div>
        ) : pendingRecruiters.length === 0 ? (
          <div className="no-requests">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            No pending recruiter requests
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#94a3b8' }}>
              All recruiter registrations have been processed
            </div>
          </div>
        ) : (
          <div className="requests-grid">
            {pendingRecruiters.map((recruiter) => (
              <div key={recruiter._id} className="request-card">
                <div className="request-header">
                  <h4>{recruiter.firstName} {recruiter.lastName}</h4>
                  <span className="request-date">
                    {new Date(recruiter.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="request-details">
                  <p><strong>📧 Email:</strong> {recruiter.email}</p>
                  {recruiter.phone && <p><strong>📱 Phone:</strong> {recruiter.phone}</p>}
                  {recruiter.company && <p><strong>🏢 Company:</strong> {recruiter.company}</p>}
                  {recruiter.companyLink && <p><strong>🌐 Company Link:</strong> 
                    <a href={recruiter.companyLink} target="_blank" rel="noopener noreferrer">
                      {recruiter.companyLink}
                    </a>
                  </p>}
                  {recruiter.numEmployees && <p><strong>👥 Employees:</strong> {recruiter.numEmployees}</p>}
                  {recruiter.location && <p><strong>📍 Location:</strong> {recruiter.location}</p>}
                  
                  {/* OAuth Provider Info */}
                  {(recruiter.googleId || recruiter.githubId) && (
                    <p><strong>🔗 Registration:</strong> 
                      {recruiter.googleId && ' Google OAuth'}
                      {recruiter.githubId && ' GitHub OAuth'}
                      {!recruiter.googleId && !recruiter.githubId && ' Manual'}
                    </p>
                  )}
                </div>
                
                <div className="request-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => handleApproveRecruiter(recruiter._id)}
                    disabled={processingRequest === recruiter._id}
                  >
                    {processingRequest === recruiter._id ? 'Processing...' : '✅ Approve'}
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleRejectRecruiter(recruiter._id)}
                    disabled={processingRequest === recruiter._id}
                  >
                    {processingRequest === recruiter._id ? 'Processing...' : '❌ Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
