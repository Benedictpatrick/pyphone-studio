import React from 'react';
import { 
  X, 
  Sparkles, 
  ArrowRight,
  BarChart3, 
  TrendingUp, 
  ScatterChart, 
  Activity,
  LineChart 
} from 'lucide-react';
import { PYTHON_TEMPLATES } from '../templates/pythonTemplates';

export default function TemplatePickerModal({ isOpen, onClose, onSelectTemplate }) {
  if (!isOpen) return null;

  // Monochrome SVG icon helper for categories
  const getCategoryIcon = (category) => {
    if (category.includes('Bar')) return <BarChart3 className="w-3.5 h-3.5" />;
    if (category.includes('Line')) return <TrendingUp className="w-3.5 h-3.5" />;
    if (category.includes('Scatter')) return <ScatterChart className="w-3.5 h-3.5" />;
    if (category.includes('Time Series')) return <LineChart className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <Sparkles className="w-5 h-5" />
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
                  <div className="template-label-with-svg">
                    {getCategoryIcon(tmpl.category)}
                    <span>{tmpl.category}</span>
                  </div>
                </div>

                <h4 className="template-title">{tmpl.title}</h4>
                <p className="template-desc">{tmpl.description}</p>

                <div className="template-card-footer">
                  <button className="template-load-btn">
                    <span>Load Code Snippet</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
