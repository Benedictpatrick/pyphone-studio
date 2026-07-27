import React from 'react';
import { X, Download, Image as ImageIcon, Info } from 'lucide-react';

export default function PlotModal({ plotBase64, onClose }) {
  if (!plotBase64) return null;

  const isHtml = plotBase64 && plotBase64.type === 'html';
  const plotData = plotBase64?.data || plotBase64;

  const handleDownload = () => {
    if (isHtml) {
      const blob = new Blob([plotData], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interactive_plot_${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${plotData}`;
      link.download = `python_visualization_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="plot-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              <span>Visualization Inspector</span>
            </div>
            <div className="modal-actions">
              <button className="framer-btn-primary" onClick={handleDownload} title="Download Graph">
                <Download className="w-3.5 h-3.5 fill-current" />
                <span>{isHtml ? 'Save HTML' : 'Save PNG'}</span>
              </button>
              <button className="modal-close-btn" onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="plot-image-container">
          {isHtml ? (
            <iframe 
              srcDoc={`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"><style>body{margin:0;padding:0;background:white;}</style></head><body>${plotData}</body></html>`} 
              title="Interactive Python Plot"
              className="full-plot-iframe"
              sandbox="allow-scripts allow-downloads"
            />
          ) : (
            <img 
              src={`data:image/png;base64,${plotData}`} 
              alt="Python Matplotlib Seaborn Graph Output"
              className="full-plot-img" 
            />
          )}
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
