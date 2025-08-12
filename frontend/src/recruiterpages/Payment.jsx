import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../candidatepages/Payment.css';

export default function Payment() {
  const [amount, setAmount] = useState('');
  const [resp, setResp] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => navigate('/recruiter/dashboard'), 2000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const startPay = async () => {
    if (Number(amount) <= 0) return setError('Enter amount > 0');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:5000/api/payments/initiate', { amount: Number(amount) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResp(data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="pay-overlay">
      <div className="pay-popup">
        <h2>Support / Payment</h2>
        {error && <p className="err">{error}</p>}
        {success ? (
          <h3 style={{ color: '#28a745' }}>Payment Successful ✔</h3>
        ) : !resp ? (
          <>
            <input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} />
            <button onClick={startPay}>Generate QR</button>
          </>
        ) : (
          <>
            <img src={resp.qrData} alt="Pay via UPI" className="qr" />
            <p>or <a href={resp.upiLink}>tap to pay</a></p>
            <p>Order ID : {resp.orderId}</p>
            <button onClick={async () => {
              const token = localStorage.getItem('token');
              try {
                await axios.patch(`http://localhost:5000/api/payments/mark-paid/${resp.orderId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                setSuccess(true);
              } catch (e) {
                setError('Failed to mark paid');
              }
            }}>I’ve Paid</button>
          </>
        )}
      </div>
    </div>
  );
}
