import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Play, 
  Terminal, 
  Image as ImageIcon, 
  Table, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Undo2,
  Eraser,
  StopCircle,
  Trash2,
  Plus,
  FileCode,
  X,
  Upload,
  Download,
  TerminalSquare
} from 'lucide-react';
import { hapticLight, hapticSuccess } from '../utils/haptics';
import CodeMirror from '@uiw/react-codemirror';
import { undo } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { search, searchKeymap } from '@codemirror/search';
import DataFrameTable from './DataFrameTable';
import { syncWorkspaceFiles, executePythonCode } from '../services/pyodideService';
import { pythonAutocompletions } from '../utils/pythonCompletions';
import { pythonLinterExtension } from '../utils/pythonLinter';

const pyHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--py-keyword)', fontWeight: '600' },
  { tag: tags.string, color: 'var(--py-string)' },
  { tag: tags.comment, color: 'var(--py-comment)', fontStyle: 'italic' },
  { tag: tags.number, color: 'var(--py-number)' },
  { tag: tags.function(tags.name), color: 'var(--py-function)' },
  { tag: tags.definition(tags.name), color: 'var(--py-definition)' },
  { tag: tags.typeName, color: 'var(--py-type)' },
  { tag: tags.operator, color: 'var(--py-operator)' },
  { tag: tags.punctuation, color: 'var(--py-punctuation)' },
  { tag: tags.bracket, color: 'var(--py-bracket)' },
]);

const cmTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', height: 'auto' },
  '.cm-scroller': { minHeight: '200px' },
  // Search panel
  '.cm-search': {
    background: 'var(--surface-1)',
    borderTop: '1px solid var(--hairline)',
    padding: '6px 10px',
    gap: '6px',
    flexWrap: 'wrap',
  },
  '.cm-search input': {
    background: 'var(--canvas)',
    border: '1px solid var(--hairline)',
    borderRadius: '4px',
    color: 'var(--ink)',
    padding: '3px 6px',
    fontSize: '0.8rem',
  },
  '.cm-button': {
    background: 'var(--surface-2)',
    border: '1px solid var(--hairline)',
    borderRadius: '4px',
    color: 'var(--ink)',
    padding: '2px 8px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  '.cm-textfield': {
    background: 'var(--canvas)',
    border: '1px solid var(--hairline)',
    borderRadius: '4px',
    color: 'var(--ink)',
    padding: '3px 6px',
    fontSize: '0.8rem',
  },
  // Autocomplete dropdown
  '.cm-tooltip.cm-tooltip-autocomplete': {
    background: 'var(--surface-1)',
    border: '1px solid var(--hairline)',
    borderRadius: '6px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  '.cm-tooltip-autocomplete > ul > li': {
    padding: '4px 10px',
    fontSize: '0.82rem',
    color: 'var(--ink)',
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    background: 'var(--accent-blue)',
    color: '#fff',
  },
  '.cm-completionLabel': { fontSize: '0.82rem' },
  '.cm-completionDetail': { fontSize: '0.75rem', opacity: '0.7', marginLeft: '6px' },
});

const baseCmExtensions = [
  python(),
  syntaxHighlighting(pyHighlightStyle),
  cmTheme,
  autocompletion({ activateOnTyping: true, override: [pythonAutocompletions] }),
  pythonLinterExtension,
  closeBrackets(),
  search({ top: false }),
];

export default function ScriptView({
  scriptCode,
  setScriptCode,
  scriptOutput,
  isRunning,
  onRunScript,
  onCancelExecution,
  onOpenPlotModal,
  onCodeMirrorReady,
  settings = {}
}) {
  const { fontSize = 15, tabSize = 4, wordWrap = false, showLineNumbers = true } = settings;

  const [activeTab, setActiveTab] = useState('console');
  const [copied, setCopied] = useState(false);
  const [cmView, setCmView] = useState(null);

  // VS Code Multi-File Tabs state
  const [files, setFiles] = useState(() => ({
    'main.py': scriptCode || '# Write full Python script here...\n'
  }));
  const [activeFileName, setActiveFileName] = useState('main.py');
  
  // VS Code Inline Tab Input state
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const newFileInputRef = useRef(null);

  // File Upload Ref
  const fileInputRef = useRef(null);

  // REPL State
  const [replInput, setReplInput] = useState('');
  const [replLogs, setReplLogs] = useState([]);
  const [isEvaluatingRepl, setIsEvaluatingRepl] = useState(false);

  // Focus input when inline file input appears
  useEffect(() => {
    if (isAddingFile && newFileInputRef.current) {
      newFileInputRef.current.focus();
      newFileInputRef.current.select();
    }
  }, [isAddingFile]);

  // Keep main.py synced with parent scriptCode
  useEffect(() => {
    if (files['main.py'] !== scriptCode && scriptCode !== undefined) {
      setFiles(prev => ({ ...prev, 'main.py': scriptCode }));
    }
  }, [scriptCode]);

  const currentFileContent = files[activeFileName] || '';

  const handleCodeChange = (newVal) => {
    setFiles(prev => ({ ...prev, [activeFileName]: newVal }));
    if (activeFileName === 'main.py') {
      setScriptCode(newVal);
    }
  };

  const handleStartAddFile = () => {
    hapticLight();
    let num = 2;
    while (files[`file${num}.py`]) {
      num++;
    }
    setNewFileNameInput(`file${num}.py`);
    setIsAddingFile(true);
  };

  const handleConfirmAddFile = () => {
    let cleanName = newFileNameInput.trim();
    if (!cleanName) {
      setIsAddingFile(false);
      return;
    }
    if (!cleanName.endsWith('.py')) cleanName += '.py';

    if (files[cleanName]) {
      setActiveFileName(cleanName);
      setIsAddingFile(false);
      return;
    }

    const defaultContent = `# Module: ${cleanName}\n\ndef example_function():\n    return "Hello from ${cleanName}"\n`;
    setFiles(prev => ({ ...prev, [cleanName]: defaultContent }));
    setActiveFileName(cleanName);
    setIsAddingFile(false);

    // Sync into Pyodide virtual FS
    syncWorkspaceFiles({ [cleanName]: defaultContent });
  };

  const handleCloseFile = (fileNameToClose, e) => {
    e.stopPropagation();
    hapticLight();
    const fileKeys = Object.keys(files);
    if (fileKeys.length <= 1) return;

    const nextFiles = { ...files };
    delete nextFiles[fileNameToClose];
    setFiles(nextFiles);
    if (activeFileName === fileNameToClose) {
      const remainingKeys = Object.keys(nextFiles);
      setActiveFileName(remainingKeys[0]);
    }
  };

  const handleRunScriptWithSync = useCallback(async () => {
    // Write all open files into Pyodide Virtual FS (/home/pyodide/) before executing
    await syncWorkspaceFiles(files);
    onRunScript();
  }, [files, onRunScript]);

  // File Upload Handler
  const handleUploadFileClick = () => {
    hapticLight();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    const name = uploaded.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setFiles(prev => ({ ...prev, [name]: text }));
      setActiveFileName(name);
      syncWorkspaceFiles({ [name]: text });
      hapticSuccess();
    };
    reader.readAsText(uploaded);
    e.target.value = '';
  };

  // File Download Handler
  const handleDownloadActiveFile = () => {
    hapticLight();
    const blob = new Blob([currentFileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFileName;
    link.click();
    URL.revokeObjectURL(url);
    hapticSuccess();
  };

  // Interactive REPL Line Evaluator
  const handleRunReplCommand = async () => {
    let cmd = replInput.trim();
    if (!cmd || isEvaluatingRepl) return;

    // Auto-strip accidental trailing backslashes from single-line REPL input
    if (cmd.endsWith('\\') && !cmd.endsWith('\\\\')) {
      cmd = cmd.slice(0, -1).trim();
    }

    hapticLight();
    setIsEvaluatingRepl(true);
    setReplInput('');

    try {
      await syncWorkspaceFiles(files);
      const res = await executePythonCode(cmd, files);
      
      // Format concise, clean error message for interactive REPL syntax errors
      let cleanError = res.error;
      if (cleanError && cleanError.includes('SyntaxError')) {
        const errLines = cleanError.split('\n').map(l => l.trim()).filter(Boolean);
        const syntaxErrLine = errLines.find(l => l.startsWith('SyntaxError'));
        cleanError = syntaxErrLine || errLines[errLines.length - 1];
      }

      setReplLogs(prev => [
        ...prev,
        { cmd, stdout: res.stdout, result: res.result, error: cleanError }
      ]);
    } catch (err) {
      setReplLogs(prev => [
        ...prev,
        { cmd, error: err.message }
      ]);
    } finally {
      setIsEvaluatingRepl(false);
    }
  };

  // Build dynamic extensions — including Shift+Enter to run script
  const cmExtensions = useMemo(() => {
    const dynamicTheme = EditorView.theme({
      '&': { backgroundColor: 'transparent', height: 'auto', fontSize: `${fontSize}px` },
      '.cm-scroller': { minHeight: '200px' },
    });

    const runScriptKeymap = keymap.of([
      {
        key: 'Shift-Enter',
        run: () => {
          if (!isRunning) handleRunScriptWithSync();
          return true;
        }
      }
    ]);

    return [
      ...baseCmExtensions,
      dynamicTheme,
      EditorState.tabSize.of(tabSize),
      runScriptKeymap,
      keymap.of([...closeBracketsKeymap, ...completionKeymap, ...searchKeymap]),
      ...(wordWrap ? [EditorView.lineWrapping] : []),
    ];
  }, [fontSize, tabSize, wordWrap, isRunning, handleRunScriptWithSync]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleUndo = () => {
    if (cmView) {
      undo({
        state: cmView.state,
        dispatch: cmView.dispatch
      });
    }
  };

  const handleClear = () => {
    handleCodeChange('');
  };

  const handleClearOutput = () => {
    setActiveTab('console');
  };

  const handleCreate = useCallback((view) => {
    setCmView(view);
    onCodeMirrorReady?.('script', view);
  }, [onCodeMirrorReady]);

  return (
    <div className="script-view-container">
      {/* Hidden File Input for Uploading .py scripts */}
      <input 
        ref={fileInputRef}
        type="file"
        accept=".py,.txt,.ipynb"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* VS Code Multi-File Tab Bar */}
      <div className="vscode-file-tabs-bar">
        <div className="file-tabs-scroll-area">
          {Object.keys(files).map(fileName => (
            <div
              key={fileName}
              className={`vscode-file-tab ${fileName === activeFileName ? 'active' : ''}`}
              onClick={() => { hapticLight(); setActiveFileName(fileName); }}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span className="tab-filename">{fileName}</span>
              {Object.keys(files).length > 1 && (
                <button
                  className="tab-close-btn"
                  onClick={(e) => handleCloseFile(fileName, e)}
                  title={`Close ${fileName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* VS Code Inline New File Input / Button */}
          {isAddingFile ? (
            <div className="inline-new-file-wrapper">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <input
                ref={newFileInputRef}
                type="text"
                className="inline-new-file-input"
                placeholder="file_name.py"
                value={newFileNameInput}
                onChange={(e) => setNewFileNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmAddFile();
                  if (e.key === 'Escape') setIsAddingFile(false);
                }}
              />
              <button 
                className="inline-action-btn check" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleConfirmAddFile}
                title="Create file (Enter)"
              >
                <Check className="w-3.5 h-3.5 text-white" />
              </button>
              <button 
                className="inline-action-btn cancel" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsAddingFile(false)}
                title="Cancel (Esc)"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <button 
              className="new-file-tab-btn" 
              onClick={handleStartAddFile}
              title="Create New Python File (e.g. utils.py)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New File</span>
            </button>
          )}
        </div>

        <span className="keyboard-hint desktop-only">Shift+Enter to run · Ctrl+F to search</span>
      </div>

      {/* PyCharm / VS Code Editor Toolbar */}
      <div className="pycharm-toolbar">
        <div className="file-info">
          <span className="file-name">{activeFileName}</span>
          <span className="file-count-badge">{Object.keys(files).length} files in workspace</span>
        </div>

        <div className="editor-actions">
          <button className="framer-btn-secondary icon-only-btn" onClick={handleUploadFileClick} title="Import .py File">
            <Upload className="w-4 h-4 text-emerald-400" />
          </button>
          <button className="framer-btn-secondary icon-only-btn" onClick={handleDownloadActiveFile} title={`Download ${activeFileName}`}>
            <Download className="w-4 h-4 text-sky-400" />
          </button>
          <button className="framer-btn-secondary icon-only-btn" onClick={() => { hapticLight(); handleUndo(); }} title="Undo">
            <Undo2 className="w-4 h-4 text-slate-400" />
          </button>
          <button className="framer-btn-secondary icon-only-btn" onClick={() => { hapticLight(); handleClear(); }} title={`Clear ${activeFileName}`}>
            <Eraser className="w-4 h-4 text-rose-400" />
          </button>
          <button className="framer-btn-secondary icon-only-btn" onClick={() => { hapticLight(); handleCopyCode(); }} title={`Copy ${activeFileName}`}>
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
          </button>

          {isRunning ? (
            <button
              className="framer-btn-danger"
              onClick={() => { hapticLight(); onCancelExecution?.(); }}
              title="Cancel Execution"
            >
              <StopCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          ) : (
            <button 
              className="framer-btn-primary"
              onClick={handleRunScriptWithSync}
              disabled={isRunning}
              title="Run Script & Sync Files (Shift+Enter)"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Script</span>
            </button>
          )}
        </div>
      </div>

      {/* Script Code Area */}
      <div className="pycharm-editor-wrapper">
        <CodeMirror
          value={currentFileContent}
          onChange={handleCodeChange}
          extensions={cmExtensions}
          onCreateEditor={handleCreate}
          basicSetup={{
            lineNumbers: showLineNumbers,
            foldGutter: false,
            indentOnInput: true,
            highlightActiveLine: true,
            autocompletion: false,
            closeBrackets: false,
            searchKeymap: false,
          }}
          placeholder={`# Write ${activeFileName} Python code here...`}
          className="script-cm-editor"
          theme="none"
        />
      </div>

      {/* PyCharm / VS Code Bottom Terminal / Output Tabs */}
      <div className="pycharm-output-panel">
        <div className="panel-tabs-bar">
          <button 
            className={`panel-tab ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            <Terminal className="w-4 h-4 mr-1.5" />
            <span>Terminal / Logs</span>
            {scriptOutput?.error && <span className="tab-badge error">!</span>}
          </button>

          <button 
            className={`panel-tab ${activeTab === 'repl' ? 'active' : ''}`}
            onClick={() => setActiveTab('repl')}
          >
            <TerminalSquare className="w-4 h-4 mr-1.5 text-emerald-400" />
            <span>REPL (&gt;&gt;&gt;)</span>
          </button>

          <button 
            className={`panel-tab ${activeTab === 'plots' ? 'active' : ''}`}
            onClick={() => setActiveTab('plots')}
          >
            <ImageIcon className="w-4 h-4 mr-1.5" />
            <span>Plots</span>
            {scriptOutput?.plots?.length > 0 && (
              <span className="tab-badge count">{scriptOutput.plots.length}</span>
            )}
          </button>

          {scriptOutput?.dfHtml && (
            <button 
              className={`panel-tab ${activeTab === 'dataframe' ? 'active' : ''}`}
              onClick={() => setActiveTab('dataframe')}
            >
              <Table className="w-4 h-4 mr-1.5" />
              <span>DataFrame</span>
            </button>
          )}

          {/* Clear output button */}
          {scriptOutput && (
            <button
              className="panel-tab panel-tab-clear"
              onClick={handleClearOutput}
              title="Clear output"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="panel-tab-content">
          {activeTab === 'console' && (
            <div className="console-output">
              {!scriptOutput && !isRunning && (
                <p className="console-placeholder">
                  Press <strong className="text-emerald-400">Run Script</strong> or <kbd className="inline-kbd">Shift+Enter</kbd> to execute {activeFileName} and see Python output, stdout prints, logs, or error stack traces.
                </p>
              )}

              {isRunning && (
                <div className="console-running">
                  <Loader2 className="w-4 h-4 spin text-emerald-400 inline mr-2" />
                  <span>Executing {activeFileName} in Python WASM environment...</span>
                </div>
              )}

              {scriptOutput && (
                <>
                  {scriptOutput.error && (
                    <div className="error-box">
                      <div className="error-header">
                        <AlertCircle className="w-4 h-4 text-rose-400 mr-1" />
                        <span>Execution Exception:</span>
                      </div>
                      <pre className="error-text">{scriptOutput.error}</pre>
                    </div>
                  )}

                  {scriptOutput.stdout && (
                    <pre className="stdout-text">{scriptOutput.stdout}</pre>
                  )}

                  {scriptOutput.result && !scriptOutput.isDataFrame && (
                    <div className="eval-result-box">
                      <span className="result-label">Return Value:</span>
                      <pre>{scriptOutput.result}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Interactive Python REPL Tab */}
          {activeTab === 'repl' && (
            <div className="repl-panel-container">
              <div className="repl-history-scroll">
                {replLogs.length === 0 && (
                  <p className="console-placeholder">
                    Interactive Python REPL session ready. Type any line below (e.g. <code className="inline-code">2 + 2</code> or <code className="inline-code">import math; math.sqrt(64)</code>) to evaluate in real-time.
                  </p>
                )}

                {replLogs.map((log, lIdx) => (
                  <div key={lIdx} className="repl-log-item">
                    <div className="repl-log-cmd">
                      <span className="repl-prompt-symbol">&gt;&gt;&gt;</span>
                      <code>{log.cmd}</code>
                    </div>
                    {log.stdout && <pre className="repl-log-stdout">{log.stdout}</pre>}
                    {log.result && <pre className="repl-log-result">{log.result}</pre>}
                    {log.error && <pre className="repl-log-error">{log.error}</pre>}
                  </div>
                ))}
              </div>

              {/* REPL Input Line */}
              <div className="repl-input-bar">
                <span className="repl-prompt-symbol">&gt;&gt;&gt;</span>
                <input
                  type="text"
                  className="repl-input-field"
                  placeholder="Type Python command..."
                  value={replInput}
                  onChange={(e) => setReplInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunReplCommand();
                  }}
                />
                <button 
                  className="repl-send-btn" 
                  onClick={handleRunReplCommand}
                  disabled={isEvaluatingRepl}
                  title="Execute line"
                >
                  {isEvaluatingRepl ? <Loader2 className="w-3.5 h-3.5 spin text-emerald-400" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'plots' && (
            <div className="plots-panel-content">
              {(!scriptOutput?.plots || scriptOutput.plots.length === 0) ? (
                <p className="console-placeholder">
                  No Matplotlib / Seaborn plots generated yet. Use <code className="inline-code">plt.show()</code> in your code!
                </p>
              ) : (
                <div className="script-plots-grid">
                  {scriptOutput.plots.map((plotObj, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="plot-thumbnail-card"
                      onClick={() => onOpenPlotModal(plotObj)}
                    >
                      <div className="plot-click-shield"></div>
                      <div className="plot-thumb-overlay">
                        <ImageIcon className="w-5 h-5 text-emerald-400" />
                        <span>Tap to Interact / Zoom</span>
                      </div>
                      {plotObj && plotObj.type === 'html' ? (
                        <iframe 
                          srcDoc={`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"><style>body{margin:0;padding:0;background:white;}</style></head><body>${plotObj.data}</body></html>`} 
                          title={`Plot ${pIdx}`}
                          className="plot-thumb-iframe"
                          sandbox="allow-scripts"
                          scrolling="no"
                        />
                      ) : (
                        <img 
                          src={`data:image/png;base64,${plotObj?.data || plotObj}`} 
                          alt={`Generated Python Chart ${pIdx + 1}`} 
                          className="plot-thumb-img"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'dataframe' && scriptOutput?.dfHtml && (
            <DataFrameTable htmlContent={scriptOutput.dfHtml} />
          )}
        </div>
      </div>
    </div>
  );
}
