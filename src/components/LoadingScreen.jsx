import React, { useMemo } from 'react';
import { Terminal } from 'lucide-react';

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
        <div className="loader-wrapper">
          <div className="loader"></div>
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
