import { useEffect, useState } from 'react';
import axios from 'axios';
import './SendNotification.css';
import { useToast } from '../contexts/ToastContext';

export default function SendNotification() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  function formatDateSafe(dt) {
    if (!dt) return '-';
    const ms = Date.parse(dt);
    if (isNaN(ms)) return '-';
    try { return new Date(ms).toLocaleString(); } catch { return '-'; }
  }

  async function fetchNotifications() {
    try {
      setListLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data || []);
    } catch (e) {
      // Silent fail for list, but log for debugging
      console.error('Failed to load notifications:', e);
    } finally {
      setListLoading(false);
    }
  }

  // Load on mount
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/notifications', { title, message, audience }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const audienceLabel = audience === 'all' ? 'all users' : audience === 'candidate' ? 'candidates' : 'recruiters';
      setSuccess(`Notification sent to ${audienceLabel}!`);
      showSuccess(`Notification sent to ${audienceLabel}!`);
      setTitle('');
      setMessage('');
      setAudience('all');
      fetchNotifications();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send notification';
      setError(msg);
      showError(msg);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(curr => curr.filter(n => n.id !== id));
      showSuccess('Notification deleted');
    } catch (e) {
      console.error('Failed to delete notification:', e);
      showError('Failed to delete notification');
    }
  }

  return (
    <div className="send-notification-root">
      <h2 className="sn-heading">Send Notification</h2>
      <form className="send-notification-form" onSubmit={handleSubmit}>
        <label className="sn-label" htmlFor="notif-title">Title</label>
        <input className="sn-input"
          id="notif-title"
          name="title"
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea className="sn-textarea"
          placeholder="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={4}
        />
        <div className="send-notification-actions">
          <select className="sn-select" value={audience} onChange={e => setAudience(e.target.value)}>
            <option value="all">All Users</option>
            <option value="candidate">Only Candidates</option>
            <option value="recruiter">Only Recruiters</option>
          </select>
          <button type="submit" disabled={loading || !title.trim() || !message.trim()}>{loading ? 'Sending...' : 'Send Notification'}</button>
        </div>
      </form>
      {success && <div className="notif-success">{success}</div>}
      {error && <div className="notif-error">{error}</div>}

      <h3 className="sn-subheading">Recent Notifications</h3>
      {listLoading && <div>Loading...</div>}
      {!listLoading && notifications.length === 0 && <div>No notifications yet.</div>}
      {!listLoading && notifications.length > 0 && (
        <div className="notification-list-wrapper">
          <table className="notification-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Message</th>
                <th>Audience</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id}>
                  <td>{n.title}</td>
                  <td>{n.message}</td>
                  <td><span className={`badge badge-${n.audience}`}>{n.audience}</span></td>
                  <td>{formatDateSafe(n.createdAt)}</td>
                  <td>
                    <button className="notif-delete-btn" onClick={() => handleDelete(n.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
