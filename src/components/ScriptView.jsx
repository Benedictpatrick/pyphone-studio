import React, { useState } from 'react';
import { 
  Play, 
  Terminal, 
  Image as ImageIcon, 
  Table, 
  RotateCcw, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import DataFrameTable from './DataFrameTable';

export default function ScriptView({
  scriptCode,
  setScriptCode,
  scriptOutput,
  isRunning,
  onRunScript,
  onOpenPlotModal
}) {
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'plots' | 'dataframe'
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lineCount = Math.max(15, scriptCode.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

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
        <div className="line-numbers-gutter">
          {lineNumbers.map(n => (
            <div key={n} className="line-num">{n}</div>
          ))}
        </div>
        <textarea
          id="pycharm-script-textarea"
          className="script-textarea"
          value={scriptCode}
          onChange={(e) => setScriptCode(e.target.value)}
          placeholder="# Write full Python script here..."
          rows={lineCount}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
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
