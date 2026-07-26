import React, { useState } from 'react';
import { Type, Eye, Edit2, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';

export default function MarkdownCell({
  cell,
  index,
  totalCells,
  onUpdateCode,
  onDeleteCell,
  onMoveCell,
  onDuplicateCell,
  activeCellId,
  setActiveCellId
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div 
      className={`notebook-cell markdown-cell ${activeCellId === cell.id ? 'active-cell' : ''}`}
      onClick={() => setActiveCellId(cell.id)}
    >
      <div className="cell-header">
        <div className="cell-execution-badge">
          <Type className="w-3.5 h-3.5 text-blue-400" />
          <span className="cell-label">Markdown [{index + 1}]:</span>
        </div>

        <div className="cell-actions">
          <button
            className="cell-act-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preview</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </>
            )}
          </button>

          <button
            className="cell-act-btn icon-only"
            onClick={(e) => {
              e.stopPropagation();
              onMoveCell(cell.id, 'up');
            }}
            disabled={index === 0}
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
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            className="cell-act-btn icon-only"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateCell(cell.id);
            }}
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
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="cell-editor-container">
        {isEditing ? (
          <textarea
            id={`cell-textarea-${cell.id}`}
            className="code-cell-textarea markdown-input"
            value={cell.code}
            onChange={(e) => onUpdateCode(cell.id, e.target.value)}
            placeholder="# Enter Markdown text / Heading / Homework notes here..."
            rows={Math.max(3, cell.code.split('\n').length)}
            onFocus={() => setActiveCellId(cell.id)}
            spellCheck={true}
          />
        ) : (
          <div 
            className="markdown-rendered-view"
            onClick={() => setIsEditing(true)}
          >
            {cell.code.trim() ? (
              <div className="md-content">
                {cell.code.split('\n').map((line, lIdx) => {
                  if (line.startsWith('### ')) return <h3 key={lIdx}>{line.slice(4)}</h3>;
                  if (line.startsWith('## ')) return <h2 key={lIdx}>{line.slice(3)}</h2>;
                  if (line.startsWith('# ')) return <h1 key={lIdx}>{line.slice(2)}</h1>;
                  if (line.startsWith('- ')) return <li key={lIdx}>{line.slice(2)}</li>;
                  if (line.startsWith('**') && line.endsWith('**')) return <strong key={lIdx}>{line.slice(2, -2)}</strong>;
                  if (line === '') return <br key={lIdx} />;
                  return <p key={lIdx}>{line}</p>;
                })}

              </div>
            ) : (
              <p className="md-placeholder">Double-tap to write Markdown title / assignment notes...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
