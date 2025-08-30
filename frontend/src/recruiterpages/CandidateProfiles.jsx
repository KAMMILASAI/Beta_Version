import { useEffect, useState } from 'react';
import axios from 'axios';
import '../adminpages/UserCard.css';

export default function CandidateProfiles() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8080/api/admin/candidates', {
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

  return (
    <div className="user-list-container">
      <h2>Candidates</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{color: 'red'}}>{error}</div>}
      <div className="user-card-list">
        {candidates.map(user => (
          <div className="user-card" key={user._id}>
            <img className="user-avatar" src={user.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || user.firstName || 'User') + '&background=6366f1&color=fff'} alt={user.name || user.firstName} />
            <div className="user-info">
              <div className="user-name">{user.name || (user.firstName + ' ' + (user.lastName || ''))}</div>
              <div className="user-email">{user.email}</div>
              <div className="user-meta">College: <b>{user.college || '-'}</b></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
