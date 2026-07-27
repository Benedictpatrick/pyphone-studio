import React, { useState, useCallback, useMemo } from 'react';
import { 
  Play, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon,
  MoreVertical,
  Undo2,
  Eraser,
  StopCircle
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { undo } from '@codemirror/commands';
import { hapticLight } from '../utils/haptics';
import { python } from '@codemirror/lang-python';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { search, searchKeymap } from '@codemirror/search';
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
  // Search panel styling
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
  // Autocomplete dropdown styling
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
  onCancelExecution,
  activeCellId,
  setActiveCellId,
  onCodeMirrorReady,
  settings = {}
}) {
  const { fontSize = 15, tabSize = 4, wordWrap = false } = settings;
  const isRunning = cell.status === 'running';
  const { showLineNumbers = true } = settings;

  const [cmView, setCmView] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Build dynamic extensions — including Shift+Enter to run cell
  const cmExtensions = useMemo(() => {
    const dynamicTheme = EditorView.theme({
      '&': { backgroundColor: 'transparent', height: 'auto', fontSize: `${fontSize}px` },
      '.cm-line': { padding: '0' },
    });

    const runCellKeymap = keymap.of([
      {
        key: 'Shift-Enter',
        run: () => {
          onRunCell(cell.id);
          return true;
        }
      }
    ]);

    return [
      ...baseCmExtensions,
      dynamicTheme,
      EditorState.tabSize.of(tabSize),
      runCellKeymap,
      keymap.of([...closeBracketsKeymap, ...completionKeymap, ...searchKeymap]),
      ...(wordWrap ? [EditorView.lineWrapping] : []),
    ];
  }, [fontSize, tabSize, wordWrap, cell.id, onRunCell]);

  const handleCreate = useCallback((view) => {
    setCmView(view);
    onCodeMirrorReady?.(cell.id, view);
  }, [cell.id, onCodeMirrorReady]);

  const handleUndo = useCallback((e) => {
    e.stopPropagation();
    if (cmView) {
      undo({
        state: cmView.state,
        dispatch: cmView.dispatch
      });
    }
  }, [cmView]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to clear this cell's code?")) {
      onUpdateCode(cell.id, '');
    }
  }, [cell.id, onUpdateCode]);

  return (
    <div 
      className={`notebook-cell ${activeCellId === cell.id ? 'active-cell' : ''}`}
      onClick={() => setActiveCellId(cell.id)}
    >
      {/* Cell Header Controls */}
      <div className="cell-header">
        <div className="cell-execution-badge">
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 spin text-amber-400 mr-2" />
          ) : null}
          <span className="cell-label">In [{cell.executionCount !== null ? cell.executionCount : ' '}]:</span>
        </div>

        <div className="cell-actions">
          {isRunning ? (
            /* Cancel button — shown while cell is running */
            <button
              className="cell-act-btn cancel-cell-btn"
              onClick={(e) => {
                e.stopPropagation();
                hapticLight();
                onCancelExecution?.();
              }}
              title="Cancel Execution (Ctrl+C)"
            >
              <StopCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              className="cell-act-btn run-cell-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRunCell(cell.id);
              }}
              disabled={isRunning}
              title="Execute Cell (Shift+Enter)"
            >
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span>Run</span>
            </button>
          )}

          <button
            className="cell-act-btn icon-only"
            onClick={(e) => {
              hapticLight();
              handleUndo(e);
            }}
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            className="cell-act-btn icon-only"
            onClick={(e) => {
              hapticLight();
              handleClear(e);
            }}
            title="Clear Code"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="cell-act-btn icon-only"
              onClick={(e) => {
                e.stopPropagation();
                hapticLight();
                setShowMenu(!showMenu);
              }}
              title="More Actions"
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </button>
            
            {showMenu && (
              <div className="cell-dropdown-menu">
                <button
                  className="cell-dropdown-btn"
                  onClick={(e) => { e.stopPropagation(); hapticLight(); onMoveCell(cell.id, 'up'); setShowMenu(false); }}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Move Up
                </button>
                <button
                  className="cell-dropdown-btn"
                  onClick={(e) => { e.stopPropagation(); hapticLight(); onMoveCell(cell.id, 'down'); setShowMenu(false); }}
                  disabled={index === totalCells - 1}
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Move Down
                </button>
                <button
                  className="cell-dropdown-btn"
                  onClick={(e) => { e.stopPropagation(); hapticLight(); onDuplicateCell(cell.id); setShowMenu(false); }}
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
                {totalCells > 1 && (
                  <button
                    className="cell-dropdown-btn delete-btn"
                    onClick={(e) => { e.stopPropagation(); hapticLight(); onDeleteCell(cell.id); setShowMenu(false); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
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
            autocompletion: false,   // We add it manually above for full control
            closeBrackets: false,    // We add it manually above
            searchKeymap: false,     // We add it manually above
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
              <span className="run-hint"> (Shift+Enter to re-run · Cancel above to stop)</span>
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
                  {cell.output.plots.map((plotObj, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="plot-thumbnail-card"
                      onClick={() => onOpenPlotModal(plotObj)}
                    >
                      <div className="plot-thumb-overlay">
                        <ImageIcon className="w-5 h-5 text-emerald-400" />
                        <span>Tap to Interact / Zoom</span>
                      </div>
                      {plotObj && plotObj.type === 'html' ? (
                        <iframe 
                          srcDoc={plotObj.data} 
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
        </div>
      )}
    </div>
  );
}
