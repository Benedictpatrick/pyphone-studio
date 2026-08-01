import React, { useState } from 'react';
import { X, Database, FileSpreadsheet, Plus, Check, Upload } from 'lucide-react';
import { SAMPLE_DATASETS } from '../services/datasetService';
import { writeCustomDataset } from '../services/pyodideService';

export default function DatasetLoaderModal({ isOpen, onClose, onInsertCodeSnippet }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customCsv, setCustomCsv] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  if (!isOpen) return null;

  const handleSelectDataset = (key) => {
    const dataset = SAMPLE_DATASETS[key];
    const snippet = `# Read ${dataset.name}
import pandas as pd
df = pd.read_csv('${dataset.filename}')
print("Dataset Shape:", df.shape)
print(df.head())
`;
    onInsertCodeSnippet(snippet);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
      onClose();
    }, 600);
  };

  const handleCustomUpload = async () => {
    if (!customName || !customCsv) {
      setUploadStatus('Please provide a filename and CSV content.');
      return;
    }
    const cleanFilename = customName.endsWith('.csv') ? customName : `${customName}.csv`;
    try {
      await writeCustomDataset(cleanFilename, customCsv);
      const snippet = `# Read custom uploaded dataset: ${cleanFilename}
import pandas as pd
df = pd.read_csv('${cleanFilename}')
print(df.head())
`;
      onInsertCodeSnippet(snippet);
      setUploadStatus(`Success! Loaded as ${cleanFilename}`);
      setCustomName('');
      setCustomCsv('');

      setTimeout(() => {
        setUploadStatus('');
        onClose();
      }, 800);
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card dataset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <Database className="w-5 h-5 text-blue-400" />
              <span>Preloaded Datasets & Mount CSV</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Tap any CSV dataset to mount it into Python memory and insert <code className="inline-code">pd.read_csv()</code>:
          </p>

          <div className="dataset-grid">
            {Object.keys(SAMPLE_DATASETS).map((key) => {
              const dataset = SAMPLE_DATASETS[key];
              const isCopied = copiedKey === key;

              return (
                <div key={key} className={`dataset-card sleek-card ${isCopied ? 'copied' : ''}`} onClick={() => handleSelectDataset(key)}>
                  <div className="dataset-card-header sleek">
                    <div className="dataset-icon-title">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
                      <span className="dataset-name sleek">{dataset.name}</span>
                    </div>
                    {isCopied ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-500 opacity-50 flex-shrink-0 hover-plus" />
                    )}
                  </div>
                  <div className="dataset-badges sleek">
                    <span className="dataset-filename sleek">{dataset.filename}</span>
                    <span className="dataset-badge sleek">{dataset.category}</span>
                  </div>
                  <p className="dataset-desc sleek">{dataset.description}</p>
                </div>
              );
            })}
          </div>

          <hr className="modal-divider" />

          {/* Custom CSV Upload Form */}
          <div className="custom-csv-box">
            <h4 className="custom-csv-title">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Paste Custom CSV Dataset</span>
            </h4>

            <div className="form-group">
              <label className="form-label">Dataset Filename</label>
              <input
                type="text"
                placeholder="e.g. sales_2024.csv"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Raw CSV Contents</label>
              <textarea
                placeholder="name,age,marks&#10;Arun,20,85&#10;Ben,21,90"
                value={customCsv}
                onChange={(e) => setCustomCsv(e.target.value)}
                rows={3}
                className="modal-textarea"
              />
            </div>

            {uploadStatus && <p className="status-msg">{uploadStatus}</p>}

            <button className="framer-btn-primary full-width-btn" onClick={handleCustomUpload}>
              <Plus className="w-4 h-4" />
              <span>Mount Custom CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
