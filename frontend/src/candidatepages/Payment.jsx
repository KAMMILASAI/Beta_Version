import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Payment.css';

export default function Payment() {
  // we no longer ask UPI, backend will use placeholder
  
  const [amount,  setAmount]  = useState('');
  const [resp,    setResp]    = useState(null);
  const [error,   setError]   = useState('');
  const [success,setSuccess] = useState(false);
  const navigate = useNavigate();

  // after showing success for 2s, redirect
  React.useEffect(()=>{
    if(success){
      const t = setTimeout(()=>navigate('/candidate/dashboard'),2000);
      return ()=>clearTimeout(t);
    }
  },[success]);

  const startPay = async () => {
    
    if (Number(amount) <= 0)               return setError('Enter amount > 0');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:5000/api/payments/initiate',
        { amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` }});
      setResp(data);  setError('');
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
  };

  

  return (
    <div className="pay-overlay">

    <div className="pay-popup">
      <h2>Optional Support Payment</h2>
      <p>
        If SmartHireX helped you land a job, chip in anything you like!
        <br/>Payment is 100 % optional – but highly motivating 😊
      </p>

      {success ? (
        <h3 style={{color:'#0f0'}}>Payment Successful ✔</h3>
      ) : !resp ? (
        <>
          
          <input placeholder="Amount (₹)" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
          {error && <span className="err">{error}</span>}
          <button onClick={startPay}>Generate UPI Link</button>
        </>
      ) : (
        <>
          <img src={resp.qrData} alt="Pay via UPI" className="qr"/>
          <p>or <a href={resp.upiLink}>tap to pay</a></p>
          <p>Order ID : {resp.orderId}</p>
          <button onClick={async()=>{
            const token = localStorage.getItem('token');
            try{
              await axios.patch(`http://localhost:5000/api/payments/mark-paid/${resp.orderId}`,{}, { headers:{Authorization:`Bearer ${token}`} });
              setSuccess(true);
              }catch(e){setError('Failed to mark paid');}
          }}>I’ve Paid</button>
        </>
      )}
    </div>
  </div>
  );
}