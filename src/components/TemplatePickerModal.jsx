import React from 'react';
import { X, Sparkles, ArrowRight, Code } from 'lucide-react';
import { PYTHON_TEMPLATES } from '../templates/pythonTemplates';

export default function TemplatePickerModal({ isOpen, onClose, onSelectTemplate }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>Visualization Code Templates</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Select a starter Python visualization script for Matplotlib, Seaborn, or Pandas:
          </p>

          <div className="template-grid">
            {PYTHON_TEMPLATES.map((tmpl) => (
              <div 
                key={tmpl.id} 
                className="template-card"
                onClick={() => {
                  onSelectTemplate(tmpl.code);
                  onClose();
                }}
              >
                <div className="template-card-header">
                  <span className="template-category">{tmpl.category}</span>
                  <Code className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="template-title">{tmpl.title}</h4>
                <p className="template-desc">{tmpl.description}</p>
                <div className="template-footer">
                  <span className="load-link">
                    Load Code <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
