import React from 'react';
import CodeCell from './CodeCell';
import MarkdownCell from './MarkdownCell';
import { Type, Code } from 'lucide-react';

export default function NotebookView({
  cells,
  onUpdateCode,
  onRunCell,
  onAddCell,
  onDeleteCell,
  onMoveCell,
  onDuplicateCell,
  onOpenPlotModal,
  activeCellId,
  setActiveCellId,
  onCodeMirrorReady
}) {
  return (
    <div className="notebook-view-container">
      <div className="cells-list">
        {cells.map((cell, index) => {
          if (cell.type === 'markdown') {
            return (
              <MarkdownCell
                key={cell.id}
                cell={cell}
                index={index}
                totalCells={cells.length}
                onUpdateCode={onUpdateCode}
                onDeleteCell={onDeleteCell}
                onMoveCell={onMoveCell}
                onDuplicateCell={onDuplicateCell}
                activeCellId={activeCellId}
                setActiveCellId={setActiveCellId}
              />
            );
          }

          return (
            <CodeCell
              key={cell.id}
              cell={cell}
              index={index}
              totalCells={cells.length}
              onUpdateCode={onUpdateCode}
              onRunCell={onRunCell}
              onDeleteCell={onDeleteCell}
              onMoveCell={onMoveCell}
              onDuplicateCell={onDuplicateCell}
              onOpenPlotModal={onOpenPlotModal}
              activeCellId={activeCellId}
              setActiveCellId={setActiveCellId}
              onCodeMirrorReady={onCodeMirrorReady}
            />
          );
        })}
      </div>

      <div className="add-cell-bottom-bar">
        <button 
          className="add-cell-btn code-btn" 
          onClick={() => onAddCell('code')}
        >
          <Code className="w-4 h-4 mr-1 text-emerald-400" />
          <span>+ Code Cell</span>
        </button>
        <button 
          className="add-cell-btn md-btn" 
          onClick={() => onAddCell('markdown')}
        >
          <Type className="w-4 h-4 mr-1 text-blue-400" />
          <span>+ Text/Markdown</span>
        </button>
      </div>
    </div>
  );
}
