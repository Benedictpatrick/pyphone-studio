import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  X, 
  Download, 
  Check, 
  Copy, 
  Send, 
  Code2, 
  Wrench,
  Loader2,
  Cpu,
  BarChart2,
  LineChart,
  Repeat,
  Zap
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
      text: 'PyCopilot initialized. Ask for Python scripts, data processing functions, or error resolution.',
      code: `# Examples:\n# "Write a function to process CSV data"\n# "Create a Seaborn plot"`
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

  const handleInsertSnippet = (codeText) => {
    hapticLight();
    onInsertCode?.(codeText);
    onClose();
  };

  return (
    <div className="pycopilot-drawer">
      {/* Header */}
      <div className="pycopilot-header">
        <div className="pycopilot-header-title">
          <div className="pycopilot-icon-badge">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="pycopilot-title">PyCopilot</h4>
            <span className="pycopilot-subtitle">Local Python Engine · Offline</span>
          </div>
        </div>

        <button className="pycopilot-close-btn" onClick={onClose} title="Close PyCopilot">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Model Download Bar (if not downloaded) */}
      {!isCached && (
        <div className="pycopilot-model-bar">
          {isDownloading ? (
            <div className="pycopilot-download-progress">
              <Loader2 className="w-3.5 h-3.5 spin text-sky-400" />
              <span>{downloadStatus || `Downloading model (${downloadProgress}%)`}</span>
            </div>
          ) : (
            <button className="pycopilot-download-btn" onClick={handleDownloadModel}>
              <Download className="w-3.5 h-3.5" />
              <span>Download Local Model (90MB)</span>
            </button>
          )}
        </div>
      )}

      {/* Error Explainer Alert (if execution error present) */}
      {lastError && (
        <div className="pycopilot-error-banner" onClick={handleExplainError}>
          <Wrench className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span>Execution error detected. Tap to generate fix.</span>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="pycopilot-messages-body">
        {chatLogs.map((msg, idx) => (
          <div key={idx} className={`pycopilot-bubble ${msg.sender}`}>
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
          <div className="pycopilot-bubble ai">
            <div className="pycopilot-typing">
              <Loader2 className="w-3.5 h-3.5 spin text-emerald-400 inline mr-2" />
              <span>Generating Python solution...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Clean Icon Chips Row */}
      <div className="pycopilot-chips-bar">
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

      {/* Input Bar */}
      <div className="pycopilot-input-bar">
        <input
          type="text"
          className="pycopilot-input"
          placeholder="Ask PyCopilot for code..."
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
    </div>
  );
}
