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
          <div className="modal-title">
            <Database className="w-5 h-5 text-blue-400" />
            <span>Preloaded Datasets & Mount CSV</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
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
                <div key={key} className="dataset-card" onClick={() => handleSelectDataset(key)}>
                  <div className="dataset-card-header">
                    <div className="dataset-icon-title">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                      <span className="dataset-filename">{dataset.filename}</span>
                    </div>
                    <span className="dataset-badge">{dataset.category}</span>
                  </div>
                  <h4 className="dataset-name">{dataset.name}</h4>
                  <p className="dataset-desc">{dataset.description}</p>
                  <button className={`load-ds-btn ${isCopied ? 'copied' : ''}`}>
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Mounted into Pandas</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Load CSV Snippet</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <hr className="modal-divider" />

          {/* Custom CSV Upload */}
          <div className="custom-csv-box">
            <h4 className="custom-csv-title">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Paste Custom CSV Dataset</span>
            </h4>
            <input
              type="text"
              placeholder="Filename (e.g. my_data.csv)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="modal-input"
            />
            <textarea
              placeholder="Paste raw CSV contents here (col1,col2...)"
              value={customCsv}
              onChange={(e) => setCustomCsv(e.target.value)}
              rows={3}
              className="modal-textarea"
            />
            {uploadStatus && <p className="status-msg">{uploadStatus}</p>}
            <button className="framer-btn-primary w-full mt-2" onClick={handleCustomUpload}>
              Mount Custom CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
