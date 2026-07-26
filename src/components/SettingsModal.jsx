import React, { useState } from 'react';
import { Settings, X, Trash2, Info } from 'lucide-react';

const FONT_SIZES = [12, 14, 16, 18];

export default function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

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
