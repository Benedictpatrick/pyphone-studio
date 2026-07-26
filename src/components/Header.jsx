import React, { useState } from 'react';
import { 
  Play, 
  BookOpen, 
  Code2, 
  Database, 
  FileCode, 
  Download, 
  Plus, 
  Layers,
  FileText,
  Sun,
  Moon,
  FolderCode
} from 'lucide-react';
import PyPhoneStudioLogo from './PyPhoneStudioLogo';

export default function Header({
  mode,
  setMode,
  theme,
  onToggleTheme,
  engineStatus,
  onRunAll,
  onOpenProjects,
  savedProjectsCount = 0,
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
        <PyPhoneStudioLogo />
        <button 
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-blue-400" />
          )}
        </button>
      </div>

      {/* Continuous Touch Action Ribbon */}
      <div className="framer-action-ribbon">
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

        <span 
          className={`engine-status-dot ${engineStatus.status === 'ready' ? 'dot-ready' : engineStatus.status === 'error' ? 'dot-error' : 'dot-loading'}`}
          title={engineStatus.status === 'ready' ? 'Python 3.11 WASM Ready' : engineStatus.status === 'error' ? 'Engine Error' : engineStatus.message || 'Loading WASM...'}
        ></span>

        {/* My Projects Button */}
        <button 
          className="framer-btn-secondary projects-ribbon-btn" 
          onClick={onOpenProjects}
          title="My Saved Programs & Projects"
        >
          <FolderCode className="w-3.5 h-3.5 text-blue-400" />
          <span>Projects</span>
          {savedProjectsCount > 0 && (
            <span className="ribbon-count-pill">{savedProjectsCount}</span>
          )}
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
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span>Templates</span>
        </button>

        {/* Export Dropdown */}
        <div className="export-btn-wrapper flex-shrink-0">
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
    </header>
  );
}
