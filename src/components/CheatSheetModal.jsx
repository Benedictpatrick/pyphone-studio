import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, Plus } from 'lucide-react';
import { CHEAT_SHEET_SECTIONS } from '../services/cheatSheetService';

export default function CheatSheetModal({ isOpen, onClose, onInsertSnippet }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (code, key) => {
    onInsertSnippet('\n' + code + '\n');
    setCopiedIdx(key);
    setTimeout(() => {
      setCopiedIdx(null);
      onClose();
    }, 500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card cheat-sheet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>Data Science Cheat Sheet & Snippets</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Tap any code snippet to copy and insert it directly into your active code cell:
          </p>

          <div className="cheat-sections-list">
            {CHEAT_SHEET_SECTIONS.map((sec) => (
              <div key={sec.id} className="cheat-section">
                <h4 className="cheat-section-title">{sec.title}</h4>
                <div className="cheat-items-grid">
                  {sec.items.map((item, iIdx) => {
                    const itemKey = `${sec.id}-${iIdx}`;
                    const isCopied = copiedIdx === itemKey;

                    return (
                      <div key={itemKey} className="cheat-item-card">
                        <div className="cheat-item-header">
                          <span className="cheat-item-label">{item.label}</span>
                          <button 
                            className={`cheat-copy-btn ${isCopied ? 'copied' : ''}`}
                            onClick={() => handleCopy(item.code, itemKey)}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Inserted!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Insert Snippet</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="cheat-code-preview"><code>{item.code}</code></pre>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
