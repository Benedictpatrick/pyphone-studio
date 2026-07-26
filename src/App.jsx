import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import NotebookView from './components/NotebookView';
import ScriptView from './components/ScriptView';
import MobileKeyboardToolbar from './components/MobileKeyboardToolbar';
import PlotModal from './components/PlotModal';
import DatasetLoaderModal from './components/DatasetLoaderModal';
import TemplatePickerModal from './components/TemplatePickerModal';
import VariableExplorer from './components/VariableExplorer';
import CheatSheetModal from './components/CheatSheetModal';

import { initPyodide, executePythonCode, getActiveVariables } from './services/pyodideService';
import { PYTHON_TEMPLATES } from './templates/pythonTemplates';
import { exportToHtmlReport } from './services/htmlExportService';
import { 
  saveNotebookState, 
  loadNotebookState, 
  saveScriptState, 
  loadScriptState, 
  saveLastMode, 
  loadLastMode 
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

  // Saved or initial Notebook State
  const [cells, setCells] = useState(() => {
    const saved = loadNotebookState();
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: 'cell-1',
        type: 'markdown',
        code: '# Data Analysis Assignment\nDouble-tap to edit header notes...',
        executionCount: null,
        status: 'idle',
        output: null
      },
      {
        id: 'cell-2',
        type: 'code',
        code: PYTHON_TEMPLATES[0].code,
        executionCount: null,
        status: 'idle',
        output: null
      }
    ];
  });

  // Saved or initial Script View state
  const [scriptCode, setScriptCode] = useState(() => {
    return loadScriptState() || PYTHON_TEMPLATES[1].code;
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

  // Sync theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pyphone_theme', theme);
  }, [theme]);

  // Toggle Theme helper
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initialize Pyodide WASM runtime on app load
  useEffect(() => {
    initPyodide((progress) => {
      setEngineStatus(progress);
    }).catch((err) => {
      setEngineStatus({ status: 'error', message: err.message || 'Failed to initialize Python WASM engine.' });
    });
  }, []);

  // Auto-save notebook & script state
  useEffect(() => {
    saveNotebookState(cells);
  }, [cells]);

  useEffect(() => {
    saveScriptState(scriptCode);
  }, [scriptCode]);

  useEffect(() => {
    saveLastMode(mode);
  }, [mode]);

  // Refresh Python variables helper
  const handleRefreshVariables = async () => {
    const vars = await getActiveVariables();
    setActiveVariables(vars);
  };

  // Keyboard text insertion helper
  const handleInsertText = (textToInsert) => {
    if (mode === 'notebook') {
      if (!activeCellId) return;
      setCells((prev) =>
        prev.map((cell) => {
          if (cell.id !== activeCellId) return cell;

          const textarea = document.getElementById(`cell-textarea-${cell.id}`);
          if (!textarea) return { ...cell, code: cell.code + textToInsert };

          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newCode = cell.code.substring(0, start) + textToInsert + cell.code.substring(end);

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
          }, 50);

          return { ...cell, code: newCode };
        })
      );
    } else {
      const textarea = document.getElementById('pycharm-script-textarea');
      if (!textarea) {
        setScriptCode((prev) => prev + textToInsert);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = scriptCode.substring(0, start) + textToInsert + scriptCode.substring(end);

      setScriptCode(newCode);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }, 50);
    }
  };

  // Run individual Notebook Cell
  const handleRunCell = async (cellId) => {
    const targetCell = cells.find((c) => c.id === cellId);
    if (!targetCell || targetCell.type === 'markdown') return;

    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, status: 'running', output: null } : c))
    );

    try {
      const result = await executePythonCode(targetCell.code);

      setCells((prev) =>
        prev.map((c) => {
          if (c.id !== cellId) return c;
          const nextExecCount = (c.executionCount || 0) + 1;
          return {
            ...c,
            status: result.error ? 'error' : 'completed',
            executionCount: nextExecCount,
            output: result
          };
        })
      );
      // Auto-update variables
      handleRefreshVariables();
    } catch (err) {
      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId
            ? { ...c, status: 'error', output: { error: err.message || String(err) } }
            : c
        )
      );
    }
  };

  // Run all cells sequentially
  const handleRunAll = async () => {
    if (mode === 'notebook') {
      for (const cell of cells) {
        if (cell.type !== 'markdown') {
          await handleRunCell(cell.id);
        }
      }
    } else {
      await handleRunScript();
    }
  };

  // Run PyCharm Script View
  const handleRunScript = async () => {
    setIsScriptRunning(true);
    setScriptOutput(null);

    try {
      const result = await executePythonCode(scriptCode);
      setScriptOutput(result);
      handleRefreshVariables();
    } catch (err) {
      setScriptOutput({ error: err.message || String(err) });
    } finally {
      setIsScriptRunning(false);
    }
  };

  // Cell Management
  const handleAddCell = (type = 'code') => {
    const newId = `cell-${Date.now()}`;
    const newCell = {
      id: newId,
      type,
      code: type === 'markdown' ? '## Assignment Section Title' : '# Write Python code here\n',
      executionCount: null,
      status: 'idle',
      output: null
    };
    setCells((prev) => [...prev, newCell]);
    setActiveCellId(newId);
  };

  const handleDeleteCell = (id) => {
    if (cells.length <= 1) return;
    setCells((prev) => prev.filter((c) => c.id !== id));
  };

  const handleMoveCell = (id, direction) => {
    const idx = cells.findIndex((c) => c.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === cells.length - 1) return;

    const newCells = [...cells];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const [moved] = newCells.splice(idx, 1);
    newCells.splice(targetIdx, 0, moved);

    setCells(newCells);
  };

  const handleDuplicateCell = (id) => {
    const idx = cells.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const original = cells[idx];
    const duplicate = {
      ...original,
      id: `cell-${Date.now()}`,
      executionCount: null,
      output: null
    };
    const newCells = [...cells];
    newCells.splice(idx + 1, 0, duplicate);
    setCells(newCells);
  };

  const handleUpdateCellCode = (id, newCode) => {
    setCells((prev) =>
      prev.map((c) => (c.id === id ? { ...c, code: newCode } : c))
    );
  };

  // Export handlers
  const handleExportPy = () => {
    let fullScript = '';
    if (mode === 'notebook') {
      fullScript = cells
        .filter((c) => c.type !== 'markdown')
        .map((c, i) => `# Cell ${i + 1}\n${c.code}\n`)
        .join('\n');
    } else {
      fullScript = scriptCode;
    }
    const blob = new Blob([fullScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pyphone_script_${Date.now()}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportIpynb = () => {
    const ipynbData = {
      cells: cells.map((c) => ({
        cell_type: c.type || 'code',
        execution_count: c.type === 'markdown' ? null : c.executionCount,
        metadata: {},
        outputs: [],
        source: c.code.split('\n').map((line) => line + '\n')
      })),
      metadata: {
        language_info: { name: 'python', version: '3.11' }
      },
      nbformat: 4,
      nbformat_minor: 2
    };

    const blob = new Blob([JSON.stringify(ipynbData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pyphone_notebook_${Date.now()}.ipynb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHtmlReport = () => {
    exportToHtmlReport({
      title: "Python Data Analysis Report",
      cells,
      scriptCode,
      scriptOutput,
      mode
    });
  };

  return (
    <div className="app-layout" data-theme={theme}>
      {/* Top Header */}
      <Header
        mode={mode}
        setMode={setMode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        engineStatus={engineStatus}
        onRunAll={handleRunAll}
        onOpenDatasets={() => setIsDatasetModalOpen(true)}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenVariables={async () => {
          await handleRefreshVariables();
          setIsVarExplorerOpen(true);
        }}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onAddCell={handleAddCell}
        onExportPy={handleExportPy}
        onExportIpynb={handleExportIpynb}
        onExportHtmlReport={handleExportHtmlReport}
      />

      {/* Main Workspace Area */}
      <main className="main-content">
        {mode === 'notebook' ? (
          <NotebookView
            cells={cells}
            onUpdateCode={handleUpdateCellCode}
            onRunCell={handleRunCell}
            onAddCell={handleAddCell}
            onDeleteCell={handleDeleteCell}
            onMoveCell={handleMoveCell}
            onDuplicateCell={handleDuplicateCell}
            onOpenPlotModal={(b64) => setSelectedPlotB64(b64)}
            activeCellId={activeCellId}
            setActiveCellId={setActiveCellId}
          />
        ) : (
          <ScriptView
            scriptCode={scriptCode}
            setScriptCode={setScriptCode}
            scriptOutput={scriptOutput}
            isRunning={isScriptRunning}
            onRunScript={handleRunScript}
            onOpenPlotModal={(b64) => setSelectedPlotB64(b64)}
          />
        )}
      </main>

      {/* Mobile Keyboard Touch Quick-Keys Toolbar */}
      <MobileKeyboardToolbar
        onInsertText={handleInsertText}
        onRunCurrent={() => {
          if (mode === 'notebook') {
            if (activeCellId) handleRunCell(activeCellId);
          } else {
            handleRunScript();
          }
        }}
        isRunning={isScriptRunning || cells.some((c) => c.status === 'running')}
      />

      {/* Modals & Inspectors */}
      {selectedPlotB64 && (
        <PlotModal
          plotBase64={selectedPlotB64}
          onClose={() => setSelectedPlotB64(null)}
        />
      )}

      <VariableExplorer
        isOpen={isVarExplorerOpen}
        onClose={() => setIsVarExplorerOpen(false)}
        variables={activeVariables}
        onRefresh={handleRefreshVariables}
      />

      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        onInsertSnippet={(snippet) => handleInsertText(snippet)}
      />

      <DatasetLoaderModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        onInsertCodeSnippet={(snippet) => handleInsertText('\n' + snippet + '\n')}
      />

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
    </div>
  );
}
