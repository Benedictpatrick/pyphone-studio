import React, { useState } from 'react';
import { 
  Play, 
  BookOpen, 
  Code2, 
  Database, 
  FileCode, 
  Download, 
  Loader2, 
  Plus, 
  Sparkles,
  Layers,
  FileText,
  CheckCircle,
  Terminal,
  Sun,
  Moon
} from 'lucide-react';

export default function Header({
  mode,
  setMode,
  theme,
  onToggleTheme,
  engineStatus,
  onRunAll,
  onOpenDatasets,
  onOpenTemplates,
  onOpenVariables,
  onOpenCheatSheet,
  onAddCell,
  onExportPy,
  onExportIpynb,
  onExportHtmlReport
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="framer-header">
      <div className="header-top">
        <div className="brand-container">
          <div className="logo-icon-framer">
            <Terminal className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="brand-title-framer">
              PyPhone <span className="brand-badge-framer">Studio</span>
            </h1>
            <p className="brand-subtitle-framer">Mobile Python Data Science Canvas</p>
          </div>
        </div>

        {/* Engine Status & Auto-Save */}
        <div className="status-badges">
          <div className="framer-badge-saved">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400 mr-1" />
            <span>Saved</span>
          </div>

          <div className={`framer-engine-pill ${engineStatus.status}`}>
            {engineStatus.status === 'ready' ? (
              <>
                <span className="blue-status-dot"></span>
                <span className="engine-text">Python 3.11 WASM</span>
              </>
            ) : engineStatus.status === 'error' ? (
              <>
                <span className="red-status-dot"></span>
                <span className="engine-text">Engine Error</span>
              </>
            ) : (
              <>
                <Loader2 className="w-3.5 h-3.5 spin text-blue-400" />
                <span className="engine-text">{engineStatus.message || 'Loading WASM...'}</span>
              </>
            )}
          </div>

          {/* Theme Switcher Button */}
          <button 
            className="framer-btn-secondary theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="header-controls">
        {/* Mode Switcher */}
        <div className="framer-mode-toggle">
          <button
            className={`framer-mode-btn ${mode === 'notebook' ? 'active' : ''}`}
            onClick={() => setMode('notebook')}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notebook</span>
          </button>
          <button
            className={`framer-mode-btn ${mode === 'script' ? 'active' : ''}`}
            onClick={() => setMode('script')}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Script</span>
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="action-buttons-group">
          <button 
            className="framer-btn-primary" 
            onClick={onRunAll}
            disabled={engineStatus.status !== 'ready'}
            title="Execute All Code"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run All</span>
          </button>

          {mode === 'notebook' && (
            <button 
              className="framer-btn-secondary" 
              onClick={() => onAddCell('code')}
              title="Add Code Cell"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cell</span>
            </button>
          )}

          <button 
            className="framer-btn-secondary" 
            onClick={onOpenVariables}
            title="Variable Explorer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Variables</span>
          </button>

          <button 
            className="framer-btn-secondary" 
            onClick={onOpenDatasets}
            title="Preloaded CSV Datasets"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Data</span>
          </button>

          <button 
            className="framer-btn-secondary" 
            onClick={onOpenCheatSheet}
            title="Data Science Cheat Sheet"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Cheat Sheet</span>
          </button>

          <button 
            className="framer-btn-secondary" 
            onClick={onOpenTemplates}
            title="Starter Python Code Examples"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Templates</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button 
              className="framer-btn-secondary icon-only-btn" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export File"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="framer-export-dropdown">
                <button onClick={() => { onExportHtmlReport(); setShowExportMenu(false); }}>
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Export HTML Report</span>
                </button>
                <button onClick={() => { onExportPy(); setShowExportMenu(false); }}>
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span>Download .py Script</span>
                </button>
                <button onClick={() => { onExportIpynb(); setShowExportMenu(false); }}>
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Download .ipynb Notebook</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
