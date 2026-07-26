import React, { useState } from 'react';
import { Settings, X, Trash2, Info, Smartphone, Download, Check, RefreshCw } from 'lucide-react';

const FONT_SIZES = [12, 14, 16, 18];

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onInstallPwa,
  isAppInstalled,
  canInstallPwa
}) {

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');

  if (!isOpen) return null;

  const handleForceUpdateApp = async () => {
    setIsUpdating(true);
    setUpdateStatus('Clearing cache & fetching latest build...');

    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      }

      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
    } catch (e) {
      console.warn('Cache clear warning:', e);
    }

    setTimeout(() => {
      window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
    }, 500);
  };

  const handleClearData = () => {
    localStorage.removeItem('pyphone_notebook_cells_v3');
    localStorage.removeItem('pyphone_script_code_v3');
    localStorage.removeItem('pyphone_saved_projects_v1');
    localStorage.removeItem('pyphone_last_mode_v3');
    localStorage.removeItem('pyphone_editor_settings');
    localStorage.removeItem('pyphone_theme');
    window.location.reload();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Settings</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Editor Font Size */}
          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Editor Font Size</span>
                <span className="settings-label-desc">Size of code text in the editor</span>
              </div>
              <select
                className="settings-select"
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ ...settings, fontSize: Number(e.target.value) })}
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Size */}
          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Tab Size</span>
                <span className="settings-label-desc">Number of spaces per indentation</span>
              </div>
              <select
                className="settings-select"
                value={settings.tabSize}
                onChange={(e) => onUpdateSettings({ ...settings, tabSize: Number(e.target.value) })}
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
          </div>

          {/* Word Wrap */}
          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Word Wrap</span>
                <span className="settings-label-desc">Wrap long lines to fit the editor width</span>
              </div>
              <button
                className={`settings-toggle ${settings.wordWrap ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ ...settings, wordWrap: !settings.wordWrap })}
              >
                <span className="settings-toggle-knob"></span>
              </button>
            </div>
          </div>

          {/* Auto-Save */}
          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Auto-Save</span>
                <span className="settings-label-desc">Automatically save your work to browser storage</span>
              </div>
              <button
                className={`settings-toggle ${settings.autoSave ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ ...settings, autoSave: !settings.autoSave })}
              >
                <span className="settings-toggle-knob"></span>
              </button>
            </div>
          </div>

          {/* Show Line Numbers */}
          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Show Line Numbers</span>
                <span className="settings-label-desc">Display line numbers in the code editor</span>
              </div>
              <button
                className={`settings-toggle ${settings.showLineNumbers ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ ...settings, showLineNumbers: !settings.showLineNumbers })}
              >
                <span className="settings-toggle-knob"></span>
              </button>
            </div>
          </div>

          {/* Haptic Feedback */}
          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Haptic Feedback</span>
                <span className="settings-label-desc">Vibrate on interactions (mobile only)</span>
              </div>
              <button
                className={`settings-toggle ${settings.hapticsEnabled !== false ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ ...settings, hapticsEnabled: settings.hapticsEnabled === false ? true : false })}
              >
                <span className="settings-toggle-knob"></span>
              </button>
            </div>
            {settings.hapticsEnabled !== false && (
              <div className="settings-row" style={{ marginTop: '12px', borderTop: '1px solid var(--hairline)', paddingTop: '12px' }}>
                <div className="settings-label" style={{ flex: 1 }}>
                  <span className="settings-label-text">Vibration Strength</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="10"
                      value={typeof settings.hapticsStrength === 'number' ? settings.hapticsStrength : 100}
                      onChange={(e) => onUpdateSettings({ ...settings, hapticsStrength: Number(e.target.value) })}
                      style={{ flex: 1, accentColor: '#60a5fa' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>
                      {typeof settings.hapticsStrength === 'number' ? settings.hapticsStrength : 100}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Install App (PWA) Option */}
          <div className="settings-section pwa-install-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400 inline" />
                  <span>Install PyPhone App</span>
                </span>
                <span className="settings-label-desc">
                  {isAppInstalled
                    ? 'App is installed on your home screen'
                    : 'Add to home screen for native full-screen app experience'}
                </span>
              </div>
              {isAppInstalled ? (
                <span className="pwa-installed-badge">
                  <Check className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />
                  <span>Installed</span>
                </span>
              ) : (
                <button
                  className="framer-btn-primary install-pwa-btn"
                  onClick={onInstallPwa}
                >
                  <Download className="w-3.5 h-3.5 fill-current" />
                  <span>Install</span>
                </button>
              )}
            </div>
          </div>

          {/* Check for App Updates */}
          <div className="settings-section app-update-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text flex items-center gap-1.5">
                  <RefreshCw className={`w-4 h-4 text-blue-400 inline ${isUpdating ? 'spin' : ''}`} />
                  <span>App Version & Updates</span>
                </span>
                <span className="settings-label-desc">
                  {updateStatus || 'Force check and download the latest update from server'}
                </span>
              </div>
              <button
                className="framer-btn-secondary update-app-btn"
                onClick={handleForceUpdateApp}
                disabled={isUpdating}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'spin' : ''}`} />
                <span>{isUpdating ? 'Updating...' : 'Update App'}</span>
              </button>
            </div>
          </div>

          {/* Clear All Data */}


          <div className="settings-section settings-danger-section">
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Clear All Data</span>
                <span className="settings-label-desc">Remove all saved cells, scripts, and projects from this device</span>
              </div>
              {!showClearConfirm ? (
                <button
                  className="settings-danger-btn"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              ) : (
                <div className="settings-confirm-group">
                  <button
                    className="settings-danger-btn confirm-delete"
                    onClick={handleClearData}
                  >
                    Confirm
                  </button>
                  <button
                    className="settings-cancel-btn"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Credits Footer */}
          <div className="settings-credits">
            <Info className="w-3.5 h-3.5" />
            <span>Made by <strong>Benedict</strong> and <strong>Saidharshan</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
