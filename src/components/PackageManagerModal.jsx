import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Search, 
  Package, 
  Check, 
  Loader2, 
  AlertCircle, 
  Library, 
  Terminal, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Copy, 
  Settings2
} from 'lucide-react';
import { installPyodidePackage, listInstalledPyodidePackages, uninstallPyodidePackage } from '../services/pyodideService';
import { hapticLight, hapticMedium, hapticError, hapticSuccess } from '../utils/haptics';

const POPULAR_PACKAGES_CATALOG = [
  // ML & AI
  { name: 'scikit-learn', category: 'ML & AI', desc: 'Classification, Regression, Clustering & ML Models', importExample: 'import sklearn' },
  { name: 'statsmodels', category: 'ML & AI', desc: 'Statistical modeling, hypothesis tests & econometrics', importExample: 'import statsmodels.api as sm' },
  { name: 'xgboost', category: 'ML & AI', desc: 'Extreme Gradient Boosting decision trees', importExample: 'import xgboost as xgb' },
  { name: 'lightgbm', category: 'ML & AI', desc: 'Fast gradient boosting framework for tree algorithms', importExample: 'import lightgbm as lgb' },
  
  // Data Visualization & Imaging
  { name: 'seaborn', category: 'Visualization', desc: 'Statistical data visualization, heatmaps & pair plots', importExample: 'import seaborn as sns' },
  { name: 'bokeh', category: 'Visualization', desc: 'Interactive HTML plot visualizations in browser', importExample: 'import bokeh' },
  { name: 'pillow', category: 'Visualization', desc: 'Image processing library (PIL wrapper)', importExample: 'from PIL import Image' },
  { name: 'wordcloud', category: 'Visualization', desc: 'Generate word cloud visual images from text', importExample: 'from wordcloud import WordCloud' },

  // Math & Science
  { name: 'scipy', category: 'Math & Science', desc: 'Scientific computing, optimization & linear algebra', importExample: 'import scipy' },
  { name: 'sympy', category: 'Math & Science', desc: 'Symbolic mathematics, calculus & equations solver', importExample: 'import sympy as sp' },
  { name: 'networkx', category: 'Math & Science', desc: 'Graph theory algorithms & network analysis', importExample: 'import networkx as nx' },
  { name: 'mpmath', category: 'Math & Science', desc: 'Arbitrary-precision floating-point arithmetic', importExample: 'import mpmath' },

  // Data Tools & NLP
  { name: 'polars', category: 'Data Tools', desc: 'Ultra-fast Rust-powered DataFrames library', importExample: 'import polars as pl' },
  { name: 'nltk', category: 'Data Tools', desc: 'Natural Language Toolkit for text processing & NLP', importExample: 'import nltk' },
  { name: 'tqdm', category: 'Data Tools', desc: 'Fast progress bars for loops and iteration', importExample: 'from tqdm import tqdm' },
  { name: 'pytz', category: 'Data Tools', desc: 'World timezone definitions for datetime handling', importExample: 'import pytz' },

  // Web & APIs
  { name: 'requests', category: 'Web & APIs', desc: 'HTTP requests library for fetching web data', importExample: 'import requests' },
  { name: 'beautifulsoup4', category: 'Web & APIs', desc: 'HTML & XML parsing for web scraping', importExample: 'from bs4 import BeautifulSoup' },
  { name: 'httpx', category: 'Web & APIs', desc: 'Modern async HTTP client for Python 3', importExample: 'import httpx' },
];

const PREINSTALLED_PACKAGES = [
  { name: 'numpy', desc: 'Multi-dimensional arrays & matrices', importExample: 'import numpy as np' },
  { name: 'pandas', desc: 'DataFrames & data manipulation', importExample: 'import pandas as pd' },
  { name: 'matplotlib', desc: 'Plots & visualizations (Agg backend)', importExample: 'import matplotlib.pyplot as plt' },
  { name: 'seaborn', desc: 'Statistical graphs & heatmaps', importExample: 'import seaborn as sns' },
  { name: 'micropip', desc: 'PyPI package manager for WASM', importExample: 'import micropip' },
];

const CATEGORIES = ['All', 'ML & AI', 'Visualization', 'Math & Science', 'Data Tools', 'Web & APIs'];

export default function PackageManagerModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'manage' | 'built-in'
  const [isInstalling, setIsInstalling] = useState(false);
  const [installingPkgName, setInstallingPkgName] = useState('');
  const [installedDict, setInstalledDict] = useState({}); // { pkgName: version }
  const [copiedPkg, setCopiedPkg] = useState(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const autocompleteRef = useRef(null);

  // Sync installed packages list from Pyodide when modal opens or after installs/uninstalls
  const refreshInstalledPackages = async () => {
    try {
      const dict = await listInstalledPyodidePackages();
      setInstalledDict(dict || {});
    } catch (err) {
      console.warn('Could not refresh installed packages:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshInstalledPackages();
    } else {
      setQuery('');
      setLogs([]);
      setError(null);
      setSuccessMsg(null);
      setIsInstalling(false);
      setInstallingPkgName('');
      setShowLogsDrawer(false);
      setShowAutocomplete(false);
    }
  }, [isOpen]);

  // Click outside listener for autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter catalog based on active category & search query
  const filteredCatalog = useMemo(() => {
    return POPULAR_PACKAGES_CATALOG.filter(pkg => {
      const matchesCategory = selectedCategory === 'All' || pkg.category === selectedCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || 
        pkg.name.toLowerCase().includes(q) || 
        pkg.desc.toLowerCase().includes(q) || 
        pkg.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, query]);

  // Search Autocomplete suggestions (top matching packages as user types)
  const autocompleteSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return POPULAR_PACKAGES_CATALOG.filter(pkg => 
      pkg.name.toLowerCase().includes(q) || pkg.desc.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query]);

  if (!isOpen) return null;

  const handleInstall = async (pkgName) => {
    const cleanName = pkgName.trim().toLowerCase();
    if (!cleanName) return;
    
    hapticMedium();
    setIsInstalling(true);
    setInstallingPkgName(cleanName);
    setError(null);
    setSuccessMsg(null);
    setShowAutocomplete(false);
    setShowLogsDrawer(true);
    setLogs([{ type: 'info', msg: `[PIP] Initiating download & installation for '${cleanName}'...` }]);
    
    try {
      await installPyodidePackage(cleanName, (log) => {
        setLogs(prev => [...prev, { type: 'log', msg: log }]);
      });
      
      await refreshInstalledPackages();
      setSuccessMsg(`Successfully installed '${cleanName}'! You can now import it in your code.`);
      setLogs(prev => [...prev, { type: 'success', msg: `✓ '${cleanName}' is ready to import.` }]);
      hapticSuccess();
      setQuery('');
    } catch (err) {
      setError(err.message || `Failed to install '${cleanName}'. Make sure it is a pure Python package on PyPI.`);
      setLogs(prev => [...prev, { type: 'error', msg: `❌ Installation failed: ${err.message}` }]);
      hapticError();
    } finally {
      setIsInstalling(false);
      setInstallingPkgName('');
    }
  };

  const handleUninstall = async (pkgName) => {
    if (!window.confirm(`Are you sure you want to remove '${pkgName}' from your current Python session?`)) return;
    hapticMedium();
    try {
      await uninstallPyodidePackage(pkgName);
      await refreshInstalledPackages();
      setSuccessMsg(`Uninstalled '${pkgName}' from Python session.`);
      hapticSuccess();
    } catch (err) {
      setError(`Failed to uninstall ${pkgName}`);
    }
  };

  const handleCopyImport = (snippet, pkgName) => {
    navigator.clipboard.writeText(snippet);
    setCopiedPkg(pkgName);
    hapticLight();
    setTimeout(() => setCopiedPkg(null), 1800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card packages-modal enhanced-packages-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <Package className="w-5 h-5 text-orange-400" />
              <span>Python PIP Package Manager</span>
            </div>
            <button className="modal-close-btn" onClick={() => { hapticLight(); onClose(); }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Top Navigation Tabs */}
          <div className="pkg-tabs-row">
            <button 
              className={`pkg-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => { hapticLight(); setActiveTab('catalog'); }}
            >
              <Library className="w-3.5 h-3.5 text-blue-400" />
              <span>PyPI Catalog</span>
            </button>

            <button 
              className={`pkg-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => { hapticLight(); setActiveTab('manage'); refreshInstalledPackages(); }}
            >
              <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Manage Installed ({Object.keys(installedDict).length})</span>
            </button>

            <button 
              className={`pkg-tab-btn ${activeTab === 'built-in' ? 'active' : ''}`}
              onClick={() => { hapticLight(); setActiveTab('built-in'); }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Core Built-in ({PREINSTALLED_PACKAGES.length})</span>
            </button>
          </div>

          {activeTab === 'catalog' && (
            <>
              {/* Search & Autocomplete Input Container */}
              <div className="search-box-wrapper" ref={autocompleteRef}>
                <div className="search-box">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Search catalog or type PyPI package name..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowAutocomplete(true);
                    }}
                    onFocus={() => setShowAutocomplete(true)}
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
                    {isInstalling && installingPkgName === query.trim().toLowerCase() ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      'Install'
                    )}
                  </button>
                </div>

                {/* Live Autocomplete Suggestions Dropdown */}
                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {autocompleteSuggestions.map(item => (
                      <div 
                        key={item.name}
                        className="autocomplete-item"
                        onClick={() => {
                          setQuery(item.name);
                          setShowAutocomplete(false);
                          handleInstall(item.name);
                        }}
                      >
                        <div className="ac-title">
                          <span className="ac-name">{item.name}</span>
                          <span className="ac-cat">{item.category}</span>
                        </div>
                        <span className="ac-desc">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="categories-pills-bar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => { hapticLight(); setSelectedCategory(cat); }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Banners */}
              {error && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="success-banner">
                  <Check size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Catalog Grid */}
              <div className="catalog-grid-container">
                {filteredCatalog.length === 0 ? (
                  <div className="no-pkg-found">
                    <Package size={28} className="text-slate-500 mb-2" />
                    <p>No package matching "<strong>{query}</strong>" in local catalog.</p>
                    <button 
                      className="custom-pip-install-btn"
                      onClick={() => handleInstall(query)}
                      disabled={isInstalling || !query.trim()}
                    >
                      Try Custom PyPI Install for "{query}"
                    </button>
                  </div>
                ) : (
                  filteredCatalog.map(pkg => {
                    const cleanName = pkg.name.toLowerCase();
                    const isPkgInstalled = Boolean(installedDict[cleanName]) || PREINSTALLED_PACKAGES.some(p => p.name === cleanName);
                    const isCurrentlyInstallingThis = isInstalling && installingPkgName === cleanName;

                    return (
                      <div key={pkg.name} className={`pkg-card ${isPkgInstalled ? 'installed' : ''}`}>
                        <div className="pkg-card-header">
                          <div className="pkg-card-title">
                            <span className="pkg-name">{pkg.name}</span>
                            <span className="pkg-cat-tag">{pkg.category}</span>
                          </div>
                          
                          {isPkgInstalled ? (
                            <span className="installed-badge">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Installed</span>
                            </span>
                          ) : (
                            <button
                              className="pkg-install-chip"
                              onClick={() => handleInstall(pkg.name)}
                              disabled={isInstalling}
                              title={`Install ${pkg.name} via PIP`}
                            >
                              {isCurrentlyInstallingThis ? (
                                <>
                                  <Loader2 className="w-3 h-3 spinner text-amber-400" />
                                  <span>Installing...</span>
                                </>
                              ) : (
                                <>
                                  <span>+ Install</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        
                        <p className="pkg-card-desc">{pkg.desc}</p>
                        
                        <div className="pkg-card-footer">
                          <code className="pkg-import-snippet">{pkg.importExample}</code>
                          <button 
                            className="copy-import-btn"
                            onClick={() => handleCopyImport(pkg.importExample, pkg.name)}
                            title="Copy import statement"
                          >
                            {copiedPkg === pkg.name ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* Manage Installed PIP Packages Tab */}
          {activeTab === 'manage' && (
            <div className="manage-packages-container">
              <div className="manage-header-info">
                <p className="manage-desc">
                  Active PIP packages downloaded & loaded into Python memory during your current workspace session:
                </p>
                <button 
                  className="refresh-btn"
                  onClick={refreshInstalledPackages}
                  title="Refresh list"
                >
                  Refresh List
                </button>
              </div>

              {Object.keys(installedDict).length === 0 ? (
                <div className="empty-manage-state">
                  <Package className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-slate-400 text-sm">No custom PIP packages installed in this session yet.</p>
                  <button 
                    className="custom-pip-install-btn mt-2"
                    onClick={() => setActiveTab('catalog')}
                  >
                    Browse PyPI Catalog
                  </button>
                </div>
              ) : (
                <div className="installed-list-grid">
                  {Object.entries(installedDict).map(([pkgName, version]) => {
                    const catalogMatch = POPULAR_PACKAGES_CATALOG.find(p => p.name.toLowerCase() === pkgName.toLowerCase());
                    const importSnippet = catalogMatch ? catalogMatch.importExample : `import ${pkgName}`;

                    return (
                      <div key={pkgName} className="installed-item-card">
                        <div className="installed-item-left">
                          <div className="installed-item-title">
                            <span className="installed-pkg-name">{pkgName}</span>
                            <span className="version-pill">v{version || 'latest'}</span>
                          </div>
                          <p className="installed-pkg-desc">
                            {catalogMatch?.desc || 'Installed pure-Python PyPI package.'}
                          </p>
                          <code className="pkg-import-snippet">{importSnippet}</code>
                        </div>

                        <div className="installed-item-actions">
                          <button 
                            className="icon-action-btn copy-btn"
                            onClick={() => handleCopyImport(importSnippet, pkgName)}
                            title="Copy import statement"
                          >
                            {copiedPkg === pkgName ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                          
                          <button 
                            className="icon-action-btn delete-btn"
                            onClick={() => handleUninstall(pkgName)}
                            title={`Remove ${pkgName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Built-in Engine Core Tab */}
          {activeTab === 'built-in' && (
            <div className="preinstalled-list-container">
              <p className="preinstalled-intro">
                These core data science & visualization packages are pre-compiled in WebAssembly and permanently available:
              </p>
              
              <div className="preinstalled-grid">
                {PREINSTALLED_PACKAGES.map(pkg => (
                  <div key={pkg.name} className="preinstalled-card">
                    <div className="preinstalled-head">
                      <span className="pkg-name text-emerald-400">{pkg.name}</span>
                      <span className="preinstalled-badge">Core Engine ✓</span>
                    </div>
                    <p className="pkg-desc">{pkg.desc}</p>
                    <code className="pkg-import-snippet">{pkg.importExample}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PIP Console Output Drawer Toggle */}
          {logs.length > 0 && (
            <div className="logs-drawer-wrapper">
              <button 
                className="logs-drawer-toggle"
                onClick={() => setShowLogsDrawer(!showLogsDrawer)}
              >
                <div className="toggle-left">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>PIP Terminal Logs ({logs.length})</span>
                </div>
                {showLogsDrawer ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              {showLogsDrawer && (
                <div className="packages-log-window">
                  {logs.map((l, i) => (
                    <div key={i} className={`log-line log-${l.type}`}>
                      {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
