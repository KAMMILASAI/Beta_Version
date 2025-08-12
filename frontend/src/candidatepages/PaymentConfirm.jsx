import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Payment.css';

export default function PaymentConfirm() {
  const navigate = useNavigate();
  return (
    <div className="pay-overlay">
      <div className="pay-popup" style={{textAlign:'center'}}>
        <h2>Optional Support Payment</h2>
        <p>
          If SmartHireX helped you land a job, chip in anything you like!
          <br />Payment is 100% optional – but highly motivating 😊
        </p>
        <div style={{display:'flex',gap:'1rem',justifyContent:'center',marginTop:'1.2rem'}}>
          <button onClick={()=>navigate('/candidate/payment')} style={{flex:1}}>Proceed</button>
          <button onClick={()=>window.history.back()} style={{flex:1,background:'#666'}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
