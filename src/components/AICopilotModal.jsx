import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Download, 
  Sparkles, 
  Check, 
  Copy, 
  Send, 
  Code2, 
  Wrench,
  Loader2,
  Cpu,
  Minimize2
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

  const [userPrompt, setUserPrompt] = useState('');
  const [chatLogs, setChatLogs] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your PyPhone AI Coding Assistant. Ask me to write code, create charts, or explain errors.',
      code: `# Ask me:\n# "Write a function to calculate averages"\n# "Create a Seaborn plot"`
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function checkStatus() {
      const cached = await aiCopilotService.checkModelCached();
      setIsCached(cached);
    }
    if (isOpen) checkStatus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs, isGenerating]);

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
    <div className="ai-chatbot-drawer">
      {/* Dark Chatbot Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-title">
          <div className="ai-status-dot-icon">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="chatbot-title">AI Coding Assistant</h4>
            <span className="chatbot-subtitle">WebGPU Local AI · Private</span>
          </div>
        </div>

        <button className="chatbot-close-btn" onClick={onClose} title="Minimize Chatbot">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Model Download Bar (if not downloaded) */}
      {!isCached && (
        <div className="chatbot-model-bar">
          {isDownloading ? (
            <div className="chatbot-download-progress">
              <Loader2 className="w-3.5 h-3.5 spin text-amber-400" />
              <span>{downloadStatus || `Downloading model (${downloadProgress}%)`}</span>
            </div>
          ) : (
            <button className="chatbot-download-btn" onClick={handleDownloadModel}>
              <Download className="w-3.5 h-3.5" />
              <span>Download Local Model (90MB)</span>
            </button>
          )}
        </div>
      )}

      {/* Error Explainer Alert (if execution error present) */}
      {lastError && (
        <div className="chatbot-error-banner" onClick={handleExplainError}>
          <Wrench className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span>Error detected! Tap to analyze &amp; get 1-tap fix.</span>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="chatbot-messages-body">
        {chatLogs.map((msg, idx) => (
          <div key={idx} className={`chatbot-bubble ${msg.sender}`}>
            <p className="bubble-txt">{msg.text}</p>

            {msg.code && (
              <div className="chatbot-code-box">
                <div className="code-box-toolbar">
                  <span className="code-lang-label">python</span>
                  <div className="code-box-actions">
                    <button 
                      className="code-mini-btn"
                      onClick={() => handleCopySnippet(msg.code, idx)}
                    >
                      {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>

                    <button 
                      className="code-mini-btn primary"
                      onClick={() => handleInsertSnippet(msg.code)}
                      title="Insert to Editor"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>Insert</span>
                    </button>
                  </div>
                </div>
                <pre className="code-snippet-pre"><code>{msg.code}</code></pre>
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="chatbot-bubble ai">
            <div className="chatbot-typing">
              <Loader2 className="w-3.5 h-3.5 spin text-emerald-400 inline mr-2" />
              <span>Generating Python code...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Row */}
      <div className="chatbot-chips-bar">
        <button className="mini-chip" onClick={() => handleSendPrompt("Pandas CSV Data Analysis")}>
          📊 Pandas
        </button>
        <button className="mini-chip" onClick={() => handleSendPrompt("Seaborn Scatter Chart")}>
          🎨 Seaborn
        </button>
        <button className="mini-chip" onClick={() => handleSendPrompt("Python Loop Examples")}>
          🔄 Loop
        </button>
        <button className="mini-chip" onClick={() => handleSendPrompt("Write Python Metrics Function")}>
          ⚡ Function
        </button>
      </div>

      {/* Input Bar */}
      <div className="chatbot-input-bar">
        <input
          type="text"
          className="chatbot-input"
          placeholder="Ask Python AI question..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendPrompt();
          }}
        />
        <button 
          className="chatbot-send-btn"
          onClick={() => handleSendPrompt()}
          disabled={isGenerating || !userPrompt.trim()}
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
