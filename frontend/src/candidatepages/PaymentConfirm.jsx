import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Payment.css';

export default function PaymentConfirm() {
  const navigate = useNavigate();
  return (
    <div className="payment-page">
      <div className="payment-card" style={{ textAlign: 'center' }}>
        <h2 className="payment-title">Optional Support Payment</h2>
        <p className="payment-subtitle">
          If SmartHireX helped you land a job, chip in anything you like! Payment is optional but highly motivating 😊
        </p>
        <div className="payment-actions">
          <button className="btn" onClick={()=>navigate('/candidate/payment')}>Proceed</button>
          <button className="btn btn-secondary" onClick={()=>window.history.back()}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
