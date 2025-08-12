import { useEffect, useState } from 'react';
import './UserCard.css';
import axios from 'axios';
import { FiTrash2 } from 'react-icons/fi';

export default function Recruiters() {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    async function fetchRecruiters() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/recruiters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecruiters(res.data);
      } catch (err) {
        setError('Failed to load recruiters');
      }
      setLoading(false);
    }
    fetchRecruiters();
  }, []);

  const handleDeleteRecruiter = async (recruiterId, recruiterName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete recruiter "${recruiterName}"?\n\nThis action cannot be undone and will remove all their data from the system.`
    );
    
    if (!confirmDelete) return;
    
    setDeleteLoading(recruiterId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/recruiters/${recruiterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove recruiter from local state
      setRecruiters(prev => prev.filter(recruiter => recruiter._id !== recruiterId));
      alert('Recruiter deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete recruiter. Please try again.');
    }
    setDeleteLoading(null);
  };

  return (
    <div className="user-list-container">
      <h2>Recruiters</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{color: 'red'}}>{error}</div>}
      <div className="user-card-list">
        {recruiters.map((user) => {
          return (
            <div 
              className="user-card recruiter-card" 
              key={user._id}
            >
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRecruiter(user._id, user.name || `${user.firstName} ${user.lastName || ''}`);
                }}
                disabled={deleteLoading === user._id}
                title="Delete Recruiter"
              >
                {deleteLoading === user._id ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <FiTrash2 size={16} />
                )}
              </button>
              
              <img 
                className="user-avatar" 
                src={user.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || user.firstName || 'User') + '&background=fff&color=333'} 
                alt={user.name || user.firstName} 
              />
              <div className="user-info">
                <div className="user-name">{user.name || (user.firstName + ' ' + (user.lastName || ''))}</div>
                <div className="user-email">{user.email}</div>
                <div className="user-meta">🏢 Company: <b>{user.company || 'Not specified'}</b></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
