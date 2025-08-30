import React from 'react';
import { useLoading } from '../contexts/LoadingContext';

const GlobalLoader = () => {
  const { isLoading } = useLoading();
  if (!isLoading) return null;

  return (
    <div className="loader-overlay">
      <style>{`
        .loader-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: transparent; display: flex; justify-content: center; align-items: center; z-index: 9999; }
        .loader-text { font-size: 20px; font-weight: bold; font-family: "Segoe UI", sans-serif; display: flex; gap: 5px; text-transform: uppercase; perspective: 1000px; }
        .loader-text span { display: inline-block; opacity: 0; transform: translateY(30px) scale(0.8) rotateX(0deg); background: linear-gradient(90deg, #1a73e8, #00c6ff, #1a73e8); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: bounceGlow 2s infinite, gradientShift 3s infinite linear, flicker 1.5s infinite alternate; animation-timing-function: ease-in-out; }
        @keyframes gradientShift { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
        @keyframes bounceGlow { 0% { opacity: 0; transform: translateY(30px) scale(0.8) rotateX(0deg); text-shadow: none; } 20% { opacity: 1; transform: translateY(-12px) scale(1.15) rotateX(15deg); text-shadow: 0 0 12px rgba(0,198,255,0.8); } 40% { transform: translateY(0) scale(1) rotateX(-10deg); text-shadow: 0 0 18px rgba(26,115,232,0.9); } 60% { transform: translateY(-6px) scale(1.05) rotateX(8deg); text-shadow: 0 0 15px rgba(0,198,255,0.6); } 80% { transform: translateY(0) scale(1) rotateX(0deg); opacity: 1; text-shadow: 0 0 8px rgba(26,115,232,0.5); } 100% { opacity: 0; transform: translateY(30px) scale(0.8) rotateX(-8deg); text-shadow: none; } }
        @keyframes flicker { 0% { filter: brightness(1); } 50% { filter: brightness(1.3); } 100% { filter: brightness(0.9); } }
        .loader-text span:nth-child(1)  { animation-delay: 0s, 0s, 0s; }
        .loader-text span:nth-child(2)  { animation-delay: 0.12s, 0s, 0.1s; }
        .loader-text span:nth-child(3)  { animation-delay: 0.24s, 0s, 0.2s; }
        .loader-text span:nth-child(4)  { animation-delay: 0.36s, 0s, 0.3s; }
        .loader-text span:nth-child(5)  { animation-delay: 0.48s, 0s, 0.4s; }
        .loader-text span:nth-child(6)  { animation-delay: 0.6s, 0s, 0.5s; }
        .loader-text span:nth-child(7)  { animation-delay: 0.72s, 0s, 0.6s; }
        .loader-text span:nth-child(8)  { animation-delay: 0.84s, 0s, 0.7s; }
        .loader-text span:nth-child(9)  { animation-delay: 0.96s, 0s, 0.8s; }
        .loader-text span:nth-child(10) { animation-delay: 1.08s, 0s, 0.9s; }
      `}</style>
      <div className="loader-text" aria-label="Loading SmartHireX">
        <span>S</span>
        <span>m</span>
        <span>a</span>
        <span>r</span>
        <span>t</span>
        <span>H</span>
        <span>i</span>
        <span>r</span>
        <span>e</span>
        <span>X</span>
      </div>
    </div>
  );
};

export default GlobalLoader;
