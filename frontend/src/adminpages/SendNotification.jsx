import { useState } from 'react';
import axios from 'axios';
import './SendNotification.css';

export default function SendNotification() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/notifications', { title, message }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Notification sent to all users!');
      setTitle('');
      setMessage('');
    } catch (err) {
      setError('Failed to send notification');
    }
    setLoading(false);
  }

  return (
    <div className="send-notification-root">
      <h2>Send Notification</h2>
      <form className="send-notification-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={4}
        />
        <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Notification'}</button>
      </form>
      {success && <div className="notif-success">{success}</div>}
      {error && <div className="notif-error">{error}</div>}
    </div>
  );
}
