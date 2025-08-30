import { useEffect, useMemo, useState } from 'react';
import './UserCard.css';
import axios from 'axios';
import { FiTrash2 } from 'react-icons/fi';

export default function Users() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'candidates' | 'recruiters'
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [candRes, recRes] = await Promise.all([
          axios.get('http://localhost:8080/api/admin/candidates', { headers }),
          axios.get('http://localhost:8080/api/admin/recruiters', { headers })
        ]);
        setCandidates(Array.isArray(candRes.data) ? candRes.data : []);
        setRecruiters(Array.isArray(recRes.data) ? recRes.data : []);
      } catch (e) {
        setError('Failed to load users');
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const handleDeleteCandidate = async (id, name) => {
    const confirmDelete = window.confirm(`Delete candidate "${name}"? This cannot be undone.`);
    if (!confirmDelete) return;
    setDeleteLoading(`c-${id}`);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/admin/candidates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(prev => prev.filter(u => (u._id ?? u.id) !== id));
      alert('Candidate deleted successfully!');
    } catch (e) {
      alert('Failed to delete candidate.');
    }
    setDeleteLoading(null);
  };

  const handleDeleteRecruiter = async (id, name) => {
    const confirmDelete = window.confirm(`Delete recruiter "${name}"? This cannot be undone.`);
    if (!confirmDelete) return;
    setDeleteLoading(`r-${id}`);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/admin/recruiters/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecruiters(prev => prev.filter(u => (u._id ?? u.id) !== id));
      alert('Recruiter deleted successfully!');
    } catch (e) {
      alert('Failed to delete recruiter.');
    }
    setDeleteLoading(null);
  };

  // Build the list based on active tab with strict role checks to avoid cross-list leakage
  const list = useMemo(() => {
    const isCandidate = (u) => (u.role || '').toLowerCase() === 'candidate';
    const isRecruiter = (u) => (u.role || '').toLowerCase() === 'recruiter';

    if (activeTab === 'candidates') {
      return candidates.filter(isCandidate).map(u => ({ ...u, __type: 'candidate' }));
    }
    if (activeTab === 'recruiters') {
      return recruiters.filter(isRecruiter).map(u => ({ ...u, __type: 'recruiter' }));
    }
    // all: merge both, enforcing role-based membership
    const c = candidates.filter(isCandidate).map(u => ({ ...u, __type: 'candidate' }));
    const r = recruiters.filter(isRecruiter).map(u => ({ ...u, __type: 'recruiter' }));
    return [...c, ...r];
  }, [activeTab, candidates, recruiters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(u =>
      (u.name || `${u.firstName || ''} ${u.lastName || ''}` || '')
        .toLowerCase()
        .includes(q) || (u.email || '').toLowerCase().includes(q)
    );
  }, [list, query]);

  return (
    <div className="user-list-container">
      <div className="users-toolbar">
        <h2>Users</h2>
        <div className="toolbar-right">
          <select
            className="filter-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="candidates">Candidates</option>
            <option value="recruiters">Recruiters</option>
          </select>
          <input
            className="search-input"
            placeholder="Search by name or email"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div className="user-card-list">
        {filtered.length === 0 && !loading && (
          <div className="empty-state">
            <h3>No users found</h3>
            <p>Try adjusting your search or switching tabs.</p>
          </div>
        )}
        {filtered.map((user) => {
          const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
          const uid = user._id ?? user.id;
          const role = (user.role || '').toLowerCase();
          const derivedType = role === 'candidate' ? 'candidate' : role === 'recruiter' ? 'recruiter' : undefined;
          const type = user.__type || derivedType || (activeTab === 'candidates' ? 'candidate' : 'recruiter');
          const isDeleting = deleteLoading === `${type === 'candidate' ? 'c' : 'r'}-${uid}`;
          const resolveImage = () => {
            const img = user.image;
            if (img && typeof img === 'string' && img.trim()) {
              if (/^https?:/i.test(img)) return img; // Cloudinary or full URL
              const base = 'http://localhost:8080/api';
              return img.startsWith('/') ? `${base}${img}` : `${base}/${img}`;
            }
            return (
              'https://ui-avatars.com/api/?name=' +
              encodeURIComponent(name || 'User') +
              '&background=1f2937&color=e5e7eb&bold=true'
            );
          };
          return (
            <div className="user-card" key={`${type}-${uid}`}>
              {isDeleting ? (
                <div className="delete-icon loading" title="Deleting...">
                  <div className="loading-spinner small"></div>
                </div>
              ) : (
                <FiTrash2
                  className="delete-icon"
                  size={24}
                  title={`Delete ${type}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (type === 'candidate') { handleDeleteCandidate(uid, name); }
                    else { handleDeleteRecruiter(uid, name); }
                  }}
                />
              )}

              <img
                className="user-avatar"
                src={resolveImage()}
                alt={name || 'User'}
              />
              <div className="user-info">
                <div className="user-name">{name}</div>
                <div className="user-email">{user.email}</div>
                {/* Type badge removed as requested */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
