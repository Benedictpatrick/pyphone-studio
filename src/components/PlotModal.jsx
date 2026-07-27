import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, Download, Image as ImageIcon, Info, ExternalLink } from 'lucide-react';

export default function PlotModal({ plotBase64, onClose }) {
  if (!plotBase64) return null;

  const isHtml = plotBase64 && plotBase64.type === 'html';
  const plotData = plotBase64?.data || plotBase64;

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.download = isHtml ? 'python_plot.html' : 'python_plot.png';
      
      if (isHtml) {
        const blob = new Blob([plotData], { type: 'text/html' });
        link.href = URL.createObjectURL(blob);
      } else {
        link.href = `data:image/png;base64,${plotData}`;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const handleOpenInNewTab = () => {
    try {
      if (isHtml) {
        const blob = new Blob([plotData], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        const byteString = atob(plotData);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'image/png' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } catch (e) {
      console.error('Failed to open in new tab:', e);
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
              <button className="framer-btn-secondary" onClick={handleOpenInNewTab} title="Open in New Tab">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open in New Tab</span>
              </button>
              <button className="framer-btn-primary" onClick={handleDownload} title="Download Graph">
                <Download className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">{isHtml ? 'Save HTML' : 'Save PNG'}</span>
              </button>
              <button className="modal-close-btn" onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="plot-image-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {isHtml ? (
            <iframe 
              srcDoc={`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"><style>body{margin:0;padding:0;background:white;}</style></head><body>${plotData}</body></html>`} 
              title="Interactive Python Plot"
              className="full-plot-iframe"
              sandbox="allow-scripts allow-downloads"
            />
          ) : (
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={5}
              centerOnInit={true}
              wheel={{ step: 0.1 }}
            >
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <img 
                  src={`data:image/png;base64,${plotData}`} 
                  alt="Python Matplotlib Seaborn Graph Output"
                  className="full-plot-img" 
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              </TransformComponent>
            </TransformWrapper>
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
