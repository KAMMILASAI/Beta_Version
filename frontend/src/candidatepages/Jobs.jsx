import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { FaSearch } from 'react-icons/fa';
import './Applications.css';
import JobCard from './JobCard';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [appliedIds, setAppliedIds] = useState(() => new Set());
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [jobsRes, profRes, appsRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/candidate/jobs`, { headers }),
          axios.get(`${API_BASE}/candidate/profile`, { headers }),
          axios.get(`${API_BASE}/candidate/applications`, { headers })
        ]);
        if (jobsRes.status === 'fulfilled') {
          const list = Array.isArray(jobsRes.value.data) ? jobsRes.value.data : [];
          setJobs(list);
        } else {
          setError('Failed to load jobs');
        }
        if (profRes.status === 'fulfilled') {
          setProfile(profRes.value.data || null);
        }
        if (appsRes.status === 'fulfilled') {
          const apps = Array.isArray(appsRes.value.data) ? appsRes.value.data : [];
          const ids = new Set();
          apps.forEach(a => {
            if (a?.job?.id != null) ids.add(a.job.id);
          });
          setAppliedIds(ids);
        }
      } catch (e) {
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = async (job) => {
    if (!job?.linkId) return;
    try {
      setApplyingId(job.id);
      // Build minimal payload from profile
      const payload = {
        name: profile?.name || '',
        email: profile?.email || '',
        college: profile?.college || '',
        cgpa: profile?.cgpa || undefined,
        skills: Array.isArray(profile?.skills) ? profile.skills : (typeof profile?.skills === 'string' ? profile.skills.split(',').map(s=>s.trim()).filter(Boolean) : [])
      };
      // Fallback: if email missing, try localStorage user
      if (!payload.email) {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const u = JSON.parse(userStr);
            if (u?.email) payload.email = u.email;
            if (u?.name && !payload.name) payload.name = u.name;
          }
        } catch {}
      }
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API_BASE}/jobs/${job.linkId}/apply`, payload, { headers });
      // Mark as applied in UI
      setAppliedIds(prev => new Set(prev).add(job.id));
      const msg = res?.data?.alreadyApplied ? 'Already applied to this job' : 'Application submitted successfully';
      res?.data?.alreadyApplied ? showInfo(msg) : showSuccess(msg);
      navigate('/candidate/applications');
    } catch (e) {
      // If already applied, also mark as applied
      const msg = e?.response?.data?.message || '';
      if (/already applied/i.test(msg)) {
        setAppliedIds(prev => new Set(prev).add(job.id));
        showInfo('Already applied to this job');
        navigate('/candidate/applications');
      } else {
        const finalMsg = msg || 'Failed to apply';
        setError(finalMsg);
        showError(finalMsg);
      }
    } finally {
      setApplyingId(null);
    }
  };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return (
      (j.title || '').toLowerCase().includes(q) ||
      (j.company || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="apps-container">
      <div className="apps-header">
        <div className="header-text">
          <h1 className="apps-title">Find Jobs</h1>
          <p className="apps-subtitle">Browse active openings and apply directly</p>
        </div>
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, company, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="apps-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="empty-title">No jobs found</h3>
            <p className="empty-text">Try a different search</p>
          </div>
        ) : (
          filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedIds.has(job.id)}
              applying={applyingId === job.id}
              onApply={handleApply}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Jobs;
