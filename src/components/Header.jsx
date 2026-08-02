import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  BookOpen, 
  Code2, 
  Database, 
  FileCode, 
  Download, 
  Plus, 
  Package,
  Variable,
  FileText,
  Sun,
  Moon,
  FolderCode,
  Settings,
  Bot
} from 'lucide-react';
import PyPhoneStudioLogo from './PyPhoneStudioLogo';
import { hapticLight } from '../utils/haptics';

export default function Header({
  mode,
  setMode,
  theme,
  onToggleTheme,
  engineStatus,
  onRunAll,
  onRetryEngine,
  onOpenProjects,

  savedProjectsCount = 0,
  onOpenDatasets,
  onOpenTemplates,
  onOpenVariables,
  onOpenCheatSheet,
  onOpenSettings,
  onOpenPackages,
  onOpenAICopilot,
  onAddCell,
  onExportPy,
  onExportIpynb,
  onExportHtmlReport
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [showExportMenu]);

  return (
    <header className="framer-header">
      <div className="header-top">
        <PyPhoneStudioLogo />

        <div className="header-top-actions">
          <button 
            className="theme-toggle-btn ai-header-btn"
            onClick={() => { hapticLight(); onOpenAICopilot?.(); }}
            title="Local AI Assistant"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button 
            className="theme-toggle-btn"
            onClick={() => { hapticLight(); onToggleTheme(); }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 tb-icon" />
            ) : (
              <Moon className="w-3.5 h-3.5 tb-icon" />
            )}
          </button>
          <button 
            className="theme-toggle-btn"
            onClick={() => { hapticLight(); onOpenSettings(); }}
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 tb-icon" />
          </button>

          {/* Export Dropdown */}
          <div className="export-btn-wrapper flex-shrink-0" ref={exportRef}>
            <button 
              className="theme-toggle-btn" 
              onClick={() => { hapticLight(); setShowExportMenu(!showExportMenu); }}
              title="Export File"
            >
              <Download className="w-3.5 h-3.5 tb-icon" />
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

      {/* Continuous Touch Action Ribbon */}
      <div className="framer-action-ribbon">
        {/* Mode Switcher */}
        <div className="framer-mode-toggle">
          <button
            className={`framer-mode-btn ${mode === 'notebook' ? 'active' : ''}`}
            onClick={() => { hapticLight(); setMode('notebook'); }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notebook</span>
          </button>
          <button
            className={`framer-mode-btn ${mode === 'script' ? 'active' : ''}`}
            onClick={() => { hapticLight(); setMode('script'); }}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Script</span>
          </button>
        </div>

        {/* Primary Action Button */}
        <button 
          className="framer-btn-primary" 
          onClick={onRunAll}
          disabled={engineStatus.status !== 'ready'}
          title="Execute All Code"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run All</span>
        </button>

        <button
          className="engine-status-dot-btn"
          onClick={() => {
            hapticLight();
            if (engineStatus.status === 'error') {
              onRetryEngine?.();
            }
          }}
          title={
            engineStatus.status === 'ready'
              ? 'Python 3.11 WASM Ready'
              : engineStatus.status === 'error'
              ? `${engineStatus.message || 'Engine Error'}. Tap to retry.`
              : engineStatus.message || 'Loading WASM...'
          }
        >
          <span
            className={`engine-status-dot ${
              engineStatus.status === 'ready'
                ? 'dot-ready'
                : engineStatus.status === 'error'
                ? 'dot-error'
                : 'dot-loading'
            }`}
          ></span>
          {engineStatus.status === 'error' && <span className="retry-label">Retry</span>}
        </button>


        {/* My Projects Button */}
        <button 
          className="framer-btn-secondary projects-ribbon-btn" 
          onClick={() => { hapticLight(); onOpenProjects(); }}
          title="My Saved Programs & Projects"
        >
          <FolderCode className="w-3.5 h-3.5 text-blue-400" />
          <span>Projects</span>
          {savedProjectsCount > 0 && (
            <span className="ribbon-count-pill">{savedProjectsCount}</span>
          )}
        </button>

        {/* AI Assistant Button */}
        <button 
          className="framer-btn-secondary ai-copilot-ribbon-btn" 
          onClick={() => { hapticLight(); onOpenAICopilot?.(); }}
          title="Local AI Coding Assistant"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI Assistant</span>
          <span className="ribbon-ai-pill">Local</span>
        </button>

        {/* Packages Button */}
        <button 
          className="framer-btn-secondary" 
          onClick={() => { hapticLight(); onOpenPackages(); }}
          title="Install Python Packages (PIP)"
        >
          <Package className="w-3.5 h-3.5 text-orange-400" />
          <span>Packages</span>
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
          <Variable className="w-3.5 h-3.5 text-blue-400" />
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
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span>Templates</span>
        </button>
      </div>
    </header>
  );
}
