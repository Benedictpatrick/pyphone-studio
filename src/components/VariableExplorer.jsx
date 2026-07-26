import React from 'react';
import { Layers, RefreshCw, X, Box, Table } from 'lucide-react';

export default function VariableExplorer({ isOpen, onClose, variables = [], onRefresh }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card var-explorer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Python Variable Explorer</span>
            </div>
            <div className="modal-actions">
              <button className="modal-action-btn" onClick={onRefresh} title="Refresh Variables">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button className="modal-close-btn" onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {variables.length === 0 ? (
            <div className="var-empty-state">
              <Box className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="modal-subtitle text-center">
                No active user variables in Python memory yet. Run a code cell (e.g. <code className="inline-code">df = pd.read_csv(...)</code>) to inspect variables!
              </p>
            </div>
          ) : (
            <div className="var-table-wrapper">
              <table className="var-explorer-table">
                <thead>
                  <tr>
                    <th>Variable Name</th>
                    <th>Type</th>
                    <th>Shape / Size</th>
                    <th>Value Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((v, idx) => (
                    <tr key={idx}>
                      <td className="var-name-cell">
                        {v.type === 'DataFrame' && <Table className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />}
                        <span className="var-name">{v.name}</span>
                      </td>
                      <td className="var-type"><span className="type-badge">{v.type}</span></td>
                      <td className="var-shape">{v.shape || '-'}</td>
                      <td className="var-preview"><code>{v.repr}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
