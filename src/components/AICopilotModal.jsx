import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Check,
  Copy,
  Send,
  Plus,
  Wrench,
  Loader2,
  BarChart2,
  LineChart,
  Repeat,
  Zap,
  Search,
  Settings2,
  Trash2
} from 'lucide-react';
import { hapticLight, hapticSuccess } from '../utils/haptics';
import { aiCopilotService, LOCAL_MODELS, getRecommendedModel, getDeviceMemoryGB } from '../services/aiCopilotService';

function ModelDownloadProgress({ name, progress, status, compact }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress || 0)));
  return (
    <div className={`model-download-progress ${compact ? 'compact' : ''}`}>
      <div className="model-download-progress-row">
        <Loader2 className="icon-xs icon-accent spin" />
        <span className="model-download-progress-status">{status || `Downloading ${name}...`}</span>
        <span className="model-download-progress-pct">{pct}%</span>
      </div>
      <div className="model-download-progress-track">
        <div className="model-download-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AICopilotModal({
  isOpen,
  onClose,
  activeCode = '',
  lastError = null,
  onInsertCode
}) {
  const [activeModel, setActiveModel] = useState(() => aiCopilotService.getSelectedModel());
  const [modelCachedMap, setModelCachedMap] = useState({});
  // Tracks which single model is downloading (the service only runs one
  // download at a time) so its OWN card can show real inline progress,
  // instead of a single global bar that forces the picker to close.
  const [downloadingModelId, setDownloadingModelId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [deletingModelId, setDeletingModelId] = useState(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const recommendedModelId = useRef(getRecommendedModel().id).current;
  const deviceMemGB = useRef(getDeviceMemoryGB()).current;

  const [userPrompt, setUserPrompt] = useState('');
  const [chatLogs, setChatLogs] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am Pyxi, your Python coding assistant. Ask me for Python scripts, data analysis functions, or error fixes.',
      code: `# Examples:\n# "Write a function to process CSV data"\n# "Create a Seaborn plot"`
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [confirmInsertIdx, setConfirmInsertIdx] = useState(null);
  const confirmTimerRef = useRef(null);

  const messagesEndRef = useRef(null);

  // Refresh cached status for all models
  const refreshModelStatuses = async () => {
    const map = {};
    for (const m of LOCAL_MODELS) {
      map[m.id] = await aiCopilotService.checkModelCached(m.id);
    }
    setModelCachedMap(map);
    setActiveModel(aiCopilotService.getSelectedModel());
  };

  useEffect(() => {
    if (isOpen) refreshModelStatuses();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs, isGenerating, streamingText]);

  if (!isOpen) return null;

  const handleDownloadModel = async (modelId) => {
    if (downloadingModelId) return;
    hapticLight();
    setDownloadingModelId(modelId);
    setDownloadProgress(0);
    setDownloadStatus('');
    const success = await aiCopilotService.downloadModel(modelId, ({ progress, message }) => {
      setDownloadProgress(progress);
      setDownloadStatus(message);
    });
    setDownloadingModelId(null);
    await refreshModelStatuses();
    if (success) hapticSuccess();
  };

  const handleSelectModel = (modelId) => {
    hapticLight();
    aiCopilotService.setSelectedModel(modelId);
    setActiveModel(aiCopilotService.getSelectedModel());
    setShowModelPicker(false);
  };

  const handleRemoveModel = async (modelId) => {
    hapticLight();
    setDeletingModelId(modelId);
    await aiCopilotService.removeModel(modelId);
    await refreshModelStatuses();
    setDeletingModelId(null);
  };

  const handleAnalyzeCode = async () => {
    if (isGenerating) return;
    hapticLight();
    setChatLogs(prev => [
      ...prev,
      { sender: 'user', text: 'Analyze my active editor code for mistakes' }
    ]);
    setIsGenerating(true);
    setStreamingText('');

    aiCopilotService.onGenerateUpdate = (partialText) => setStreamingText(partialText);

    const result = await aiCopilotService.analyzeActiveCode(activeCode, lastError);
    aiCopilotService.onGenerateUpdate = null;
    setStreamingText('');
    setChatLogs(prev => [
      ...prev,
      { sender: 'ai', text: result.text, code: result.code }
    ]);
    setIsGenerating(false);
    hapticSuccess();
  };

  const handleStopGeneration = () => {
    hapticLight();
    aiCopilotService.cancelGeneration();
  };

  const handleSendPrompt = async (textToSend) => {
    const prompt = textToSend || userPrompt;
    if (!prompt.trim() || isGenerating) return;

    hapticLight();
    const userMsg = { sender: 'user', text: prompt };
    setChatLogs(prev => [...prev, userMsg]);
    setUserPrompt('');
    setIsGenerating(true);
    setStreamingText('');

    aiCopilotService.onGenerateUpdate = (partialText) => setStreamingText(partialText);

    setTimeout(async () => {
      const response = await aiCopilotService.generateResponse(prompt, activeCode);
      aiCopilotService.onGenerateUpdate = null;
      setStreamingText('');
      setChatLogs(prev => [
        ...prev,
        { sender: 'ai', text: response.text, code: response.code }
      ]);
      setIsGenerating(false);
      hapticSuccess();
    }, 400);
  };

  const handleExplainError = async () => {
    if (isGenerating) return;
    hapticLight();
    setIsGenerating(true);
    setStreamingText('');

    aiCopilotService.onGenerateUpdate = (partialText) => setStreamingText(partialText);

    const errAnalysis = await aiCopilotService.explainError(activeCode, lastError);
    aiCopilotService.onGenerateUpdate = null;
    setStreamingText('');
    setChatLogs(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `Resolution: ${errAnalysis.explanation}`,
        code: errAnalysis.fixSnippet
      }
    ]);
    setIsGenerating(false);
    hapticSuccess();
  };

  const handleCopySnippet = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleInsertClick = (codeText, idx) => {
    hapticLight();
    if (confirmInsertIdx === idx) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setConfirmInsertIdx(null);
      onInsertCode?.(codeText);
      onClose();
    } else {
      setConfirmInsertIdx(idx);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmInsertIdx(null);
      }, 3500);
    }
  };

  const isCurrentModelCached = modelCachedMap[activeModel.id];

  return (
    <div className="pycopilot-drawer">
      {/* Header */}
      <div className="pycopilot-header">
        <div className="pycopilot-header-title">
          <div className="pyxi-icon-badge">
            <img src="/pyxi-mascot.jpg" alt="Pyxi Logo" className="pyxi-avatar-img-header" />
          </div>
          <div>
            <h4 className="pycopilot-title">Pyxi</h4>
            <span className="pycopilot-subtitle">{activeModel.name} · {activeModel.sizeMB}MB</span>
          </div>
        </div>

        <div className="pycopilot-header-actions">
          <button
            className="pycopilot-settings-btn"
            onClick={() => setShowModelPicker(!showModelPicker)}
            title="Switch AI Models"
          >
            <Settings2 className="icon-sm icon-accent" />
          </button>
          <button className="pycopilot-close-btn" onClick={onClose} title="Close Pyxi">
            <X className="icon-sm icon-muted" />
          </button>
        </div>
      </div>

      {/* Download / Model Status Bar */}
      {!isCurrentModelCached && !showModelPicker && (
        <div className="pycopilot-model-bar">
          {downloadingModelId === activeModel.id ? (
            <ModelDownloadProgress name={activeModel.name} progress={downloadProgress} status={downloadStatus} />
          ) : (
            <button className="pycopilot-download-btn" onClick={() => handleDownloadModel(activeModel.id)}>
              <Download className="icon-sm" />
              <span>Download {activeModel.name} ({activeModel.sizeMB}MB)</span>
            </button>
          )}
        </div>
      )}

      {/* Model Picker Card Overlay */}
      {showModelPicker && (
        <div className="pyxi-model-picker-panel">
          <div className="picker-panel-header">
            <h5 className="picker-panel-title">Choose Local AI Model</h5>
            <button className="pycopilot-close-btn" onClick={() => setShowModelPicker(false)}>
              <X className="icon-sm icon-muted" />
            </button>
          </div>

          <div className="model-cards-list">
            {LOCAL_MODELS.map((model) => {
              const cached = modelCachedMap[model.id];
              const isSelected = activeModel.id === model.id;
              const isRecommended = model.id === recommendedModelId;
              const mayBeTooBig = deviceMemGB !== null && model.minMemoryGB > deviceMemGB;
              const isDownloadingThis = downloadingModelId === model.id;
              const isDeletingThis = deletingModelId === model.id;

              return (
                <div key={model.id} className={`model-card-item ${isSelected ? 'selected' : ''}`}>
                  <div className="model-card-top">
                    <div className="model-card-name-row">
                      <h5 className="model-card-title">{model.name}</h5>
                      {isRecommended && <span className="model-tag-pill recommended">Recommended for you</span>}
                    </div>
                    <span className="model-size-badge">{model.sizeMB} MB</span>
                  </div>

                  <p className="model-card-desc">{model.desc}</p>
                  {mayBeTooBig && (
                    <p className="model-card-warning">⚠ May run out of memory on this device — SmolLM2 360M is safer here.</p>
                  )}

                  {isDownloadingThis ? (
                    <ModelDownloadProgress name={model.name} progress={downloadProgress} status={downloadStatus} compact />
                  ) : (
                    <div className="model-card-actions">
                      {cached ? (
                        <>
                          <button
                            className={`model-action-btn ${isSelected ? 'active' : 'primary'}`}
                            onClick={() => handleSelectModel(model.id)}
                          >
                            {isSelected ? <Check className="icon-xs icon-success" /> : null}
                            <span>{isSelected ? 'Active Model' : 'Use Model'}</span>
                          </button>
                          <button
                            className="model-delete-btn"
                            onClick={() => handleRemoveModel(model.id)}
                            disabled={isDeletingThis}
                            title="Delete Model Cache"
                          >
                            {isDeletingThis ? <Loader2 className="icon-xs icon-danger spin" /> : <Trash2 className="icon-xs icon-danger" />}
                          </button>
                        </>
                      ) : (
                        <button
                          className="model-action-btn download"
                          onClick={() => handleDownloadModel(model.id)}
                          disabled={!!downloadingModelId}
                        >
                          <Download className="icon-xs" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Explainer Alert */}
      {lastError && !showModelPicker && (
        <div className="pycopilot-error-banner" onClick={handleExplainError}>
          <Wrench className="icon-sm icon-danger" />
          <span>Execution error detected. Tap to generate fix.</span>
        </div>
      )}

      {/* Chat Messages Body */}
      {!showModelPicker && (
        <div className="pycopilot-messages-body">
          {chatLogs.map((msg, idx) => (
            <div key={idx} className={`pycopilot-bubble ${msg.sender}`}>
              {msg.sender === 'ai' && (
                <div className="pyxi-bubble-sender">
                  <img
                    src="/pyxi-mascot.jpg"
                    alt="Pyxi"
                    className="pyxi-msg-avatar"
                  />
                  <span>Pyxi</span>
                </div>
              )}
              <p className="bubble-txt">{msg.text}</p>

              {msg.code && (
                <div className="pycopilot-code-box">
                  <div className="code-box-toolbar">
                    <span className="code-lang-label">python</span>
                    <div className="code-box-actions">
                      <button
                        className="code-mini-btn"
                        onClick={() => handleCopySnippet(msg.code, idx)}
                      >
                        {copiedIdx === idx ? <Check className="icon-xs icon-success" /> : <Copy className="icon-xs" />}
                        <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        className={`code-mini-btn primary ${confirmInsertIdx === idx ? 'confirm-state' : ''}`}
                        onClick={() => handleInsertClick(msg.code, idx)}
                        title={confirmInsertIdx === idx ? "Tap again to confirm inserting into editor" : "Insert Code to Editor"}
                      >
                        {confirmInsertIdx === idx ? (
                          <Check className="icon-xs" />
                        ) : (
                          <Plus className="icon-xs" />
                        )}
                        <span>{confirmInsertIdx === idx ? 'Confirm Insert?' : 'Insert Code'}</span>
                      </button>
                    </div>
                  </div>
                  <pre className="code-snippet-pre"><code>{msg.code}</code></pre>
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="pycopilot-bubble ai">
              {streamingText ? (
                <pre className="bubble-txt streaming-txt">{streamingText}<span className="stream-cursor">▍</span></pre>
              ) : (
                <div className="pycopilot-typing">
                  <Loader2 className="icon-sm icon-accent spin" />
                  <span>Pyxi is generating Python code...</span>
                </div>
              )}
              <button className="pycopilot-stop-btn" onClick={handleStopGeneration}>
                <X className="icon-xs" />
                <span>Stop</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Clean Icon Chips Row */}
      {!showModelPicker && (
        <div className="pycopilot-chips-bar">
          <button className="mini-chip highlight-chip" onClick={handleAnalyzeCode} title="Analyze active editor code for mistakes">
            <Search className="icon-xs" />
            <span>Analyze Code</span>
          </button>
          <button className="mini-chip" onClick={() => handleSendPrompt("Pandas CSV Data Analysis")}>
            <BarChart2 className="icon-xs" />
            <span>Pandas</span>
          </button>
          <button className="mini-chip" onClick={() => handleSendPrompt("Seaborn Scatter Chart")}>
            <LineChart className="icon-xs" />
            <span>Seaborn</span>
          </button>
          <button className="mini-chip" onClick={() => handleSendPrompt("Python Loop Examples")}>
            <Repeat className="icon-xs" />
            <span>Loop</span>
          </button>
          <button className="mini-chip" onClick={() => handleSendPrompt("Write Python Metrics Function")}>
            <Zap className="icon-xs" />
            <span>Function</span>
          </button>
        </div>
      )}

      {/* Input Bar */}
      {!showModelPicker && (
        <div className="pycopilot-input-bar">
          <input
            type="text"
            className="pycopilot-input"
            placeholder={`Ask Pyxi (${activeModel.name}) for code...`}
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendPrompt();
            }}
          />
          <button 
            className="pycopilot-send-btn"
            onClick={() => handleSendPrompt()}
            disabled={isGenerating || !userPrompt.trim()}
          >
            <Send className="icon-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
