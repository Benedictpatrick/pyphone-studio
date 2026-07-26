import React from 'react';

export default function PyPhoneStudioLogo() {
  return (
    <div className="pyphone-brand-logo-container">
      {/* Smartphone + Python Snakes + Bar Chart Icon */}
      <svg 
        viewBox="0 0 110 110" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="pyphone-logo-svg"
      >
        {/* Smartphone Frame */}
        <rect 
          x="12" 
          y="8" 
          width="64" 
          height="94" 
          rx="12" 
          stroke="currentColor" 
          strokeWidth="6" 
          fill="none" 
          className="phone-frame-stroke"
        />
        {/* Phone Notch */}
        <rect x="36" y="14" width="16" height="3.5" rx="1.75" fill="currentColor" className="phone-notch-fill" />

        {/* Python Upper Blue Snake */}
        <path 
          d="M44.5 25C37 25 31.5 29 31.5 35.5V42.5H45V44.5H31.5C26.5 44.5 22.5 48.5 22.5 53.5C22.5 59 26.5 63 31.5 63H36V56.5C36 51.5 40 47.5 45 47.5H57.5V39.5C57.5 34 53 25 44.5 25ZM39.5 31C40.8 31 41.8 32 41.8 33.3C41.8 34.6 40.8 35.6 39.5 35.6C38.2 35.6 37.2 34.6 37.2 33.3C37.2 32 38.2 31 39.5 31Z" 
          fill="#0066FF"
        />

        {/* Python Lower Yellow Snake */}
        <path 
          d="M45.5 65C53 65 58.5 61 58.5 54.5V47.5H45V45.5H58.5C63.5 45.5 67.5 41.5 67.5 36.5C67.5 31 63.5 27 58.5 27H54V33.5C54 38.5 50 42.5 45 42.5H32.5V50.5C32.5 56 37 65 45.5 65ZM50.5 59C49.2 59 48.2 58 48.2 56.7C48.2 55.4 49.2 54.4 50.5 54.4C51.8 54.4 52.8 55.4 52.8 56.7C52.8 58 51.8 59 50.5 59Z" 
          fill="#FFC107"
        />

        {/* Bar Chart Rising Columns */}
        <rect x="52" y="80" width="7" height="14" rx="2" fill="#0066FF" />
        <rect x="63" y="70" width="7" height="24" rx="2" fill="#0052CC" />
        <rect x="74" y="60" width="7" height="34" rx="2" fill="#0039A6" />
      </svg>

      {/* Large Visible PyPhone Studio Typography */}
      <div className="pyphone-brand-text">
        <h1 className="pyphone-brand-title">
          <span className="brand-pyphone">PyPhone</span>{' '}
          <span className="brand-studio">Studio</span>
        </h1>
        <div className="pyphone-brand-divider"></div>
        <p className="pyphone-brand-subtitle">Mobile Python Data Science Canvas</p>
      </div>
    </div>
  );
}
