import React, { useEffect, useState } from 'react';
import '../candidatepages/Payment.css';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { RiQrCodeLine } from 'react-icons/ri';

export default function Payment() {
  // Design-only payment screen (Recruiter)
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('qrcode'); // qrcode | upi | card
  const [supportUpi, setSupportUpi] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [paid, setPaid] = useState(false);
  const [txnId, setTxnId] = useState('');
  // Design-only fields for UPI/Card
  const [upiId, setUpiId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const { showInfo, showSuccess } = useToast();

  useEffect(() => {
    // Prefill UPI ID from backend config with robust fallbacks
    const tryFetch = async () => {
      const envOrigin = import.meta.env.VITE_API_ORIGIN;
      const envBase = import.meta.env.VITE_API_BASE_URL;
      let origin = envOrigin;
      if (!origin && envBase) {
        try { origin = new URL(envBase).origin; } catch {}
      }
      if (!origin) origin = 'http://localhost:8080';

      const candidates = [
        `${origin}/api/config/support-upi`,
        `${origin}/config/support-upi`,
        envBase ? `${envBase.replace(/\/$/, '')}/config/support-upi` : null,
      ].filter(Boolean);

      for (const url of candidates) {
        try {
          const res = await axios.get(url);
          const v = res?.data?.upi || '';
          if (v) { setSupportUpi(v); break; }
        } catch {}
      }
    };
    tryFetch();
  }, []);

  // Reset generated QR when inputs or tab change
  useEffect(() => {
    setQrGenerated(false);
  }, [amount, activeTab]);

  const upiUri = (id, amt) => {
    const pn = 'SmartHireX';
    const tn = 'Recruiter Payment';
    return `upi://pay?pa=${encodeURIComponent(id)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(amt || '')}&cu=INR&tn=${encodeURIComponent(tn)}`;
  };
  const effectiveUpi = (supportUpi || '').trim();
  const qrUrl = Number(amount) > 0 && effectiveUpi
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri(effectiveUpi, amount))}`
    : '';

  const startPay = () => {
    if (Number(amount) <= 0) return setError('Enter amount > 0');
    setError('');
    showInfo('Payments are coming soon. This feature will be available in a future update.', 3000);
  };

  const markPaid = async () => {
    if (Number(amount) <= 0) return setError('Enter amount > 0');
    if (!effectiveUpi) return setError('Support UPI not configured.');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('http://localhost:8080/api/payments/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount: Number(amount), transactionId: txnId })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Failed to save payment (${resp.status})`);
      }
      setPaid(true);
      showSuccess('Payment recorded successfully.');
    } catch (e) {
      setError('Failed to record payment. Please login and try again.');
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-card">
        <h2 className="payment-title">Checkout</h2>
        <p className="payment-subtitle">Scan and pay via QR Code. Default UPI is used if none is entered.</p>

        <div className="checkout-grid">
          <div className="checkout-left">
            <div className="section-title">Amount</div>
            <div className="amount-row">
              <input className="amount-input" type="number" min="1" value={amount} onChange={e=>setAmount(e.target.value)} disabled={paid} />
            </div>
            {error && <div className="payment-error" style={{ marginTop: '.5rem' }}>{error}</div>}

            <div className="method-tabs">
              {['qrcode','upi','card'].map(m => (
                <button key={m} className={`method-tab ${activeTab===m ? 'active' : ''}`} onClick={()=>setActiveTab(m)}>
                  {m === 'qrcode' && <RiQrCodeLine style={{ marginRight: 6 }} />} 
                  {m === 'qrcode' ? 'QR Code' : m === 'upi' ? 'UPI' : 'Card'}
                </button>
              ))}
            </div>
            <div className="method-panel">
              {activeTab === 'qrcode' && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <button
                    className="pay-btn"
                    onClick={()=>setQrGenerated(true)}
                    disabled={!(Number(amount) > 0 && !!effectiveUpi) || (paid && activeTab==='qrcode')}
                  >Generate QR</button>
                  {qrGenerated && qrUrl ? (
                    <img src={qrUrl} alt="UPI QR" className="payment-qr" />
                  ) : (
                    <div className="qr-box" aria-label="Static QR preview" />
                  )}
                  <small style={{ color: '#94a3b8' }}>
                    {effectiveUpi ? 'Scan this QR with any UPI app' : 'Support UPI not configured. Please set support.upi in backend.'}
                  </small>
                  <div className="amount-row">
                    <input
                      className="amount-input"
                      type="text"
                      placeholder="Transaction ID (optional)"
                      value={txnId}
                      onChange={e=>setTxnId(e.target.value)}
                      disabled={paid && activeTab==='qrcode'}
                    />
                  </div>
                </div>
              )}
              {activeTab === 'upi' && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <label className="section-title" style={{ fontSize: 14 }}>UPI</label>
                  <input
                    className="amount-input"
                    type="text"
                    placeholder="Enter your UPI ID (e.g., username@bank)"
                    value={upiId}
                    onChange={e=>setUpiId(e.target.value)}
                  />
                  <small style={{ color: '#94a3b8' }}>Design preview only. This does not process payments.</small>
                </div>
              )}
              {activeTab === 'card' && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <label className="section-title" style={{ fontSize: 14 }}>Card</label>
                  <input
                    className="amount-input"
                    type="text"
                    placeholder="Name on card"
                    value={cardName}
                    onChange={e=>setCardName(e.target.value)}
                  />
                  <input
                    className="amount-input"
                    type="text"
                    placeholder="Card number"
                    value={cardNumber}
                    onChange={e=>setCardNumber(e.target.value)}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input
                      className="amount-input"
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={e=>setCardExpiry(e.target.value)}
                    />
                    <input
                      className="amount-input"
                      type="password"
                      placeholder="CVV"
                      value={cardCvv}
                      onChange={e=>setCardCvv(e.target.value)}
                    />
                  </div>
                  <small style={{ color: '#94a3b8' }}>Design preview only. This does not process payments.</small>
                </div>
              )}
            </div>
          </div>

          <div className="checkout-right">
            <div className="section-title">Summary</div>
            <div className="summary-row"><span>Amount</span><span>₹{Number(amount||0)}</span></div>
            <div className="summary-row"><span>GST</span><span>₹0</span></div>
            <div className="summary-row"><span>Method</span><span>{activeTab==='qrcode' ? 'QR Code' : activeTab==='upi' ? 'UPI' : 'Card'}</span></div>
            <div className="summary-row"><span>Status</span><span>{activeTab==='qrcode' ? (paid ? 'Success' : 'Pending') : 'Pending'}</span></div>
            <div className="summary-row total"><span>Total</span><span>₹{Number(amount||0)}</span></div>
            <div className="checkout-actions">
              {activeTab !== 'qrcode' && (
                <button className="pay-btn" onClick={startPay} disabled={paid && activeTab==='qrcode'}>Pay Now</button>
              )}
              {activeTab === 'qrcode' && (
                <button
                  className="pay-btn"
                  onClick={markPaid}
                  disabled={!(qrGenerated && !!qrUrl) || (paid && activeTab==='qrcode')}
                >I've Paid</button>
              )}
              <button className="cancel-btn" onClick={()=>window.history.back()}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
