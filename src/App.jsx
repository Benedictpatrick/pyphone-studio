import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import NotebookView from './components/NotebookView';
import ScriptView from './components/ScriptView';
import MobileKeyboardToolbar from './components/MobileKeyboardToolbar';
import PlotModal from './components/PlotModal';
import DatasetLoaderModal from './components/DatasetLoaderModal';
import TemplatePickerModal from './components/TemplatePickerModal';
import VariableExplorer from './components/VariableExplorer';
import CheatSheetModal from './components/CheatSheetModal';
import SavedProjectsModal from './components/SavedProjectsModal';
import SettingsModal from './components/SettingsModal';

import { hapticLight, hapticMedium, hapticSuccess, hapticError } from './utils/haptics';

import { initPyodide, executePythonCode, getActiveVariables } from './services/pyodideService';
import { PYTHON_TEMPLATES } from './templates/pythonTemplates';
import { exportToHtmlReport } from './services/htmlExportService';
import { 
  saveNotebookState, 
  loadNotebookState, 
  saveScriptState, 
  loadScriptState, 
  saveLastMode, 
  loadLastMode,
  getSavedProjects,
  saveProject,
  renameProject,
  deleteProject
} from './services/storageService';

export default function App() {
  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pyphone_theme') || 'dark';
  });

  // App mode & status
  const [mode, setMode] = useState(loadLastMode() || 'notebook'); // 'notebook' | 'script'
  const [engineStatus, setEngineStatus] = useState({ status: 'idle', message: 'Initializing Python Engine...' });
  const [activeCellId, setActiveCellId] = useState('cell-1');
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // CodeMirror view registry for programmatic text insertion
  const cmViews = useRef({});
  const handleCodeMirrorReady = useCallback((id, view) => {
    cmViews.current[id] = view;
  }, []);

  // Saved Projects state
  const [savedProjects, setSavedProjects] = useState(() => getSavedProjects());
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  // Saved or initial Notebook State
  const [cells, setCells] = useState(() => {
    const saved = loadNotebookState();
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: 'cell-1',
        type: 'code',
        code: '# Write your Python code here...\n',
        executionCount: null,
        status: 'idle',
        output: null
      }
    ];
  });

  // Saved or initial Script View state
  const [scriptCode, setScriptCode] = useState(() => {
    return loadScriptState() || '# Write your Python code here...\n';
  });
  const [scriptOutput, setScriptOutput] = useState(null);
  const [isScriptRunning, setIsScriptRunning] = useState(false);

  // Variable Explorer state
  const [activeVariables, setActiveVariables] = useState([]);
  const [isVarExplorerOpen, setIsVarExplorerOpen] = useState(false);

  // Modals state
  const [selectedPlotB64, setSelectedPlotB64] = useState(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Editor settings (persisted to localStorage)
  const [editorSettings, setEditorSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pyphone_editor_settings');
      return saved ? JSON.parse(saved) : { fontSize: 15, tabSize: 4, wordWrap: true, autoSave: true, showLineNumbers: true };
    } catch {
      return { fontSize: 15, tabSize: 4, wordWrap: true, autoSave: true, showLineNumbers: true };
    }
  });

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert('To install PyPhone Studio:\n\n• On iOS (Safari): Tap the Share button at the bottom, then select "Add to Home Screen".\n• On Android/Chrome: Tap menu (⋮) and select "Install app" or "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };


  // Sync theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pyphone_theme', theme);
  }, [theme]);

  // Toggle Theme helper
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Editor settings helper
  const handleUpdateSettings = (newSettings) => {
    setEditorSettings(newSettings);
    localStorage.setItem('pyphone_editor_settings', JSON.stringify(newSettings));
  };

  // Initialize Pyodide WASM runtime on app load with retry support
  const handleRetryEngine = useCallback((force = false) => {
    initPyodide((progress) => {
      setEngineStatus(progress);
    }, force).catch((err) => {
      setEngineStatus({
        status: 'error',
        message: err.message || 'Failed to initialize Python WASM engine. Tap to retry.'
      });
    });
  }, []);

  useEffect(() => {
    handleRetryEngine(false);
  }, [handleRetryEngine]);


  // Auto-save notebook & script state
  useEffect(() => {
    if (editorSettings.autoSave) saveNotebookState(cells);
  }, [cells, editorSettings.autoSave]);

  useEffect(() => {
    if (editorSettings.autoSave) saveScriptState(scriptCode);
  }, [scriptCode, editorSettings.autoSave]);

  useEffect(() => {
    if (editorSettings.autoSave) saveLastMode(mode);
  }, [mode, editorSettings.autoSave]);

  // Refresh Python variables helper
  const handleRefreshVariables = async () => {
    try {
      const vars = await getActiveVariables();
      setActiveVariables(vars);
    } catch {}
  };

  // Keyboard text insertion helper (CodeMirror API)
  const handleInsertText = (textToInsert) => {
    const targetCell = mode === 'notebook'
      ? cells.find((cell) => cell.id === activeCellId && cell.type === 'code')
        || cells.find((cell) => cell.type === 'code')
      : null;
    const viewKey = targetCell ? targetCell.id : 'script';
    const view = cmViews.current[viewKey];
    if (!view) {
      if (mode === 'script') {
        setScriptCode((currentCode) => `${currentCode}${textToInsert}`);
      } else if (targetCell) {
        setCells((previousCells) => previousCells.map((cell) =>
          cell.id === targetCell.id ? { ...cell, code: `${cell.code}${textToInsert}` } : cell
        ));
        setActiveCellId(targetCell.id);
      }
      return;
    }

    view.focus();
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: textToInsert },
      selection: { anchor: from + textToInsert.length }
    });
  };

  // Run Notebook Cell
  const handleRunCell = async (cellId) => {
    const cellToRun = cells.find((c) => c.id === cellId);
    if (!cellToRun || cellToRun.type !== 'code') return;

    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, status: 'running', output: null } : c))
    );
    hapticMedium();

    try {
      const result = await executePythonCode(cellToRun.code);

      setCells((prev) =>
        prev.map((c) => {
          if (c.id !== cellId) return c;
          return {
            ...c,
            status: result.error ? 'error' : 'idle',
            executionCount: (c.executionCount || 0) + 1,
            output: {
              stdout: result.stdout,
              error: result.error,
              plots: result.plots || [],
              dfHtml: result.dfHtml || null
            }
          };
        })
      );

      handleRefreshVariables();
      if (result.error) {
        hapticError();
      } else {
        hapticSuccess();
      }
    } catch (err) {
      setCells((prev) =>
        prev.map((c) => (c.id === cellId ? { ...c, status: 'error', output: { error: err.message } } : c))
      );
      hapticError();
    }
  };

  // Run All Cells
  const handleRunAll = async () => {
    hapticMedium();
    if (mode === 'script') {
      await handleRunScript();
      return;
    }

    for (const cell of cells) {
      if (cell.type === 'code') {
        await handleRunCell(cell.id);
      }
    }
  };

  // Run Script Mode Code
  const handleRunScript = async () => {
    setIsScriptRunning(true);
    setScriptOutput(null);
    hapticMedium();

    try {
      const result = await executePythonCode(scriptCode);

      setScriptOutput({
        stdout: result.stdout,
        error: result.error,
        plots: result.plots || [],
        result: result.result || null,
        isDataFrame: result.isDataFrame || false,
        dfHtml: result.dfHtml || null
      });
      if (result.error) {
        hapticError();
      } else {
        hapticSuccess();
      }
    } catch (err) {
      setScriptOutput({ error: err.message });
      hapticError();
    } finally {
      setIsScriptRunning(false);
      handleRefreshVariables();
    }
  };

  // Add / Delete / Move Cells
  const handleAddCell = (type = 'code') => {
    hapticSelection();
    const newId = `cell-${Date.now()}`;
    const newCell = {
      id: newId,
      type,
      code: type === 'code' ? '# Write your Python code here\n' : '# Header Title\nNote details...',
      executionCount: null,
      status: 'idle',
      output: null
    };

    setCells((prev) => [...prev, newCell]);
    setActiveCellId(newId);
  };

  const handleDeleteCell = (id) => {
    if (cells.length <= 1) return;
    const idx = cells.findIndex((c) => c.id === id);
    // Compute fallback id NOW from current cells (before setCells mutates state)
    const fallbackId = idx > 0 ? cells[idx - 1].id : cells[idx + 1].id;
    setCells((prev) => prev.filter((c) => c.id !== id));
    setActiveCellId((prev) => (prev !== id ? prev : fallbackId));
  };


  const handleMoveCell = (id, direction) => {
    const index = cells.findIndex((c) => c.id === id);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === cells.length - 1) return;

    const newCells = [...cells];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const temp = newCells[index];
    newCells[index] = newCells[targetIndex];
    newCells[targetIndex] = temp;

    setCells(newCells);
  };

  const handleDuplicateCell = (id) => {
    const idx = cells.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const original = cells[idx];
    const newId = `cell-${Date.now()}`;
    const duplicate = { ...original, id: newId, status: 'idle', output: null };
    setCells((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, duplicate);
      return next;
    });
    setActiveCellId(newId);
  };

  // Export handlers
  const handleExportPy = () => {
    let fullPy = '# Generated by PyPhone Studio\n\n';
    if (mode === 'notebook') {
      cells.forEach((c, idx) => {
        if (c.type === 'markdown') {
          fullPy += `# Cell ${idx + 1} (Markdown):\n# ${c.code.replace(/\n/g, '\n# ')}\n\n`;
        } else {
          fullPy += `# Cell ${idx + 1} (Code):\n${c.code}\n\n`;
        }
      });
    } else {
      fullPy += scriptCode;
    }

    const blob = new Blob([fullPy], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pyphone_script_${Date.now()}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportIpynb = () => {
    const notebookJson = {
      cells: (mode === 'notebook' ? cells : [{ id: 'cell-1', type: 'code', code: scriptCode }]).map((c) => ({
        cell_type: c.type === 'markdown' ? 'markdown' : 'code',
        execution_count: c.executionCount || null,
        metadata: {},
        outputs: [],
        source: c.code.split('\n').map((line, i, arr) => (i < arr.length - 1 ? line + '\n' : line))
      })),
      metadata: {
        language_info: { name: 'python', version: '3.11' }
      },
      nbformat: 4,
      nbformat_minor: 2
    };

    const blob = new Blob([JSON.stringify(notebookJson, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pyphone_notebook_${Date.now()}.ipynb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportHtmlReport = () => {
    exportToHtmlReport({
      mode,
      cells,
      scriptCode,
      scriptOutput
    });
  };

  // Multi-Project Handlers
  const handleSaveCurrentProject = (title) => {
    const updated = saveProject({
      id: currentProjectId,
      title,
      type: mode,
      code: scriptCode,
      cells: cells
    });
    // Capture the id from the newly saved project
    const saved = updated.find((p) => p.title === title);
    if (saved) setCurrentProjectId(saved.id);
    setSavedProjects(updated);
  };

  const handleLoadProject = (project) => {
    setCurrentProjectId(project.id);
    if (project.type === 'script') {
      setMode('script');
      if (project.code) setScriptCode(project.code);
    } else if (project.type === 'notebook') {
      setMode('notebook');
      if (project.cells && project.cells.length > 0) {
        setCells(project.cells);
        setActiveCellId(project.cells[0].id);
      }
    }
  };

  const handleRenameProject = (id, newTitle) => {
    const updated = renameProject(id, newTitle);
    setSavedProjects(updated);
  };

  const handleDeleteProject = (id) => {
    const updated = deleteProject(id);
    setSavedProjects(updated);
  };

  const handleExportProject = (project) => {
    let content = '';
    let ext = 'py';
    if (project.type === 'script') {
      content = project.code || '';
      ext = 'py';
    } else {
      content = JSON.stringify({
        cells: (project.cells || []).map(c => ({ cell_type: c.type, source: [c.code] })),
        nbformat: 4
      }, null, 2);
      ext = 'ipynb';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/[^a-z0-9_-]/gi, '_')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-canvas-container" data-mode={mode}>
      {/* Header */}
      <Header
        mode={mode}
        setMode={setMode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        engineStatus={engineStatus}
        onRunAll={handleRunAll}
        onRetryEngine={() => handleRetryEngine(true)}
        onOpenProjects={() => setIsProjectsModalOpen(true)}

        savedProjectsCount={savedProjects.length}
        onOpenDatasets={() => setIsDatasetModalOpen(true)}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenVariables={() => setIsVarExplorerOpen(true)}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddCell={handleAddCell}
        onExportPy={handleExportPy}
        onExportIpynb={handleExportIpynb}
        onExportHtmlReport={handleExportHtmlReport}
      />

      {/* Main Workspace: Notebook vs Script View */}
      <main className="main-workspace">
        {mode === 'notebook' ? (
          <NotebookView
            cells={cells}
            activeCellId={activeCellId}
            setActiveCellId={setActiveCellId}
            onRunCell={handleRunCell}
            onAddCell={handleAddCell}
            onDeleteCell={handleDeleteCell}
            onMoveCell={handleMoveCell}
            onDuplicateCell={handleDuplicateCell}
            onUpdateCode={(id, code) =>
              setCells((prev) => prev.map((c) => (c.id === id ? { ...c, code } : c)))
            }
            onOpenPlotModal={(b64) => setSelectedPlotB64(b64)}
            onCodeMirrorReady={handleCodeMirrorReady}
            settings={editorSettings}
          />
        ) : (
          <ScriptView
            scriptCode={scriptCode}
            setScriptCode={setScriptCode}
            scriptOutput={scriptOutput}
            isRunning={isScriptRunning}
            onRunScript={handleRunScript}
            onOpenPlotModal={(b64) => setSelectedPlotB64(b64)}
            onCodeMirrorReady={handleCodeMirrorReady}
            settings={editorSettings}
          />
        )}
      </main>
       <TemplatePickerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={(code) => {
          if (mode === 'notebook') {
            const newId = `cell-${Date.now()}`;
            setCells((prev) => [
              ...prev,
              {
                id: newId,
                type: 'code',
                code,
                executionCount: null,
                status: 'idle',
                output: null
              }
            ]);
            setActiveCellId(newId);
          } else {
            setScriptCode(code);
          }
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={editorSettings}
        onUpdateSettings={handleUpdateSettings}
        onInstallPwa={handleInstallPwa}
        isAppInstalled={isAppInstalled}
        canInstallPwa={!!deferredPrompt}
      />

      <SavedProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={savedProjects}
        onSaveCurrent={handleSaveCurrentProject}
        onLoadProject={handleLoadProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        activeMode={mode}
        onExportProject={handleExportProject}
      />

      <DatasetLoaderModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        onInsertCodeSnippet={handleInsertText}
      />

      <VariableExplorer
        isOpen={isVarExplorerOpen}
        onClose={() => setIsVarExplorerOpen(false)}
        variables={activeVariables}
        onRefresh={handleRefreshVariables}
      />

      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        onInsertSnippet={handleInsertText}
      />

      <PlotModal
        plotBase64={selectedPlotB64}
        onClose={() => setSelectedPlotB64(null)}
      />

      {!(isTemplateModalOpen || isSettingsOpen || isProjectsModalOpen || isDatasetModalOpen || isVarExplorerOpen || isCheatSheetOpen || selectedPlotB64) && (
        <MobileKeyboardToolbar
          onInsertText={handleInsertText}
          onRunCurrent={() => mode === 'script' ? handleRunScript() : handleRunCell(activeCellId)}
          isRunning={mode === 'script'
            ? isScriptRunning
            : cells.some((cell) => cell.id === activeCellId && cell.status === 'running')}
        />
      )}

    </div>
  );
}
