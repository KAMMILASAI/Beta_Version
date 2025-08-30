import React, { useRef, useState, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';
import axios from 'axios';
import './EditProfile.css';

export default function EditProfile() {
  const [form, setForm] = useState({
    image: '',
    name: '',
    email: '',
    profileType: 'student', // 'student' | 'postgraduate'
    isFresher: false,
    degree: '',
    college: '',
    cgpa: '',
    company: '',
    lpa: '',
    yearsExp: '',
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
        setForm(prev => ({
          ...prev,
          ...res.data,
          profileType: res.data.profileType || prev.profileType,
          isFresher: !!res.data.isFresher,
          degree: res.data.degree || '',
          college: res.data.college || '',
          cgpa: res.data.cgpa ?? '',
          company: res.data.company || '',
          lpa: res.data.lpa ?? '',
          yearsExp: res.data.yearsExp ?? '',
          skills: typeof res.data.skills === 'string' ? res.data.skills : Array.isArray(res.data.skills) ? res.data.skills.join(', ') : (res.data.skills || '')
        }));
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
    <div className="edit-profile-container dashboard-container">
      <h2>Edit Profile</h2>
      <div className="profile-subtitle">Update your profile once and use it to auto-apply to jobs.</div>
      {error && <div className="profile-message error">{error}</div>}
      {success && <div className="profile-message success">Profile updated!</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="profile-avatar-wrap">
          <div
            className="profile-avatar-container profile-avatar"
            onClick={handleImageClick}
            title="Click to upload image"
          >
            {imagePreview ? (
              <img className="profile-avatar-img" src={imagePreview} alt="Preview" />
            ) : (
              <FiUser className="profile-avatar-icon" size={80} />
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
          <div className="profile-form-group" style={{ gridColumn: '1 / -1' }}>
            <hr style={{ border: 0, borderTop: '1px solid #26314f', margin: '8px 0 12px' }} />
            <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Education / Experience</div>
          </div>
          <div className="profile-form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid #26314f', paddingTop: 12, marginTop: 8 }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#cbd5e1' }}>Profile Type:</label>
            <label style={{ marginRight: 16 }}>
              <input type="radio" name="profileType" value="student" checked={form.profileType === 'student'} onChange={handleChange} /> Student
            </label>
            <label>
              <input type="radio" name="profileType" value="postgraduate" checked={form.profileType === 'postgraduate'} onChange={handleChange} /> Post Graduate
            </label>
          </div>
          {form.profileType === 'postgraduate' && (
            <div className="profile-form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#cbd5e1' }}>Are you a Fresher?</label>
              <label>
                <input
                  type="checkbox"
                  checked={!!form.isFresher}
                  onChange={(e) => setForm(f => ({ ...f, isFresher: e.target.checked }))}
                />{' '}Yes, I'm a fresher
              </label>
            </div>
          )}
          {form.profileType === 'postgraduate' && form.isFresher && (
            <>
              <div className="profile-form-group">
                <label>Graduation Degree:</label>
                <select name="degree" value={form.degree || ''} onChange={handleChange}>
                  <option value="">Select degree</option>
                  <option value="BTech">BTech</option>
                  <option value="BE">BE</option>
                  <option value="MTech">MTech</option>
                  <option value="ME">ME</option>
                  <option value="BSc">BSc</option>
                  <option value="MSc">MSc</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="MBA">MBA</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}
          {(form.profileType === 'student' || (form.profileType === 'postgraduate' && form.isFresher)) && (
            <>
              <div className="profile-form-group">
                <label>College:</label>
                <input type="text" name="college" value={form.college || ''} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label>CGPA:</label>
                <input type="number" step="0.01" name="cgpa" value={form.cgpa || ''} onChange={handleChange} />
              </div>
            </>
          )}
          {form.profileType === 'postgraduate' && !form.isFresher && (
            <>
              <div className="profile-form-group">
                <label>Company Name:</label>
                <input type="text" name="company" value={form.company || ''} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label>Current/Last CTC (LPA):</label>
                <input type="number" step="0.1" name="lpa" value={form.lpa || ''} onChange={handleChange} />
              </div>
              <div className="profile-form-group">
                <label>Years of Experience:</label>
                <input type="number" step="0.1" name="yearsExp" value={form.yearsExp || ''} onChange={handleChange} />
              </div>
            </>
          )}
          <div className="profile-form-group" style={{ gridColumn: '1 / -1' }}>
            <hr style={{ border: 0, borderTop: '1px solid #26314f', margin: '8px 0 12px' }} />
            <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Contact & Links</div>
          </div>
          {/* Optional: keep reg no */}
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
          <div className="profile-form-group skills-section" style={{ gridColumn: '1 / -1' }}>
            <label>Skills (comma separated):</label>
            <input type="text" name="skills" value={form.skills || ''} onChange={handleChange} />
          </div>
        </div>
        <div className="profile-actions">
          <button type="submit" className="profile-submit-btn">
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
}
