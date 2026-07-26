import React, { useCallback, useMemo } from 'react';
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
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import DataFrameTable from './DataFrameTable';
import ErrorExplainerBox from './ErrorExplainerBox';

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
  '.cm-line': { padding: '0' },
});

const baseCmExtensions = [python(), syntaxHighlighting(pyHighlightStyle), cmTheme];

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
  setActiveCellId,
  onCodeMirrorReady,
  settings = {}
}) {
  const { fontSize = 15, tabSize = 4, wordWrap = false } = settings;

  const cmExtensions = useMemo(() => {
    const dynamicTheme = EditorView.theme({
      '&': { backgroundColor: 'transparent', height: 'auto', fontSize: `${fontSize}px` },
      '.cm-line': { padding: '0' },
    });
    return [...baseCmExtensions, dynamicTheme, EditorState.tabSize.of(tabSize), ...(wordWrap ? [EditorView.lineWrapping] : [])];
  }, [fontSize, tabSize, wordWrap]);
  const isRunning = cell.status === 'running';
  const { showLineNumbers = true } = settings;

  const handleCreate = useCallback((view) => {
    onCodeMirrorReady?.(cell.id, view);
  }, [cell.id, onCodeMirrorReady]);

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

      {/* Editor */}
      <div className="cell-editor-container">
        <CodeMirror
          value={cell.code}
          onChange={(val) => onUpdateCode(cell.id, val)}
          extensions={cmExtensions}
          onCreateEditor={handleCreate}
          basicSetup={{
            lineNumbers: showLineNumbers,
            foldGutter: false,
            indentOnInput: true,
            highlightActiveLine: false,
            autocompletion: false
          }}
          placeholder="# Type Python code here (e.g. import pandas as pd...)"
          className="code-cell-cm"
          theme="none"
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
