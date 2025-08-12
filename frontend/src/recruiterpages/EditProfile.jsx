import React, { useRef, useState, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';
import axios from 'axios';

export default function EditProfile() {
  const [form, setForm] = useState({
    image: '',
    name: '',
    email: '',
    company: '',
    companyLink: '',
    linkedin: '',
    github: '',
    location: '',
    numEmployees: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setError('');
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/recruiter/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm(res.data);
        setImagePreview(res.data.image || null);
      } catch (err) {
        setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
      }
    }
    fetchProfile();
  }, []);

  const handleImageClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('image', file);
      const res = await axios.patch('http://localhost:5000/api/user/profile-photo', data, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setForm(f => ({ ...f, image: res.data.image }));
    } catch (err) {
      console.error('Image upload failed', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const res = await axios.put('http://localhost:5000/api/recruiter/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      setForm(res.data);
      setImagePreview(res.data.image || null);
    } catch (err) {
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
      <h2>Edit Recruiter Profile</h2>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 16 }}>Profile updated!</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 24 }}>
          <div
            style={{ width: 140, height: 140, borderRadius: '50%', background: '#eee', display: 'block', cursor: 'pointer', overflow: 'hidden' }}
            onClick={handleImageClick}
            title="Click to upload image"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <FiUser size={80} style={{ color: '#bbb', display: 'block', margin: '30px auto' }} />
            )}
          </div>
          <input
            type="file"
            name="image"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
          <div style={{ flex: '1 1 45%' }}>
            <label>Recruiter Name:</label>
            <input type="text" name="name" value={form.name || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label>Email:</label>
            <input type="email" name="email" value={form.email || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label>Company Name:</label>
            <input type="text" name="company" value={form.company || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label>Company Website:</label>
            <input type="url" name="companyLink" value={form.companyLink || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label>LinkedIn Link:</label>
            <input type="url" name="linkedin" value={form.linkedin || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label>GitHub Link:</label>
            <input type="url" name="github" value={form.github || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label>Location/Address:</label>
            <input type="text" name="location" value={form.location || ''} onChange={handleChange} />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <label>Number of Employees:</label>
            <input type="number" name="numEmployees" value={form.numEmployees || ''} onChange={handleChange} min={1} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          <button type="button" style={{ background: '#ff4500', color: '#fff', padding: '8px 24px', border: 'none', borderRadius: 4 }}>Cancel</button>
          <button type="submit" style={{ background: '#ff7900', color: '#fff', padding: '8px 24px', border: 'none', borderRadius: 4 }}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
