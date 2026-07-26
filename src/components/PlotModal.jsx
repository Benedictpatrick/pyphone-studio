import React from 'react';
import { X, Download, Image as ImageIcon, Info } from 'lucide-react';

export default function PlotModal({ plotBase64, onClose }) {
  if (!plotBase64) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${plotBase64}`;
    link.download = `python_visualization_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="plot-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <span>Visualization Inspector</span>
          </div>
          <div className="modal-actions">
            <button className="framer-btn-primary" onClick={handleDownload} title="Download Graph Image">
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Save PNG</span>
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="plot-image-container">
          <img 
            src={`data:image/png;base64,${plotBase64}`} 
            alt="Python Matplotlib Seaborn Graph Output"
            className="full-plot-img" 
          />
        </div>

        <div className="plot-modal-footer">
          <p className="plot-tip">
            <Info className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
            Pinch or double tap on screen to zoom graph details.
          </p>
        </div>
      </div>
    </div>
  );
}
