import React from 'react';
import { FaCheckCircle, FaClock, FaTimesCircle, FaFileAlt, FaExternalLinkAlt } from 'react-icons/fa';

export default function JobCard({ job, applicationStatus }) {
  const statusColors = {
    applied: { bg: 'rgba(3, 168, 244, 0.2)', text: '#03a9f4', icon: <FaClock className="mr-1" /> },
    reviewed: { bg: 'rgba(255, 193, 7, 0.2)', text: '#ffc107', icon: <FaFileAlt className="mr-1" /> },
    test_completed: { bg: 'rgba(76, 175, 80, 0.2)', text: '#4caf50', icon: <FaCheckCircle className="mr-1" /> },
    rejected: { bg: 'rgba(244, 67, 54, 0.2)', text: '#f44336', icon: <FaTimesCircle className="mr-1" /> },
    selected: { bg: 'rgba(76, 175, 80, 0.2)', text: '#4caf50', icon: <FaCheckCircle className="mr-1" /> }
  };

  const status = applicationStatus || job.status || 'not_applied';
  const statusInfo = statusColors[status] || { bg: 'rgba(158, 158, 158, 0.2)', text: '#9e9e9e' };
  
  const gradient = ['#667eea','#764ba2','#f093fb','#f5576c','#4facfe','#00f2fe','#43e97b','#84fab0','#fa709a','#fee140'];
  const bg = `linear-gradient(135deg, ${gradient[Math.floor(Math.random()*gradient.length)]} 0%, ${gradient[Math.floor(Math.random()*gradient.length)]} 100%)`;

  const renderActionButton = () => {
    switch(status) {
      case 'not_applied':
        return (
          <a 
            href={`/jobs/${job.linkId}`} 
            className="job-action-btn"
            style={{
              background: '#ffffff',
              color: '#0dcaf0',
              '&:hover': { background: '#0dcaf0', color: '#fff' }
            }}
          >
            Apply Now
          </a>
        );
      case 'test_completed':
        return (
          <a 
            href={`/test/results/${job.testResultId}`}
            className="job-action-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#4caf50',
              '&:hover': { background: '#4caf50', color: '#fff' }
            }}
          >
            View Results <FaExternalLinkAlt className="ml-1" />
          </a>
        );
      case 'selected':
        return (
          <a 
            href={`/test/results/${job.testResultId}`}
            className="job-action-btn"
            style={{
              background: 'rgba(76, 175, 80, 0.9)',
              color: '#fff',
              '&:hover': { background: '#43a047' }
            }}
          >
            View Offer Details
          </a>
        );
      default:
        return (
          <div 
            className="job-action-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              cursor: 'not-allowed'
            }}
          >
            {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </div>
        );
    }
  };

  return (
    <div 
      className="job-card"
      style={{
        width: '100%',
        background: bg,
        color: '#fff',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)'
        }
      }}
    >
      {/* Status Badge */}
      {status !== 'not_applied' && (
        <div 
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: statusInfo.bg,
            color: statusInfo.text,
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
          }}
        >
          {statusInfo.icon}
          {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </div>
      )}

      {/* Job Title and Company */}
      <div style={{ 
        marginRight: status !== 'not_applied' ? '80px' : '0',
        transition: 'margin-right 0.3s ease'
      }}>
        <h3 style={{ 
          fontSize: '1.4rem',
          fontWeight: '700',
          marginBottom: '4px',
          lineHeight: '1.3'
        }}>
          {job.title}
        </h3>
        <div style={{ 
          fontSize: '1rem', 
          opacity: 0.9,
          marginBottom: '8px'
        }}>
          {job.company} • {job.location}
        </div>
      </div>

      {/* Job Description (truncated) */}
      <div style={{ 
        fontSize: '0.95rem',
        lineHeight: '1.5',
        opacity: 0.95,
        flexGrow: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {job.description}
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '6px',
          margin: '8px 0'
        }}>
          {job.skills.slice(0, 6).map((skill, i) => (
            <span 
              key={i} 
              style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '0.75rem',
                backdropFilter: 'blur(5px)'
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Meta Info */}
      <div style={{ 
        fontSize: '0.8rem',
        opacity: 0.85,
        marginTop: 'auto',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ opacity: 0.7 }}>Closes: </span>
          <span>{new Date(job.expiresAt).toLocaleDateString()}</span>
        </div>
        {job.posted && (
          <div>
            <span style={{ opacity: 0.7 }}>Posted: </span>
            <span>{new Date(job.posted).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div style={{ marginTop: '12px' }}>
        {React.cloneElement(renderActionButton(), {
          style: {
            ...renderActionButton().props.style,
            textDecoration: 'none',
            display: 'inline-block',
            textAlign: 'center',
            borderRadius: '8px',
            padding: '10px 16px',
            fontWeight: '600',
            fontSize: '0.9rem',
            width: '100%',
            transition: 'all 0.2s ease',
            border: 'none',
            cursor: 'pointer',
            ...renderActionButton().props.style
          },
          onMouseEnter: (e) => {
            if (renderActionButton().props.style['&:hover']) {
              Object.entries(renderActionButton().props.style['&:hover']).forEach(([key, value]) => {
                e.currentTarget.style[key] = value;
              });
            }
          },
          onMouseLeave: (e) => {
            if (renderActionButton().props.style) {
              Object.entries(renderActionButton().props.style).forEach(([key, value]) => {
                if (key !== '&:hover') {
                  e.currentTarget.style[key] = value;
                }
              });
            }
          }
        })}
      </div>

      {/* Test Results (if applicable) */}
      {job.testResult && status === 'test_completed' && (
        <div style={{
          marginTop: '12px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Test Score:</span>
            <span style={{ fontWeight: '600' }}>{job.testResult.score}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Correct Answers:</span>
            <span>{job.testResult.correctAnswers}/{job.testResult.totalQuestions}</span>
          </div>
        </div>
      )}
    </div>
  );
}
