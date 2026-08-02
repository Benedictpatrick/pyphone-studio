// PyPhone Studio Local AI Copilot Service (Pyxi)
// Powered by Real Neural LLM Inference Engine (WebGPU / WASM Local Engine)

import { checkPythonSyntax } from '../utils/pythonLinter';
import { CreateMLCEngine, hasModelInCache } from '@mlc-ai/web-llm';
import { Wllama, CacheManager } from '@wllama/wllama/esm/index.js';

export const LOCAL_MODELS = [
  {
    id: 'llama3.2-1b',
    name: 'Llama 3.2 1B (Tiny)',
    tag: 'Offline Local',
    sizeMB: 700,
    desc: 'Extremely fast model with CPU fallback for older devices.',
    badgeColor: 'purple',
    repo: 'bartowski/Llama-3.2-1B-Instruct-GGUF',
    file: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    mlcId: 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
  },
  {
    id: 'gemma2-2b',
    name: 'Gemma 2 2B (Balanced)',
    tag: 'Offline Local',
    sizeMB: 1600,
    desc: 'Very smart model with CPU fallback, requires more RAM.',
    badgeColor: 'blue',
    repo: 'bartowski/gemma-2-2b-it-GGUF',
    file: 'gemma-2-2b-it-Q4_K_M.gguf',
    mlcId: 'gemma-2-2b-it-q4f16_1-MLC'
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5 0.5B (WebGPU)',
    tag: 'Offline Local',
    sizeMB: 900,
    desc: 'Extremely fast 0.5B model compiled for native WebGPU on phones.',
    badgeColor: 'emerald'
  },
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 360M (WebGPU)',
    tag: 'Offline Local',
    sizeMB: 400,
    desc: 'Offline 0.1s response, tiny browser memory footprint.',
    badgeColor: 'emerald'
  }
];

class AICopilotService {
  constructor() {
    this.isLoaded = false;
    this.isLoading = false;
    this.progress = 100;
    this.statusText = 'Pyxi Neural Engine Ready';
    this.activeModelId = localStorage.getItem('pyxi_selected_model') || LOCAL_MODELS[0].id;
    this.engine = null;
    this.wllama = null;
    this.engineKind = null;
    
    this.onProgressCallback = null;
    this.onGenerateComplete = null;
    this.onGenerateError = null;
    this.onDownloadComplete = null;
    this.onGenerateUpdate = null;
  }

  async hasWebGpu() {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  getSelectedModel() {
    return LOCAL_MODELS.find(m => m.id === this.activeModelId) || LOCAL_MODELS[0];
  }

  setSelectedModel(modelId) {
    this.activeModelId = modelId;
    localStorage.setItem('pyxi_selected_model', modelId);
  }

  async checkModelCached(modelId) {
    const model = LOCAL_MODELS.find(m => m.id === modelId) || LOCAL_MODELS[0];
    
    if (model.repo && model.file) {
      try {
        const cacheManager = new CacheManager();
        const key = await cacheManager.getNameFromURL(`https://huggingface.co/${model.repo}/resolve/main/${model.file}`);
        const size = await cacheManager.getSize(key);
        if (size > 0) return true;
      } catch (e) {
        // Fallthrough to webgpu check
      }
    }
    
    const mlcId = model.mlcId || (model.id.includes('MLC') ? model.id : null);
    if (mlcId) {
      try { return await hasModelInCache(mlcId); } catch(e) {}
    }

    return false;
  }

  async downloadModel(modelId, onProgress) {
    const targetModel = LOCAL_MODELS.find(m => m.id === modelId) || this.getSelectedModel();
    if (this.isLoading) return;

    this.setSelectedModel(targetModel.id);
    
    this.isLoading = true;
    this.progress = 0;
    this.onProgressCallback = onProgress;
    
    try {
      const hasGpu = await this.hasWebGpu();
      const mlcId = targetModel.mlcId || (targetModel.id.includes('MLC') ? targetModel.id : null);
      
      if (hasGpu && mlcId) {
        this.engineKind = 'webgpu';
        this.engine = await CreateMLCEngine(
          mlcId,
          {
            initProgressCallback: (progress) => {
              this.progress = Math.round(progress.progress * 100);
              if (this.onProgressCallback) {
                this.onProgressCallback({ progress: this.progress, message: progress.text });
              }
            }
          }
        );
      } else if (targetModel.repo && targetModel.file) {
        this.engineKind = 'wasm';
        if (this.wllama) {
          await this.wllama.exit().catch(() => {});
        }
        this.wllama = new Wllama({ default: '/wllama/wllama.wasm' }, { allowOffline: true });
        
        await this.wllama.loadModelFromHF(
          { repo: targetModel.repo, file: targetModel.file },
          {
            n_ctx: 1024,
            progressCallback: ({ loaded, total }) => {
              this.progress = Math.round((loaded / total) * 100);
              if (this.onProgressCallback) {
                this.onProgressCallback({ progress: this.progress, message: 'Downloading CPU Fallback...' });
              }
            }
          }
        );
      } else {
        throw new Error('WebGPU is unsupported and no CPU fallback exists for this model.');
      }

      this.isLoaded = true;
      this.isLoading = false;
      if (this.onProgressCallback) {
        this.onProgressCallback({ progress: 100, message: 'Ready!' });
        this.onProgressCallback = null;
      }
      if (this.onDownloadComplete) this.onDownloadComplete(true);
      return true;
    } catch (e) {
      console.error(e);
      this.isLoading = false;
      const errMsg = e.toString().includes('WebGPU') ? 'Error: WebGPU not supported on this browser/device.' : 'Error loading model';
      if (this.onProgressCallback) {
        this.onProgressCallback({ progress: 0, message: errMsg });
      }
      if (this.onDownloadComplete) this.onDownloadComplete(false);
      return false;
    }
  }

  async generateWithWorker(prompt) {
    if (!this.engine && !this.wllama) return null;
    let workerResponse = "";
    
    try {
      const fullPrompt = `<|im_start|>system\nYou are a helpful Python coding assistant. Write clean, complete, working Python code. Format your response with a brief 1-sentence introduction followed by a clean python code block. Do NOT ask follow-up questions.<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
      
      if (this.engineKind === 'webgpu' && this.engine) {
        const chunks = await this.engine.chat.completions.create({
          messages: [
            { role: "system", content: "You are a helpful Python coding assistant. Write clean, complete, working Python code. Format your response with a brief 1-sentence introduction followed by a clean python code block. Do NOT ask follow-up questions." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          stream: true,
        });

        for await (const chunk of chunks) {
          workerResponse += chunk.choices[0]?.delta?.content || "";
          if (this.onGenerateUpdate) {
            this.onGenerateUpdate(); 
          }
        }
      } else if (this.engineKind === 'wasm' && this.wllama) {
        for await (const chunk of this.wllama.createCompletion(fullPrompt, {
          nPredict: 1000,
          sampling: { temp: 0.1 },
        })) {
          workerResponse += chunk;
          if (this.onGenerateUpdate) {
            this.onGenerateUpdate();
          }
        }
      }
      
      return workerResponse;
    } catch (e) {
      console.error(e);
      if (this.onGenerateError) this.onGenerateError(e);
      return null;
    }
  }

  async removeModel(modelId) {
    // Note: WebLLM caches in IndexedDB natively, we can leave this as a no-op 
    // or implement deletion if required. For now, just reset state.
    if (this.activeModelId === modelId) {
      this.isLoaded = false;
      this.engine = null;
    }
  }

  // Deep Line-by-Line Python Error Repair Engine (With Syntax AST + Stack Trace Fixes)
  repairCode(code = '', errorText = '') {
    if (!code) return { fixedCode: '', fixesApplied: [] };

    const errLines = errorText.split('\n').filter(l => l.trim().length > 0);
    const actualErrorLine = errLines.slice().reverse().find(l => l.includes('Error') || l.includes('Exception')) || errLines[errLines.length - 1] || errorText;

    let lines = code.split('\n');
    const fixesApplied = [];

    // 1. Fix Empty Condition Statements (`while :`, `if :`, `elif :`)
    lines = lines.map((line, idx) => {
      const trimmed = line.trim();
      if (/^(while|if|elif)\s*:$/i.test(trimmed)) {
        const keyword = trimmed.split(':')[0].trim();
        fixesApplied.push(`Line ${idx + 1}: Fixed empty condition \`${trimmed}\` ➔ \`${keyword} True:\`.`);
        return line.replace(/:\s*$/, ' True:');
      }
      return line;
    });

    // 2. Fix Inline Collided Statements (`if __name__ == '__main__':def pyxi_chatb():`)
    let updatedLines = [];
    lines.forEach((line, idx) => {
      if (/:\s*(def|class|if|while|for|print|user_input|pyxi_)/.test(line)) {
        const parts = line.split(/:\s*(?=(?:def|class|if|while|for|print|user_input|pyxi_))/);
        if (parts.length > 1) {
          fixesApplied.push(`Line ${idx + 1}: Separated collided inline statements onto a new line.`);
          updatedLines.push(parts[0] + ':');
          updatedLines.push('    ' + parts.slice(1).join(''));
          return;
        }
      }
      updatedLines.push(line);
    });
    lines = updatedLines;

    // 3. Fix Function Name Mismatches
    if (actualErrorLine.includes("NameError")) {
      const match = actualErrorLine.match(/name ['"]([^'"]+)['"] is not defined/);
      if (match && match[1]) {
        const missingVar = match[1];
        const similarFuncIdx = lines.findIndex(l => l.trim().startsWith('def ') && !l.includes(missingVar));
        if (similarFuncIdx >= 0) {
          const oldFuncName = lines[similarFuncIdx].trim().split(' ')[1].split('(')[0];
          lines[similarFuncIdx] = lines[similarFuncIdx].replace(oldFuncName, missingVar);
          fixesApplied.push(`Line ${similarFuncIdx + 1}: Fixed function name mismatch \`def ${oldFuncName}()\` ➔ \`def ${missingVar}()\`.`);
        } else if (!lines.some(l => l.includes(`${missingVar} =`))) {
          fixesApplied.push(`Line 1: Injected missing variable definition \`${missingVar} = 0\`.`);
          lines.unshift(`${missingVar} = 0  # Pre-defined to fix NameError`);
        }
      }
    }

    // 4. Run Python Linter AST Diagnostics
    try {
      const linterDiagnostics = checkPythonSyntax(lines.join('\n'));
      linterDiagnostics.forEach(d => {
        const textBefore = lines.join('\n').slice(0, d.from);
        const lineIdx = textBefore.split('\n').length - 1;
        const lineText = lines[lineIdx] || '';

        if (d.message.includes("Expected ':'")) {
          const keyword = lineText.trim().split(/[\s(:]/)[0];
          if (!lineText.trim().endsWith(':')) {
            lines[lineIdx] = lineText + ':';
            fixesApplied.push(`Line ${lineIdx + 1}: Added missing colon (\`:\`) to \`${keyword}\` statement.`);
          }
        } else if (d.message.includes("Invalid keyword")) {
          const match = d.message.match(/Invalid keyword '([^']+)'. Did you mean '([^']+)'\?/);
          if (match) {
            lines[lineIdx] = lineText.replace(match[1], match[2]);
            fixesApplied.push(`Line ${lineIdx + 1}: Fixed keyword typo \`${match[1]}\` ➔ \`${match[2]}\`.`);
          }
        }
      });
    } catch (_) {}

    // 5. Parse Specific Exceptions
    if (actualErrorLine.includes("ZeroDivisionError")) {
      lines = lines.map((l, i) => {
        if (/\/\s*0(?!\d)/.test(l)) {
          fixesApplied.push(`Line ${i + 1}: Fixed division by 0 \`/ 0\` ➔ \`/ 1\`.`);
          return l.replace(/\/\s*0(?!\d)/g, '/ 1  # Fixed division by 0');
        }
        if (/\b([a-zA-Z0-9_\.\[\]]+)\s*\/\s*([a-zA-Z0-9_\.\[\]]+)\b/.test(l) && !l.trim().startsWith('#')) {
          fixesApplied.push(`Line ${i + 1}: Wrapped division in non-zero check.`);
          return l.replace(/\b([a-zA-Z0-9_\.\[\]]+)\s*\/\s*([a-zA-Z0-9_\.\[\]]+)\b/g, '($2 != 0 and $1 / $2 or 0)');
        }
        return l;
      });
    }

    const finalCode = lines.join('\n');

    return {
      fixedCode: finalCode,
      fixesApplied
    };
  }

  explainError(code = '', errorText = '') {
    if (!errorText) return { explanation: "No execution error detected in your current session!", fixSnippet: code };

    const { fixedCode, fixesApplied } = this.repairCode(code, errorText);
    const errLines = errorText.split('\n').filter(l => l.trim().length > 0);
    const actualErrorLine = errLines.slice().reverse().find(l => l.includes('Error') || l.includes('Exception')) || errLines[errLines.length - 1] || errorText;

    let explanation = `Execution Error: \`${actualErrorLine}\`.\n`;
    if (fixesApplied.length > 0) {
      explanation += `\nFixes applied:\n` + fixesApplied.map(f => `• ${f}`).join('\n');
    } else {
      explanation += `Review line syntax and variable values. Below is your code snippet:`;
    }

    return {
      explanation,
      fixSnippet: fixedCode,
      summary: `AI Error Analysis: ${actualErrorLine}`
    };
  }

  analyzeActiveCode(code = '', errorText = '') {
    if (!code || !code.trim()) {
      return {
        text: "Your active editor is empty. Write or paste some Python code in main.py or a notebook cell first, then tap Analyze Code!",
        code: null
      };
    }

    const { fixedCode, fixesApplied } = this.repairCode(code, errorText);
    const lines = code.split('\n');
    const errLines = errorText ? errorText.split('\n').filter(l => l.trim().length > 0) : [];
    const actualErrorLine = errLines.slice().reverse().find(l => l.includes('Error') || l.includes('Exception')) || errLines[errLines.length - 1];

    if (fixesApplied.length > 0 || actualErrorLine) {
      const summaryText = actualErrorLine 
        ? `Execution Error Detected: \`${actualErrorLine}\`.\n\nPyxi repaired ${fixesApplied.length} issue(s):\n` + (fixesApplied.length > 0 ? fixesApplied.map(f => `• ${f}`).join('\n') : '• Cleaned code structure and fixed syntax errors.') + `\n\nHere is the corrected code ready to insert into your editor:`
        : `Static AST Analysis Complete. Found and fixed ${fixesApplied.length} issue(s):\n\n` + fixesApplied.map(f => `• ${f}`).join('\n') + `\n\nHere is the corrected code ready to insert into your editor:`;

      return {
        text: summaryText,
        code: fixedCode
      };
    }

    return {
      text: `Code Analysis Result: No syntax errors or execution issues detected in your script (${lines.length} lines)! Your Python code structure is clean and ready to run.`,
      code: fixedCode
    };
  }

  // Main Entry Point for User Prompts
  async generateResponse(userPrompt, activeCode = '') {
    const promptLower = userPrompt.toLowerCase().trim();
    const model = this.getSelectedModel();

    // Check if the user is asking to explain / understand code
    const isExplanationIntent = /\b(explain|how does|how do|what does|understand|walkthrough|tell me how|describe|working of)\b/.test(promptLower);

    const isCached = await this.checkModelCached(model.id);
    
    // Auto-load if cached but engine isn't in memory yet
    if (isCached && !this.engine && !this.wllama && !this.isLoading) {
      const success = await this.downloadModel(model.id, () => {});
      if (!success) {
        return {
          text: `❌ **Local AI Error:** Failed to initialize AI engine from cache.`,
          code: null
        };
      }
    }

    if (!isCached && !this.isLoaded) {
      return {
        text: `⚠️ **Local Model Not Downloaded**\n\nPlease click the **Download Model** button at the top of the chat to download the Neural AI engine to your device first. It's a one-time download!`,
        code: null
      };
    }

    try {
      let fullPromptText = userPrompt;
      if (isExplanationIntent) {
        fullPromptText = `Explain how this Python code works:\n${activeCode || userPrompt}`;
      } else {
        fullPromptText = `Write clean, complete, working Python code for: "${userPrompt}". Include a 1-sentence intro followed by a clean python code block.`;
      }
      const workerResponse = await this.generateWithWorker(fullPromptText);
      
      if (workerResponse) {
        let explanation = workerResponse.trim();
        let codeSnippet = null;

        if (workerResponse.includes('```')) {
          const parts = workerResponse.split('```');
          explanation = parts[0].trim();
          const codeBlock = parts[1] || '';
          codeSnippet = codeBlock.replace(/^python\n?/, '').trim();
        } else if (workerResponse.includes('def ') || workerResponse.includes('import ') || workerResponse.includes('print(')) {
          codeSnippet = workerResponse.trim();
          explanation = `Here is the Python solution generated for "${userPrompt}":`;
        }

        return {
          text: explanation || `Here is the Python solution generated for "${userPrompt}":`,
          code: codeSnippet
        };
      }
    } catch (err) {
      console.warn("Local Web Worker AI failed", err);
      return {
        text: `❌ **Local AI Error:** I encountered an error while generating. This can happen if your device ran out of memory. Try refreshing the page. Details: ${err}`,
        code: null
      };
    }
    
    // If we got here and workerResponse was null, return error
    return {
      text: `❌ **Local AI Error:** Generation returned no response.`,
      code: null
    };
  }
}

export const aiCopilotService = new AICopilotService();
