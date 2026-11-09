import React from "react";

export default function FinTrackLogo({ size = 32, showText = true, textClass = "fs-5" }) {
  return (
    <div className="d-inline-flex align-items-center gap-2 text-decoration-none">
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        className="flex-shrink-0 shadow-sm"
        style={{ borderRadius: `${size * 0.24}px` }}
      >
        <defs>
          <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#246845" />
            <stop offset="100%" stopColor="#16432b" />
          </linearGradient>
          <linearGradient id="logoAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="logoTrendGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>

        <rect width="100" height="100" rx="24" fill="url(#logoBgGrad)" />
        <rect x="2" y="2" width="96" height="96" rx="22" fill="none" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="2" />

        <g>
          <rect x="24" y="24" width="10" height="52" rx="5" fill="#ffffff" />
          <rect x="24" y="24" width="46" height="10" rx="5" fill="#ffffff" />
          <rect x="24" y="43" width="28" height="9" rx="4.5" fill="url(#logoAmberGrad)" />
          <path 
            d="M 44 74 L 60 56 L 76 56" 
            fill="none" 
            stroke="url(#logoTrendGrad)" 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx="76" cy="56" r="6" fill="#6ee7b7" />
          <circle cx="76" cy="56" r="2.5" fill="#16432b" />
        </g>
      </svg>

      {showText && (
        <span className={`fw-bold fintrack-brand-text tracking-tight mb-0 lh-1 ${textClass}`} style={{ letterSpacing: "-0.5px" }}>
          Fin<span className="fintrack-brand-track">Track</span>
        </span>
      )}
    </div>
  );
}

