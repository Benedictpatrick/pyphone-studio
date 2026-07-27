import React, { useState, useCallback, useMemo } from 'react';
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
  Trash2
} from 'lucide-react';
import { hapticLight } from '../utils/haptics';
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
  autocompletion({ activateOnTyping: true }),
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
          if (!isRunning) onRunScript();
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
  }, [fontSize, tabSize, wordWrap, isRunning, onRunScript]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
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
    if (window.confirm("Are you sure you want to clear the entire script?")) {
      setScriptCode('');
    }
  };

  const handleClearOutput = () => {
    // Signals the parent to reset scriptOutput — handled via re-run or explicit handler
    // For now we scroll to top of console tab
    setActiveTab('console');
  };

  const handleCreate = useCallback((view) => {
    setCmView(view);
    onCodeMirrorReady?.('script', view);
  }, [onCodeMirrorReady]);

  return (
    <div className="script-view-container">
      {/* PyCharm Editor Toolbar */}
      <div className="pycharm-toolbar">
        <div className="file-info">
          <span className="file-name">main.py</span>
          <span className="keyboard-hint">Shift+Enter to run · Ctrl+F to search</span>
        </div>

        <div className="editor-actions">
          <button className="framer-btn-secondary icon-only-btn" onClick={() => { hapticLight(); handleUndo(); }} title="Undo">
            <Undo2 className="w-4 h-4 text-slate-400" />
          </button>
          <button className="framer-btn-secondary icon-only-btn" onClick={() => { hapticLight(); handleClear(); }} title="Clear Script">
            <Eraser className="w-4 h-4 text-rose-400" />
          </button>
          <button className="framer-btn-secondary icon-only-btn" onClick={() => { hapticLight(); handleCopyCode(); }} title="Copy Python Script">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
          </button>

          {isRunning ? (
            /* Cancel button replaces Run while running */
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
              onClick={onRunScript}
              disabled={isRunning}
              title="Run Script (Shift+Enter)"
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
          value={scriptCode}
          onChange={(val) => setScriptCode(val)}
          extensions={cmExtensions}
          onCreateEditor={handleCreate}
          basicSetup={{
            lineNumbers: showLineNumbers,
            foldGutter: false,
            indentOnInput: true,
            highlightActiveLine: true,
            autocompletion: false,   // We add it manually above for full control
            closeBrackets: false,    // We add it manually above
            searchKeymap: false,     // We add it manually above
          }}
          placeholder="# Write full Python script here..."
          className="script-cm-editor"
          theme="none"
        />
      </div>

      {/* PyCharm Bottom Terminal / Output Tabs */}
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
                  Press <strong className="text-emerald-400">Run Script</strong> or <kbd className="inline-kbd">Shift+Enter</kbd> to see Python output, stdout prints, logs, or error stack traces.
                </p>
              )}

              {isRunning && (
                <div className="console-running">
                  <Loader2 className="w-4 h-4 spin text-emerald-400 inline mr-2" />
                  <span>Executing main.py in Python WebAssembly environment...</span>
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
