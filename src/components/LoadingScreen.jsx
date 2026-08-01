import React, { useMemo } from 'react';
import PyPhoneStudioLogo from './PyPhoneStudioLogo';

export default function LoadingScreen({ engineStatus }) {
  // Map engineStatus to a progress percentage
  const progress = useMemo(() => {
    if (!engineStatus || !engineStatus.status) return 0;

    const { status, message } = engineStatus;

    if (status === 'idle') return 0;
    if (status === 'ready') return 100;

    if (status === 'loading-wasm') {
      if (message && message.toLowerCase().includes('downloading')) {
        return 20;
      }
      return 10;
    }

    if (status === 'loading-packages') {
      if (message) {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('numpy')) return 30;
        if (lowerMsg.includes('pandas')) return 45;
        if (lowerMsg.includes('matplotlib')) return 60;
        if (lowerMsg.includes('micropip')) return 75;
      }
      return 50;
    }

    if (status === 'loading-seaborn') return 85;
    if (status === 'loading-datasets') return 95;

    return 10;
  }, [engineStatus]);

  return ( 
    <div className="loading-screen-container">
      <div className="loading-screen-content">
        {/* Top PyPhone Studio Brand Logo */}
        <div className="loading-logo-wrapper">
          <PyPhoneStudioLogo />
        </div>

        <div className="loader-wrapper">
          <div id="ghost">
            <div id="red">
              <div id="pupil"></div>
              <div id="pupil1"></div>
              <div id="eye"></div>
              <div id="eye1"></div>
              <div id="top0"></div>
              <div id="top1"></div>
              <div id="top2"></div>
              <div id="top3"></div>
              <div id="top4"></div>
              <div id="st0"></div>
              <div id="st1"></div>
              <div id="st2"></div>
              <div id="st3"></div>
              <div id="st4"></div>
              <div id="st5"></div>
              <div id="an1"></div>
              <div id="an2"></div>
              <div id="an3"></div>
              <div id="an4"></div>
              <div id="an5"></div>
              <div id="an6"></div>
              <div id="an7"></div>
              <div id="an8"></div>
              <div id="an9"></div>
              <div id="an10"></div>
              <div id="an11"></div>
              <div id="an12"></div>
              <div id="an13"></div>
              <div id="an14"></div>
              <div id="an15"></div>
              <div id="an16"></div>
              <div id="an17"></div>
              <div id="an18"></div>
            </div>
            <div id="shadow"></div>
          </div>
        </div>

        <div className="loading-progress-section">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="loading-status-text">
            {engineStatus?.message || 'Initializing...'}
          </div>
        </div>
      </div>
    </div>
  );
}
