import React, { useRef, useState, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';
import axios from 'axios';
import './EditProfile.css';

export default function EditProfile() {
  const [form, setForm] = useState({
    image: '',
    name: '',
    email: '',
    college: '',
    regNo: '',
    location: '',
    portfolio: '',
    github: '',
    linkedin: '',
    skills: '',
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
        const res = await axios.get('http://localhost:8080/api/candidate/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm(res.data);
        setImagePreview(res.data.image || null);
        console.log('Profile loaded:', res.data);
      } catch (err) {
        setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
        console.error('Profile load error:', err);
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
      const res = await axios.patch('http://localhost:8080/api/user/profile-photo', data, {
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
      const res = await axios.put('http://localhost:8080/api/candidate/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      setForm(res.data);
      setImagePreview(res.data.image || null);
      console.log('Profile updated:', res.data);
    } catch (err) {
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message));
      console.error('Profile update error:', err);
    }
  };

  return (
    <div className="edit-profile-container" style={{ 
      width: '100%', 
      margin: 0, 
      padding: 32, 
      background: 'white',
      minHeight: '100vh',
      borderRadius: 0, 
      boxShadow: 'none' 
    }}>
      <h2>Edit Profile</h2>
      {error && <div className="profile-message error">{error}</div>}
      {success && <div className="profile-message success">Profile updated!</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
          <div
            className="profile-avatar-container"
            style={{ width: 160, height: 160, borderRadius: '50%', background: '#eee', display: 'block', cursor: 'pointer', overflow: 'hidden' }}
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
        <div className="profile-form-grid">
          <div className="profile-form-group">
            <label>Name:</label>
            <input type="text" name="name" value={form.name || ''} onChange={handleChange} />
          </div>
          <div className="profile-form-group">
            <label>Email:</label>
            <input type="email" name="email" value={form.email || ''} onChange={handleChange} />
          </div>
          <div className="profile-form-group">
            <label>College:</label>
            <input type="text" name="college" value={form.college || ''} onChange={handleChange} />
          </div>
          <div className="profile-form-group">
            <label>College Reg. No:</label>
            <input type="text" name="regNo" value={form.regNo || ''} onChange={handleChange} />
          </div>
          <div className="profile-form-group">
            <label>Location/Address:</label>
            <input type="text" name="location" value={form.location || ''} onChange={handleChange} />
          </div>
          <div className="profile-form-group">
            <label>Portfolio Link:</label>
            <input type="url" name="portfolio" value={form.portfolio || ''} onChange={handleChange} />
          </div>
          <div className="profile-form-group">
            <label>GitHub Link:</label>
            <input type="url" name="github" value={form.github || ''} onChange={handleChange} />
          </div>
          <div className="profile-form-group">
            <label>LinkedIn Link:</label>
            <input type="url" name="linkedin" value={form.linkedin || ''} onChange={handleChange} />
          </div>
          <div className="profile-form-group skills-section">
            <label>Skills (comma separated):</label>
            <input type="text" name="skills" value={form.skills || ''} onChange={handleChange} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button type="submit" className="profile-submit-btn">
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
}
