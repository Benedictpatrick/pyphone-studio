import React, { useState, useEffect } from 'react';
import { X, Search, Package, Check, Loader2, AlertCircle } from 'lucide-react';
import { installPyodidePackage } from '../services/pyodideService';
import { hapticLight, hapticMedium, hapticError, hapticSuccess } from '../utils/haptics';

export default function PackageManagerModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Suggested popular packages for data science that aren't loaded by default
  const popularPackages = [
    'scikit-learn', 'scipy', 'statsmodels', 'networkx', 'beautifulsoup4', 'requests'
  ];

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setLogs([]);
      setError(null);
      setSuccess(false);
      setIsInstalling(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstall = async (pkgName) => {
    if (!pkgName.trim()) return;
    
    hapticMedium();
    setIsInstalling(true);
    setError(null);
    setSuccess(false);
    setLogs([{ type: 'info', msg: `Installing ${pkgName}...` }]);
    
    try {
      await installPyodidePackage(pkgName, (log) => {
        setLogs(prev => [...prev, { type: 'log', msg: log }]);
      });
      setSuccess(true);
      setLogs(prev => [...prev, { type: 'success', msg: `Successfully installed ${pkgName}!` }]);
      hapticSuccess();
      setQuery('');
    } catch (err) {
      setError(err.message);
      setLogs(prev => [...prev, { type: 'error', msg: `Failed: ${err.message}` }]);
      hapticError();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card packages-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <Package className="w-5 h-5 text-blue-400" />
              <span>Package Manager (PIP)</span>
            </div>
            <button className="modal-close-btn" onClick={() => { hapticLight(); onClose(); }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Search and install pure Python packages from PyPI to use in your environment.
          </p>

          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="e.g. scikit-learn"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInstall(query);
              }}
              disabled={isInstalling}
            />
            <button 
              className="install-btn"
              onClick={() => handleInstall(query)}
              disabled={isInstalling || !query.trim()}
            >
              {isInstalling ? <Loader2 size={16} className="spinner" /> : 'Install'}
            </button>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-banner">
              <Check size={16} />
              <span>Package installed successfully! You can now import it in your code.</span>
            </div>
          )}

          <div className="packages-log-window">
            {logs.length === 0 ? (
              <div className="empty-logs">
                <Package size={24} />
                <p>Popular Packages:</p>
                <div className="popular-tags">
                  {popularPackages.map(pkg => (
                    <button 
                      key={pkg} 
                      className="pkg-tag" 
                      onClick={() => handleInstall(pkg)}
                      disabled={isInstalling}
                    >
                      {pkg}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className={`log-line log-${l.type}`}>
                  {l.msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
