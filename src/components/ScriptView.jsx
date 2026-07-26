import React, { useState, useCallback, useMemo } from 'react';
import { 
  Play, 
  Terminal, 
  Image as ImageIcon, 
  Table, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
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
});

const baseCmExtensions = [python(), syntaxHighlighting(pyHighlightStyle), cmTheme];

export default function ScriptView({
  scriptCode,
  setScriptCode,
  scriptOutput,
  isRunning,
  onRunScript,
  onOpenPlotModal,
  onCodeMirrorReady,
  settings = {}
}) {
  const { fontSize = 15, tabSize = 4, wordWrap = false, showLineNumbers = true } = settings;

  const cmExtensions = useMemo(() => {
    const dynamicTheme = EditorView.theme({
      '&': { backgroundColor: 'transparent', height: 'auto', fontSize: `${fontSize}px` },
      '.cm-scroller': { minHeight: '200px' },
    });
    return [...baseCmExtensions, dynamicTheme, EditorState.tabSize.of(tabSize), ...(wordWrap ? [EditorView.lineWrapping] : [])];
  }, [fontSize, tabSize, wordWrap]);
  const [activeTab, setActiveTab] = useState('console');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCreate = useCallback((view) => {
    onCodeMirrorReady?.('script', view);
  }, [onCodeMirrorReady]);

  return (
    <div className="script-view-container">
      {/* PyCharm Editor Toolbar */}
      <div className="pycharm-toolbar">
        <div className="file-info">
          <span className="file-name">main.py</span>
          <span className="file-tag">PyCharm Mode</span>
        </div>

        <div className="editor-actions">
          <button className="framer-btn-secondary icon-only-btn" onClick={handleCopyCode} title="Copy Python Script">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
          </button>
          <button 
            className="framer-btn-primary"
            onClick={onRunScript}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Script</span>
              </>
            )}
          </button>
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
            autocompletion: false
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
        </div>

        {/* Tab Content */}
        <div className="panel-tab-content">
          {activeTab === 'console' && (
            <div className="console-output">
              {!scriptOutput && !isRunning && (
                <p className="console-placeholder">
                  Press <strong className="text-emerald-400">Run Script</strong> above to see Python output, stdout prints, logs, or error stack traces.
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
                  {scriptOutput.plots.map((plotB64, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="plot-thumbnail-card"
                      onClick={() => onOpenPlotModal(plotB64)}
                    >
                      <img 
                        src={`data:image/png;base64,${plotB64}`} 
                        alt="Python Matplotlib Chart" 
                        className="plot-thumb-img"
                      />
                      <div className="plot-thumb-overlay">
                        <span>Tap to Zoom / Download</span>
                      </div>
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
