import React from 'react';

export default function PyPhoneStudioLogo() {
  return (
    <div className="pyphone-brand-logo-container">
      <img 
        src="/logo.png" 
        alt="PyPhone Studio Logo" 
        className="pyphone-logo-img" 
      />
      <div className="pyphone-brand-text">
        <h1 className="pyphone-brand-title">
          <span className="brand-pyphone">PyPhone</span>{' '}
          <span className="brand-studio">Studio</span>
        </h1>
        <div className="pyphone-brand-divider"></div>
        <p className="pyphone-brand-subtitle">Data Analysis & Visualization</p>
      </div>
    </div>
  );
}
