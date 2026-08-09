import React, { useState, useRef } from 'react';
import { X, Database, FileSpreadsheet, Plus, Check, Upload, UploadCloud, Trash2, Grid3x3, Loader2 } from 'lucide-react';
import { SAMPLE_DATASETS } from '../services/datasetService';
import { writeCustomDataset } from '../services/pyodideService';

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DatasetLoaderModal({
  isOpen,
  onClose,
  onInsertCodeSnippet,
  uploadedDatasets = [],
  onUploadDataset,
  onDeleteUploadedDataset,
  onInsertCorrelationHeatmap
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customCsv, setCustomCsv] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleSelectUploaded = (dataset) => {
    const snippet = `# Read uploaded dataset: ${dataset.filename}
import pandas as pd
df = pd.read_csv('${dataset.filename}')
print("Dataset Shape:", df.shape)
print(df.head())
`;
    onInsertCodeSnippet(snippet);
    setCopiedKey(dataset.id);
    setTimeout(() => {
      setCopiedKey(null);
      onClose();
    }, 600);
  };

  const processFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => /\.csv$/i.test(f.name) || f.type === 'text/csv');
    if (files.length === 0) {
      setUploadStatus('Please choose a .csv file.');
      return;
    }
    setIsUploading(true);
    for (const file of files) {
      try {
        const record = await onUploadDataset(file);
        setUploadStatus(`Uploaded ${record.filename}, ready to use.`);
      } catch (err) {
        setUploadStatus(`Error: ${err.message}`);
      }
    }
    setIsUploading(false);
    setTimeout(() => setUploadStatus(''), 2500);
  };

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
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
              <span>Datasets & Correlation</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Real File Upload: drag & drop or tap to browse */}
          <div
            className={`dataset-upload-zone ${isDragActive ? 'drag-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              className="dataset-upload-input"
              onChange={handleFileInputChange}
            />
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-blue-400 upload-spin" />
            ) : (
              <UploadCloud className="w-6 h-6 text-blue-400" />
            )}
            <div className="dataset-upload-text">
              <strong>Tap to upload</strong> or drag & drop a CSV file
            </div>
            <span className="dataset-upload-hint">Saved on this device: survives reload</span>
          </div>

          {uploadStatus && <p className="status-msg">{uploadStatus}</p>}

          {/* Persisted uploaded datasets */}
          {uploadedDatasets.length > 0 && (
            <>
              <p className="modal-subtitle dataset-section-title">Your Uploaded Datasets</p>
              <div className="dataset-grid">
                {uploadedDatasets.map((dataset) => {
                  const isCopied = copiedKey === dataset.id;
                  return (
                    <div
                      key={dataset.id}
                      className={`dataset-card sleek-card ${isCopied ? 'copied' : ''}`}
                      onClick={() => handleSelectUploaded(dataset)}
                    >
                      <div className="dataset-card-header sleek">
                        <div className="dataset-icon-title">
                          <FileSpreadsheet className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
                          <span className="dataset-name sleek">{dataset.name}</span>
                        </div>
                        <div className="dataset-card-actions">
                          <button
                            className="dataset-action-btn"
                            title="Insert correlation heatmap"
                            onClick={(e) => { e.stopPropagation(); onInsertCorrelationHeatmap(dataset); }}
                          >
                            <Grid3x3 className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            className="dataset-action-btn delete-btn"
                            title="Delete dataset"
                            onClick={(e) => { e.stopPropagation(); onDeleteUploadedDataset(dataset.id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                          {isCopied && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                        </div>
                      </div>
                      <div className="dataset-badges sleek">
                        <span className="dataset-filename sleek">{dataset.filename}</span>
                        <span className="dataset-badge sleek">{formatFileSize(dataset.size)}</span>
                      </div>
                      <p className="dataset-desc sleek">Uploaded {new Date(dataset.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  );
                })}
              </div>
              <hr className="modal-divider" />
            </>
          )}

          <p className="modal-subtitle">
            Tap any CSV dataset to mount it into Python memory and insert <code className="inline-code">pd.read_csv()</code>. Use the <Grid3x3 className="w-3.5 h-3.5 inline-icon" /> icon for an instant correlation heatmap:
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
                    <div className="dataset-card-actions">
                      <button
                        className="dataset-action-btn"
                        title="Insert correlation heatmap"
                        onClick={(e) => { e.stopPropagation(); onInsertCorrelationHeatmap(dataset); }}
                      >
                        <Grid3x3 className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Plus className="w-4 h-4 text-slate-500 opacity-50 flex-shrink-0 hover-plus" />
                      )}
                    </div>
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

          {/* Custom CSV Paste Fallback */}
          <div className="custom-csv-box">
            <h4 className="custom-csv-title">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Or Paste Custom CSV Text</span>
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
