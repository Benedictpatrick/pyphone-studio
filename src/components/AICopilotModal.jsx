import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Download, 
  Sparkles, 
  Check, 
  Copy, 
  Send, 
  Trash2, 
  AlertCircle, 
  Code2, 
  Wrench,
  Loader2,
  Cpu
} from 'lucide-react';
import { hapticLight, hapticSuccess } from '../utils/haptics';
import { aiCopilotService } from '../services/aiCopilotService';

export default function AICopilotModal({
  isOpen,
  onClose,
  activeCode = '',
  lastError = null,
  onInsertCode
}) {
  const [isCached, setIsCached] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'fix' | 'model'
  const [userPrompt, setUserPrompt] = useState('');
  const [chatLogs, setChatLogs] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Local WebGPU Python AI Assistant. Ask me to write code, build data science charts, or explain errors 100% offline.',
      code: `# Try asking:\n# "Write a function to calculate averages"\n# "Create a Seaborn scatter plot"`
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Check model download status on mount
  useEffect(() => {
    async function checkStatus() {
      const cached = await aiCopilotService.checkModelCached();
      setIsCached(cached);
    }
    if (isOpen) checkStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadModel = async () => {
    hapticLight();
    setIsDownloading(true);
    await aiCopilotService.downloadModel(({ progress, message }) => {
      setDownloadProgress(progress);
      setDownloadStatus(message);
    });
    setIsDownloading(false);
    setIsCached(true);
    hapticSuccess();
  };

  const handleRemoveModel = async () => {
    hapticLight();
    if (window.confirm("Remove downloaded Local AI model weights from browser storage?")) {
      await aiCopilotService.removeModel();
      setIsCached(false);
    }
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
        text: `🛠️ ${errAnalysis.explanation}`,
        code: errAnalysis.fixSnippet
      }
    ]);
    setActiveTab('chat');
  };

  const handleCopySnippet = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleInsertSnippet = (codeText) => {
    hapticLight();
    onInsertCode?.(codeText);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card ai-copilot-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="ai-badge-icon">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="modal-title">Local AI Coding Assistant</h3>
              <div className="modal-subtitle-row">
                <span className="offline-gpu-badge">
                  <Cpu className="w-3 h-3 inline mr-1" /> WebGPU Local Model
                </span>
                <span className="privacy-badge">100% Offline & Private</span>
              </div>
            </div>
          </div>
          <button className="icon-only-btn close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Model Download Banner */}
        {!isCached && (
          <div className="ai-download-banner">
            <div className="banner-left">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <h4 className="banner-title">Download Optional Local AI Model (90 MB)</h4>
                <p className="banner-desc">Runs 100% inside your browser on GPU. Zero server costs, zero API keys.</p>
              </div>
            </div>

            {isDownloading ? (
              <div className="download-progress-box">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${downloadProgress}%` }} />
                </div>
                <span className="download-status-text">{downloadStatus}</span>
              </div>
            ) : (
              <button className="framer-btn-primary download-model-btn" onClick={handleDownloadModel}>
                <Download className="w-4 h-4" />
                <span>Download Model (90MB)</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="ai-modal-tabs">
          <button 
            className={`ai-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Bot className="w-4 h-4 mr-1.5" />
            <span>AI Copilot Chat</span>
          </button>
          
          {lastError && (
            <button 
              className={`ai-tab-btn ${activeTab === 'fix' ? 'active' : ''}`}
              onClick={handleExplainError}
            >
              <Wrench className="w-4 h-4 mr-1.5 text-rose-400" />
              <span>Explain Error</span>
            </button>
          )}

          <button 
            className={`ai-tab-btn ${activeTab === 'model' ? 'active' : ''}`}
            onClick={() => setActiveTab('model')}
          >
            <Cpu className="w-4 h-4 mr-1.5" />
            <span>Model Settings</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="ai-modal-body">
          {activeTab === 'chat' && (
            <div className="ai-chat-container">
              
              {/* Quick Prompt Chips */}
              <div className="quick-prompts-row">
                <button className="prompt-chip" onClick={() => handleSendPrompt("Pandas CSV Data Analysis")}>
                  📊 Pandas CSV
                </button>
                <button className="prompt-chip" onClick={() => handleSendPrompt("Seaborn Scatter Chart")}>
                  🎨 Seaborn Chart
                </button>
                <button className="prompt-chip" onClick={() => handleSendPrompt("Python For Loop Examples")}>
                  🔄 Loop Example
                </button>
                <button className="prompt-chip" onClick={() => handleSendPrompt("Write Python Metrics Function")}>
                  ⚡ Function
                </button>
              </div>

              {/* Chat Logs Scroll Area */}
              <div className="chat-messages-scroll">
                {chatLogs.map((msg, idx) => (
                  <div key={idx} className={`chat-message-bubble ${msg.sender}`}>
                    <div className="bubble-header">
                      {msg.sender === 'ai' ? (
                        <span className="sender-tag ai"><Bot className="w-3.5 h-3.5 inline mr-1" /> Local AI</span>
                      ) : (
                        <span className="sender-tag user">You</span>
                      )}
                    </div>

                    <p className="bubble-text">{msg.text}</p>

                    {msg.code && (
                      <div className="ai-code-card">
                        <div className="code-card-header">
                          <span className="code-lang">python</span>
                          <div className="code-card-actions">
                            <button 
                              className="code-action-btn"
                              onClick={() => handleCopySnippet(msg.code, idx)}
                            >
                              {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button 
                              className="code-action-btn primary"
                              onClick={() => handleInsertSnippet(msg.code)}
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              <span>Insert to Editor</span>
                            </button>
                          </div>
                        </div>
                        <pre className="ai-code-block"><code>{msg.code}</code></pre>
                      </div>
                    )}
                  </div>
                ))}

                {isGenerating && (
                  <div className="chat-message-bubble ai">
                    <div className="typing-indicator">
                      <Loader2 className="w-4 h-4 spin text-emerald-400 inline mr-2" />
                      <span>Local AI is generating Python solution...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Prompt Input Line */}
              <div className="ai-input-bar">
                <input
                  type="text"
                  className="ai-prompt-input"
                  placeholder="Ask Local AI to write Python code or explain concepts..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendPrompt();
                  }}
                />
                <button 
                  className="framer-btn-primary send-prompt-btn"
                  onClick={() => handleSendPrompt()}
                  disabled={isGenerating || !userPrompt.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="model-settings-container">
              <div className="setting-card">
                <div className="setting-info">
                  <h4 className="setting-title">Local WebGPU Inference Model</h4>
                  <p className="setting-desc">SmolLM-135M / Qwen2.5-Coder quantized 4-bit weights (~90 MB).</p>
                </div>
                <div className="setting-status">
                  {isCached ? (
                    <span className="status-badge-active">Installed & Cached</span>
                  ) : (
                    <span className="status-badge-inactive">Not Downloaded</span>
                  )}
                </div>
              </div>

              <div className="model-actions-row">
                {!isCached ? (
                  <button className="framer-btn-primary full-width-btn" onClick={handleDownloadModel}>
                    <Download className="w-4 h-4" />
                    <span>Download Model Weights (90MB)</span>
                  </button>
                ) : (
                  <button className="framer-btn-danger full-width-btn" onClick={handleRemoveModel}>
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Downloaded Model Cache</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
