import { useEffect, useState } from 'react';
import './UserCard.css';
import axios from 'axios';
import { FiTrash2 } from 'react-icons/fi';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/candidates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCandidates(res.data);
      } catch (err) {
        setError('Failed to load candidates');
      }
      setLoading(false);
    }
    fetchCandidates();
  }, []);

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete candidate "${candidateName}"?\n\nThis action cannot be undone and will remove all their data from the system.`
    );
    
    if (!confirmDelete) return;
    
    setDeleteLoading(candidateId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove candidate from local state
      setCandidates(prev => prev.filter(candidate => candidate._id !== candidateId));
      alert('Candidate deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete candidate. Please try again.');
    }
    setDeleteLoading(null);
  };

  return (
    <div className="user-list-container">
      <h2>Candidates</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{color: 'red'}}>{error}</div>}
      <div className="user-card-list">
        {candidates.map((user) => {
          return (
            <div 
              className="user-card candidate-card" 
              key={user._id}
            >
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCandidate(user._id, user.name || `${user.firstName} ${user.lastName || ''}`);
                }}
                disabled={deleteLoading === user._id}
                title="Delete Candidate"
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
                <div className="user-meta">🎓 College: <b>{user.college || 'Not specified'}</b></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
