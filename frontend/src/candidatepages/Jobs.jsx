import React, { useEffect, useState } from 'react';
import JobCard from './JobCard';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/candidate/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setJobs(data);
      setLoading(false);
    }
    fetchJobs();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24 }}>
      <h2 style={{ marginBottom: 32, color: '#0dcaf0', fontWeight: 700 }}>Available Jobs</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, justifyItems: 'center' }}>
        {jobs.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
