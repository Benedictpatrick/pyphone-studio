import React, { useState, useMemo } from 'react';
import { Type, Eye, Edit2, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';

/**
 * A self-contained, dependency-free Markdown → React renderer.
 * Supports: headings (#/##/###), bold (**), italic (*), inline code (`),
 * links ([text](url)), unordered lists (- / *), ordered lists (1.),
 * code fences (```), blockquotes (>), horizontal rules (---), and bare URLs.
 */
function renderMarkdown(raw) {
  if (!raw.trim()) return null;

  const lines = raw.split('\n');
  const elements = [];
  let i = 0;
  let key = 0;

  const nextKey = () => key++;

  // Inline parser: bold, italic, inline code, links, bare URLs
  const parseInline = (text) => {
    const parts = [];
    // Combined regex for all inline patterns
    const re = /(`[^`]+`)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[([^\]]+)\]\(([^)]+)\))|(https?:\/\/[^\s)]+)/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[1]) {
        // `inline code`
        parts.push(<code key={nextKey()} className="md-inline-code">{m[1].slice(1, -1)}</code>);
      } else if (m[2]) {
        // **bold**
        parts.push(<strong key={nextKey()}>{m[3]}</strong>);
      } else if (m[4]) {
        // *italic*
        parts.push(<em key={nextKey()}>{m[5]}</em>);
      } else if (m[6]) {
        // [text](url)
        parts.push(<a key={nextKey()} href={m[8]} target="_blank" rel="noopener noreferrer" className="md-link">{m[7]}</a>);
      } else if (m[9]) {
        // bare URL
        parts.push(<a key={nextKey()} href={m[9]} target="_blank" rel="noopener noreferrer" className="md-link">{m[9]}</a>);
      }
      last = re.lastIndex;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    // --- Fenced code block ---
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      elements.push(
        <pre key={nextKey()} className="md-code-block">
          {lang && <span className="md-code-lang">{lang}</span>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // --- Heading ---
    const hMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const Tag = `h${Math.min(level, 6)}`;
      elements.push(<Tag key={nextKey()} className={`md-h${level}`}>{parseInline(hMatch[2])}</Tag>);
      i++;
      continue;
    }

    // --- Horizontal rule ---
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      elements.push(<hr key={nextKey()} className="md-hr" />);
      i++;
      continue;
    }

    // --- Blockquote ---
    if (line.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={nextKey()} className="md-blockquote">
          {quoteLines.map((ql, qi) => <p key={qi}>{parseInline(ql)}</p>)}
        </blockquote>
      );
      continue;
    }

    // --- Unordered list ---
    if (/^[-*+]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={nextKey()} className="md-ul">
          {items.map((item, ii) => <li key={ii}>{parseInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // --- Ordered list ---
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={nextKey()} className="md-ol">
          {items.map((item, ii) => <li key={ii}>{parseInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // --- Empty line → spacer ---
    if (line.trim() === '') {
      elements.push(<div key={nextKey()} className="md-spacer" />);
      i++;
      continue;
    }

    // --- Paragraph ---
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('> ') && !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    elements.push(
      <p key={nextKey()} className="md-p">
        {parseInline(paraLines.join(' '))}
      </p>
    );
  }

  return elements;
}

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

  // Memoize rendered markdown, only re-parse when cell.code changes
  const rendered = useMemo(() => renderMarkdown(cell.code), [cell.code]);

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
            placeholder="## Heading&#10;**bold**, *italic*, `inline code`&#10;- list item&#10;[link](https://example.com)"
            rows={Math.max(4, cell.code.split('\n').length + 1)}
            onFocus={() => setActiveCellId(cell.id)}
            spellCheck={true}
          />
        ) : (
          <div 
            className="markdown-rendered-view"
            onClick={() => setIsEditing(true)}
          >
            {rendered ? (
              <div className="md-content">{rendered}</div>
            ) : (
              <p className="md-placeholder">
                Tap to write Markdown: supports <code>**bold**</code>, <code>*italic*</code>, <code>`code`</code>, headings, lists, links &amp; more
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
