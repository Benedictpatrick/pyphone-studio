import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  X, 
  Download, 
  Check, 
  Copy, 
  Send, 
  Plus, 
  Wrench,
  Loader2,
  Cpu,
  BarChart2,
  LineChart,
  Repeat,
  Zap,
  Search,
  Settings2,
  Trash2
} from 'lucide-react';
import { hapticLight, hapticSuccess } from '../utils/haptics';
import { aiCopilotService, LOCAL_MODELS } from '../services/aiCopilotService';

export default function AICopilotModal({
  isOpen,
  onClose,
  activeCode = '',
  lastError = null,
  onInsertCode
}) {
  const [activeModel, setActiveModel] = useState(() => aiCopilotService.getSelectedModel());
  const [modelCachedMap, setModelCachedMap] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);

  const [userPrompt, setUserPrompt] = useState('');
  const [chatLogs, setChatLogs] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am Pyxi, your Python coding assistant. Ask me for Python scripts, data analysis functions, or error fixes.',
      code: `# Examples:\n# "Write a function to process CSV data"\n# "Create a Seaborn plot"`
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
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
  }, [chatLogs, isGenerating]);

  if (!isOpen) return null;

  const handleDownloadModel = async (modelId) => {
    hapticLight();
    setShowModelPicker(false);
    setIsDownloading(true);
    await aiCopilotService.downloadModel(modelId, ({ progress, message }) => {
      setDownloadProgress(progress);
      setDownloadStatus(message);
    });
    setIsDownloading(false);
    await refreshModelStatuses();
    hapticSuccess();
  };

  const handleSelectModel = (modelId) => {
    hapticLight();
    aiCopilotService.setSelectedModel(modelId);
    setActiveModel(aiCopilotService.getSelectedModel());
    setShowModelPicker(false);
  };

  const handleRemoveModel = async (modelId) => {
    hapticLight();
    await aiCopilotService.removeModel(modelId);
    await refreshModelStatuses();
  };

  const handleAnalyzeCode = () => {
    hapticLight();
    setIsGenerating(true);

    setTimeout(() => {
      const result = aiCopilotService.analyzeActiveCode(activeCode, lastError);
      setChatLogs(prev => [
        ...prev,
        {
          sender: 'user',
          text: 'Analyze my active editor code for mistakes'
        },
        {
          sender: 'ai',
          text: result.text,
          code: result.code
        }
      ]);
      setIsGenerating(false);
      hapticSuccess();
    }, 350);
  };

  const handleSendPrompt = async (textToSend) => {
    const prompt = textToSend || userPrompt;
    if (!prompt.trim() || isGenerating) return;

    hapticLight();
    const userMsg = { sender: 'user', text: prompt };
    setChatLogs(prev => [...prev, userMsg]);
    setUserPrompt('');
    setIsGenerating(true);

    setTimeout(async () => {
      const response = await aiCopilotService.generateResponse(prompt, activeCode);
      setChatLogs(prev => [
        ...prev,
        { sender: 'ai', text: response.text, code: response.code }
      ]);
      setIsGenerating(false);
      hapticSuccess();
    }, 400);
  };

  const handleExplainError = () => {
    hapticLight();
    const errAnalysis = aiCopilotService.explainError(activeCode, lastError);
    setChatLogs(prev => [
      ...prev,
      {
        sender: 'ai',
        text: `Resolution: ${errAnalysis.explanation}`,
        code: errAnalysis.fixSnippet
      }
    ]);
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
            <Settings2 className="w-4 h-4 text-sky-400" />
          </button>
          <button className="pycopilot-close-btn" onClick={onClose} title="Close Pyxi">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Download / Model Status Bar */}
      {!isCurrentModelCached && !showModelPicker && (
        <div className="pycopilot-model-bar">
          {isDownloading ? (
            <div className="pycopilot-download-progress flex flex-col w-full gap-2 p-3 bg-slate-900 rounded-lg border border-slate-700 shadow-md">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
                <Loader2 className="w-3.5 h-3.5 spin" />
                <span className="truncate">{downloadStatus || `Downloading ${activeModel.name}...`}</span>
                <span className="ml-auto flex-shrink-0">{Math.round(downloadProgress || 0)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-sky-400 h-1.5 transition-all duration-300 ease-out" 
                  style={{ width: `${Math.round(downloadProgress || 0)}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button className="pycopilot-download-btn" onClick={() => handleDownloadModel(activeModel.id)}>
              <Download className="w-3.5 h-3.5" />
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
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="model-cards-list">
            {LOCAL_MODELS.map((model) => {
              const cached = modelCachedMap[model.id];
              const isSelected = activeModel.id === model.id;

              return (
                <div key={model.id} className={`model-card-item ${isSelected ? 'selected' : ''}`}>
                  <div className="model-card-top">
                    <div className="model-card-name-row">
                      <h5 className="model-card-title">{model.name}</h5>
                      <span className={`model-tag-pill ${model.badgeColor}`}>{model.tag}</span>
                    </div>
                    <span className="model-size-badge">{model.sizeMB} MB</span>
                  </div>

                  <p className="model-card-desc">{model.desc}</p>

                  <div className="model-card-actions">
                    {cached ? (
                      <>
                        <button 
                          className={`model-action-btn ${isSelected ? 'active' : 'primary'}`}
                          onClick={() => handleSelectModel(model.id)}
                        >
                          {isSelected ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                          <span>{isSelected ? 'Active Model' : 'Use Model'}</span>
                        </button>
                        <button className="model-delete-btn" onClick={() => handleRemoveModel(model.id)} title="Delete Model Cache">
                          <Trash2 className="w-3 h-3 text-rose-400" />
                        </button>
                      </>
                    ) : (
                      <button 
                        className="model-action-btn download"
                        onClick={() => handleDownloadModel(model.id)}
                        disabled={isDownloading}
                      >
                        <Download className="w-3 h-3" />
                        <span>Download ({model.sizeMB}MB)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Explainer Alert */}
      {lastError && !showModelPicker && (
        <div className="pycopilot-error-banner" onClick={handleExplainError}>
          <Wrench className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span>Execution error detected. Tap to generate fix.</span>
        </div>
      )}

      {/* Chat Messages Body */}
      {!showModelPicker && (
        <div className="pycopilot-messages-body">
          {chatLogs.map((msg, idx) => (
            <div key={idx} className={`pycopilot-bubble ${msg.sender}`}>
              {msg.sender === 'ai' && (
                <div className="pyxi-bubble-sender font-semibold text-xs text-sky-400 flex items-center gap-1.5 mb-1">
                  <img 
                    src="/pyxi-mascot.jpg" 
                    alt="Pyxi" 
                    className="pyxi-msg-avatar" 
                    style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
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
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button 
                        className={`code-mini-btn primary ${confirmInsertIdx === idx ? 'confirm-state' : ''}`}
                        onClick={() => handleInsertClick(msg.code, idx)}
                        title={confirmInsertIdx === idx ? "Tap again to confirm inserting into editor" : "Insert Code to Editor"}
                      >
                        {confirmInsertIdx === idx ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-300" />
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
              <div className="pycopilot-typing">
                <Loader2 className="w-3.5 h-3.5 spin text-emerald-400 inline mr-2" />
                <span>Pyxi is generating Python code...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Clean Icon Chips Row */}
      {!showModelPicker && (
        <div className="pycopilot-chips-bar">
          <button className="mini-chip highlight-chip" onClick={handleAnalyzeCode} title="Analyze active editor code for mistakes">
            <Search className="w-3 h-3 text-sky-400 inline mr-1" />
            <span>Analyze Code</span>
          </button>
          <button className="mini-chip" onClick={() => handleSendPrompt("Pandas CSV Data Analysis")}>
            <BarChart2 className="w-3 h-3 text-sky-400 inline mr-1" />
            <span>Pandas</span>
          </button>
          <button className="mini-chip" onClick={() => handleSendPrompt("Seaborn Scatter Chart")}>
            <LineChart className="w-3 h-3 text-emerald-400 inline mr-1" />
            <span>Seaborn</span>
          </button>
          <button className="mini-chip" onClick={() => handleSendPrompt("Python Loop Examples")}>
            <Repeat className="w-3 h-3 text-amber-400 inline mr-1" />
            <span>Loop</span>
          </button>
          <button className="mini-chip" onClick={() => handleSendPrompt("Write Python Metrics Function")}>
            <Zap className="w-3 h-3 text-purple-400 inline mr-1" />
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
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
