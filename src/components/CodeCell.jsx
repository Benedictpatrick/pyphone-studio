import React from 'react';
import { 
  Play, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon
} from 'lucide-react';
import DataFrameTable from './DataFrameTable';
import ErrorExplainerBox from './ErrorExplainerBox';

export default function CodeCell({
  cell,
  index,
  totalCells,
  onUpdateCode,
  onRunCell,
  onDeleteCell,
  onMoveCell,
  onDuplicateCell,
  onOpenPlotModal,
  activeCellId,
  setActiveCellId
}) {
  const isRunning = cell.status === 'running';

  return (
    <div 
      className={`notebook-cell ${activeCellId === cell.id ? 'active-cell' : ''}`}
      onClick={() => setActiveCellId(cell.id)}
    >
      {/* Cell Header Controls */}
      <div className="cell-header">
        <div className="cell-execution-badge">
          {isRunning ? (
            <span className="execution-counter running">
              <Loader2 className="w-3.5 h-3.5 spin text-amber-400" />
            </span>
          ) : cell.executionCount !== null ? (
            <span className="execution-counter completed">[{cell.executionCount}]</span>
          ) : (
            <span className="execution-counter idle">[ ]</span>
          )}
          <span className="cell-label">In [{index + 1}]:</span>
        </div>

        <div className="cell-actions">
          <button
            className="cell-act-btn run-cell-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRunCell(cell.id);
            }}
            disabled={isRunning}
            title="Execute Cell (Run)"
          >
            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
            <span>Run</span>
          </button>

          <button
            className="cell-act-btn icon-only"
            onClick={(e) => {
              e.stopPropagation();
              onMoveCell(cell.id, 'up');
            }}
            disabled={index === 0}
            title="Move Cell Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <button
            className="cell-act-btn icon-only"
            onClick={(e) => {
              e.stopPropagation();
              onMoveCell(cell.id, 'down');
            }}
            disabled={index === totalCells - 1}
            title="Move Cell Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            className="cell-act-btn icon-only"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateCell(cell.id);
            }}
            title="Duplicate Cell"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {totalCells > 1 && (
            <button
              className="cell-act-btn icon-only delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCell(cell.id);
              }}
              title="Delete Cell"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="cell-editor-container">
        <textarea
          id={`cell-textarea-${cell.id}`}
          className="code-cell-textarea"
          value={cell.code}
          onChange={(e) => onUpdateCode(cell.id, e.target.value)}
          placeholder="# Type Python code here (e.g. import pandas as pd...)"
          rows={Math.max(4, cell.code.split('\n').length)}
          onFocus={() => setActiveCellId(cell.id)}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      {/* Output Section */}
      {(cell.output || cell.status === 'running') && (
        <div className="cell-output-wrapper">
          <div className="output-label">Out [{cell.executionCount || '*'}]</div>

          {/* Running Spinner */}
          {isRunning && (
            <div className="cell-running-bar">
              <Loader2 className="w-4 h-4 spin text-emerald-400 mr-2 inline" />
              <span>Executing Python code in WebAssembly Pyodide...</span>
            </div>
          )}

          {cell.output && (
            <div className="cell-output-content">
              {/* Error Box & Explainer */}
              {cell.output.error && (
                <>
                  <div className="output-box error-box">
                    <div className="error-header">
                      <AlertCircle className="w-4 h-4 text-rose-400 mr-1.5" />
                      <span>Python Traceback / Exception</span>
                    </div>
                    <pre className="error-text">{cell.output.error}</pre>
                  </div>
                  <ErrorExplainerBox errorText={cell.output.error} />
                </>
              )}

              {/* Standard Output Text */}
              {cell.output.stdout && (
                <div className="output-box stdout-box">
                  <pre className="stdout-text">{cell.output.stdout}</pre>
                </div>
              )}

              {/* DataFrame HTML Output */}
              {cell.output.dfHtml && (
                <DataFrameTable htmlContent={cell.output.dfHtml} />
              )}

              {/* Matplotlib / Seaborn Generated Plots */}
              {cell.output.plots && cell.output.plots.length > 0 && (
                <div className="cell-plots-gallery">
                  {cell.output.plots.map((plotB64, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="plot-thumbnail-card"
                      onClick={() => onOpenPlotModal(plotB64)}
                    >
                      <div className="plot-thumb-overlay">
                        <ImageIcon className="w-5 h-5 text-emerald-400" />
                        <span>Tap to Zoom / Download</span>
                      </div>
                      <img 
                        src={`data:image/png;base64,${plotB64}`} 
                        alt={`Generated Python Chart ${pIdx + 1}`} 
                        className="plot-thumb-img"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
