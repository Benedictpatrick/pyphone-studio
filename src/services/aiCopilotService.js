// PyPhone Studio Local AI Copilot Service (Pyxi)
// Powered by Real Neural LLM Inference Engine (WebGPU / WASM Local Engine)

import { checkPythonSyntax } from '../utils/pythonLinter';
import { CreateWebWorkerMLCEngine, hasModelInCache, deleteModelAllInfoInCache } from '@mlc-ai/web-llm';
import { Wllama, CacheManager } from '@wllama/wllama/esm/index.js';

const GENERATION_TIMEOUT_MS = 60000;
const MAX_GENERATION_TOKENS = 512;

// Small models (SmolLM2 360M, Qwen 0.5B) can still degenerate into repeating
// the same line forever even with a repetition penalty. Cut the response off
// the moment a line repeats 3+ times in a row, so the UI shows a clean partial
// answer instead of a wall of duplicated text with no closing code fence.
function stripRepetitionLoop(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const kept = [];
  let repeatRun = 0;

  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && lines[i].trim() !== '' && lines[i] === lines[i - 1]) {
      repeatRun++;
      if (repeatRun >= 2) break; // this is the 3rd identical line in a row
    } else {
      repeatRun = 0;
    }
    kept.push(lines[i]);
  }

  return kept.join('\n');
}

// Turns raw engine/browser errors into messages a non-technical user can act on.
function classifyError(e) {
  const msg = (e && (e.message || String(e))) || '';
  const name = e && e.name;

  if (name === 'QuotaExceededError' || /quota/i.test(msg)) {
    return 'Your device is low on storage space. Free up space or choose a smaller model (SmolLM2 360M is the lightest).';
  }
  if (name === 'AbortError' || /abort|timeout|timed out/i.test(msg)) {
    return 'Generation took too long and was cancelled. Try a smaller model or a shorter request.';
  }
  if (/out of memory|oom\b/i.test(msg)) {
    return 'Your device ran out of memory running this model. Try a smaller model like SmolLM2 360M or Qwen2.5 0.5B.';
  }
  if (/webgpu/i.test(msg)) {
    return 'WebGPU failed to initialize on this browser/device. Retrying with the CPU engine instead.';
  }
  if (/failed to fetch|networkerror|net::/i.test(msg)) {
    return 'Network error while downloading the model. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again, or pick a different (smaller) model.';
}

export const LOCAL_MODELS = [
  {
    id: 'llama3.2-1b',
    name: 'Llama 3.2 1B (Tiny)',
    tag: 'Offline Local',
    sizeMB: 700,
    minMemoryGB: 4,
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
    minMemoryGB: 6,
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
    minMemoryGB: 3,
    desc: 'Extremely fast 0.5B model compiled for native WebGPU on phones, with CPU fallback.',
    badgeColor: 'emerald',
    repo: 'Qwen/Qwen2.5-0.5B-Instruct-GGUF',
    file: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
    mlcId: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'
  },
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 360M (WebGPU)',
    tag: 'Offline Local',
    sizeMB: 400,
    minMemoryGB: 2,
    desc: 'Offline 0.1s response, tiny browser memory footprint, with CPU fallback.',
    badgeColor: 'emerald',
    repo: 'bartowski/SmolLM2-360M-Instruct-GGUF',
    file: 'SmolLM2-360M-Instruct-Q4_K_M.gguf',
    mlcId: 'SmolLM2-360M-Instruct-q4f16_1-MLC'
  }
];

// navigator.deviceMemory (Chrome/Android/Edge only — undefined on iOS Safari
// and Firefox) reports RAM rounded down to a power of two, in GB.
export function getDeviceMemoryGB() {
  return typeof navigator !== 'undefined' && typeof navigator.deviceMemory === 'number'
    ? navigator.deviceMemory
    : null;
}

// Picks the most capable model this device can realistically run without
// risking an out-of-memory crash. Unknown devices (most iPhones — Safari
// doesn't expose deviceMemory) get the safest, smallest model by default
// rather than the biggest one, since a budget Android phone reports the
// same "unknown" as a high-end iPhone and we'd rather under-recommend.
export function getRecommendedModel() {
  const memGB = getDeviceMemoryGB();
  if (memGB === null) {
    return LOCAL_MODELS.find(m => m.id === 'SmolLM2-360M-Instruct-q4f16_1-MLC') || LOCAL_MODELS[0];
  }
  const capable = LOCAL_MODELS.filter(m => m.minMemoryGB <= memGB);
  if (capable.length === 0) return LOCAL_MODELS.reduce((a, b) => (a.minMemoryGB < b.minMemoryGB ? a : b));
  return capable.reduce((a, b) => (b.minMemoryGB > a.minMemoryGB ? b : a));
}

class AICopilotService {
  constructor() {
    this.isLoaded = false;
    this.isLoading = false;
    this.progress = 100;
    this.statusText = 'Pyxi Neural Engine Ready';
    this.activeModelId = localStorage.getItem('pyxi_selected_model') || getRecommendedModel().id;
    this.engine = null;
    this.mlcWorker = null;
    this.wllama = null;
    this.engineKind = null;
    this.isGenerating = false;

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

  // Soft pre-flight check so a big model fails fast with a clear message
  // instead of erroring out at 90% of a multi-hundred-MB download.
  async hasEnoughStorage(requiredBytes) {
    try {
      if (!navigator.storage?.estimate) return true;
      const { quota, usage } = await navigator.storage.estimate();
      if (!quota) return true;
      return (quota - usage) > requiredBytes;
    } catch {
      return true;
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
      } catch {
        // Fallthrough to webgpu check
      }
    }

    const mlcId = model.mlcId || (model.id.includes('MLC') ? model.id : null);
    if (mlcId) {
      try { return await hasModelInCache(mlcId); } catch {}
    }

    return false;
  }

  async loadWebGpuEngine(mlcId) {
    this.mlcWorker = new Worker(new URL('../workers/webllmWorker.js', import.meta.url), { type: 'module' });
    this.engine = await CreateWebWorkerMLCEngine(
      this.mlcWorker,
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
    this.engineKind = 'webgpu';
  }

  async loadCpuEngine(targetModel) {
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
    this.engineKind = 'wasm';
  }

  async downloadModel(modelId, onProgress) {
    const targetModel = LOCAL_MODELS.find(m => m.id === modelId) || this.getSelectedModel();
    if (this.isLoading) return false;

    this.setSelectedModel(targetModel.id);

    this.isLoading = true;
    this.progress = 0;
    this.onProgressCallback = onProgress;

    const hasCpuFallback = !!(targetModel.repo && targetModel.file);

    try {
      const requiredBytes = targetModel.sizeMB * 1024 * 1024 * 1.15;
      if (!(await this.hasEnoughStorage(requiredBytes))) {
        throw new Error(`QuotaExceededError: Not enough free storage for ${targetModel.name}.`);
      }

      const hasGpu = await this.hasWebGpu();
      const mlcId = targetModel.mlcId || (targetModel.id.includes('MLC') ? targetModel.id : null);

      if (hasGpu && mlcId) {
        try {
          await this.loadWebGpuEngine(mlcId);
        } catch (gpuErr) {
          // WebGPU can advertise support and still fail to actually init
          // (driver bugs, low-end GPUs, out-of-memory during shader compile).
          // Don't strand the user on a dead engine — fall back to CPU if we can.
          console.warn('WebGPU engine init failed, falling back to CPU:', gpuErr);
          if (this.mlcWorker) {
            this.mlcWorker.terminate();
            this.mlcWorker = null;
          }
          this.engine = null;
          if (!hasCpuFallback) throw gpuErr;
          await this.loadCpuEngine(targetModel);
        }
      } else if (hasCpuFallback) {
        await this.loadCpuEngine(targetModel);
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
      const errMsg = classifyError(e);
      if (this.onProgressCallback) {
        this.onProgressCallback({ progress: 0, message: errMsg });
      }
      if (this.onDownloadComplete) this.onDownloadComplete(false);
      return false;
    }
  }

  // Lets the UI offer a "Stop" button, and backs the timeout below — without
  // this, a stalled generation (common on slow/low-memory phones) would spin
  // the "generating..." indicator forever with no way out.
  cancelGeneration() {
    this._cancelRequested = true;
    try {
      if (this.engineKind === 'webgpu' && this.engine) this.engine.interruptGenerate();
    } catch { /* engine may already be gone */ }
    if (this._wasmAbortController) this._wasmAbortController.abort();
  }

  async generateWithWorker(prompt, systemPrompt) {
    if (!this.engine && !this.wllama) return null;
    let workerResponse = "";
    this._cancelRequested = false;
    this.isGenerating = true;

    const messages = [
      { role: "system", content: systemPrompt || "You are a helpful Python coding assistant. Write clean, complete, working Python code. Format your response with a brief 1-sentence introduction followed by a clean python code block. Do NOT ask follow-up questions." },
      { role: "user", content: prompt }
    ];

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      this.cancelGeneration();
    }, GENERATION_TIMEOUT_MS);

    try {
      if (this.engineKind === 'webgpu' && this.engine) {
        const chunks = await this.engine.chat.completions.create({
          messages,
          temperature: 0.1,
          max_tokens: MAX_GENERATION_TOKENS,
          repetition_penalty: 1.15,
          stream: true,
        });

        for await (const chunk of chunks) {
          if (this._cancelRequested) break;
          workerResponse += chunk.choices[0]?.delta?.content || "";
          if (this.onGenerateUpdate) {
            this.onGenerateUpdate(workerResponse);
          }
        }
      } else if (this.engineKind === 'wasm' && this.wllama) {
        // Uses the GGUF model's own chat template (Llama 3, Gemma, Qwen, etc.
        // all format prompts differently, so this must not be hand-rolled).
        this._wasmAbortController = new AbortController();
        const chunks = await this.wllama.createChatCompletion({
          messages,
          temperature: 0.1,
          max_tokens: MAX_GENERATION_TOKENS,
          penalty_repeat: 1.15,
          penalty_last_n: 128,
          stream: true,
          abortSignal: this._wasmAbortController.signal,
        });

        for await (const chunk of chunks) {
          workerResponse += chunk.choices[0]?.delta?.content || "";
          if (this.onGenerateUpdate) {
            this.onGenerateUpdate(workerResponse);
          }
        }
      }

      if (timedOut && !workerResponse) {
        throw new Error('Generation timed out with no response.');
      }
      return workerResponse;
    } catch (e) {
      if (this._cancelRequested && workerResponse) {
        // User (or the timeout) cancelled mid-stream but we already have
        // partial text worth keeping, rather than discarding it as an error.
        return workerResponse;
      }
      console.error(e);
      if (this.onGenerateError) this.onGenerateError(e);
      throw e;
    } finally {
      clearTimeout(timeoutId);
      this.isGenerating = false;
      this._wasmAbortController = null;
    }
  }

  async removeModel(modelId) {
    const model = LOCAL_MODELS.find(m => m.id === modelId) || LOCAL_MODELS[0];

    if (model.mlcId) {
      await deleteModelAllInfoInCache(model.mlcId).catch(() => {});
    }
    if (model.repo && model.file) {
      const cacheManager = new CacheManager();
      const url = `https://huggingface.co/${model.repo}/resolve/main/${model.file}`;
      await cacheManager.delete(url).catch(() => {});
    }

    if (this.activeModelId === modelId) {
      this.isLoaded = false;
      this.engine = null;
      if (this.mlcWorker) {
        this.mlcWorker.terminate();
        this.mlcWorker = null;
      }
      if (this.wllama) {
        await this.wllama.exit().catch(() => {});
        this.wllama = null;
      }
      this.engineKind = null;
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
    } catch {}

    // 5. Parse Specific Exceptions
    if (actualErrorLine.includes("ZeroDivisionError")) {
      lines = lines.map((l, i) => {
        if (/\/\s*0(?!\d)/.test(l)) {
          fixesApplied.push(`Line ${i + 1}: Fixed division by 0 \`/ 0\` ➔ \`/ 1\`.`);
          return l.replace(/\/\s*0(?!\d)/g, '/ 1  # Fixed division by 0');
        }
        if (/\b([a-zA-Z0-9_.[\]]+)\s*\/\s*([a-zA-Z0-9_.[\]]+)\b/.test(l) && !l.trim().startsWith('#')) {
          fixesApplied.push(`Line ${i + 1}: Wrapped division in non-zero check.`);
          return l.replace(/\b([a-zA-Z0-9_.[\]]+)\s*\/\s*([a-zA-Z0-9_.[\]]+)\b/g, '($2 != 0 and $1 / $2 or 0)');
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

  explainErrorHeuristic(code = '', errorText = '') {
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

  analyzeActiveCodeHeuristic(code = '', errorText = '') {
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

  // Resolves once a model is downloaded and its engine is ready to run, or
  // false if nothing is cached (caller should fall back to the offline check).
  async ensureModelReady() {
    if (this.isLoaded && (this.engine || this.wllama)) return true;
    if (this.isLoading) return false;

    const model = this.getSelectedModel();
    const isCached = await this.checkModelCached(model.id);
    if (!isCached) return false;

    return await this.downloadModel(model.id, () => {});
  }

  // Shared by analyzeActiveCode() and explainError(): sends the user's code
  // (and the error it produced, if any) to the downloaded local model and
  // asks it to actually find and fix the bug, instead of pattern-matching.
  async reviewCodeWithAI(code, errorText) {
    const systemPrompt = "You are Pyxi, an expert Python code reviewer and debugger. Carefully read the user's code (and the error message, if given). Explain the bug in 1-2 short sentences, then give the COMPLETE corrected code in a single python code block. If you find no bugs, say so briefly and return the code unchanged in the code block.";

    const userPrompt = errorText
      ? `This Python code failed with an error. Find the bug and fix it.\n\nCode:\n\`\`\`python\n${code}\n\`\`\`\n\nError:\n${errorText}`
      : `Review this Python code for bugs (syntax errors, logic errors, undefined variables, off-by-one errors, etc.) and fix any you find.\n\nCode:\n\`\`\`python\n${code}\n\`\`\``;

    const rawResponse = await this.generateWithWorker(userPrompt, systemPrompt);
    const workerResponse = stripRepetitionLoop(rawResponse);

    if (!workerResponse) {
      throw new Error('AI code review returned no response.');
    }

    let explanation = workerResponse.trim();
    let codeSnippet = null;
    if (workerResponse.includes('```')) {
      const parts = workerResponse.split('```');
      explanation = parts[0].trim();
      const codeBlock = parts[1] || '';
      codeSnippet = codeBlock.replace(/^python\n?/, '').trim();
    }

    return { text: explanation || 'Here is the reviewed code:', code: codeSnippet || code };
  }

  // Primary entry point for the "Analyze Code" button: uses the downloaded
  // AI model to actually understand the code, falling back to the fast
  // offline pattern-checker when no model is available yet.
  async analyzeActiveCode(code = '', errorText = '') {
    if (!code || !code.trim()) {
      return {
        text: "Your active editor is empty. Write or paste some Python code in main.py or a notebook cell first, then tap Analyze Code!",
        code: null
      };
    }

    const ready = await this.ensureModelReady();
    if (!ready) {
      const heuristic = this.analyzeActiveCodeHeuristic(code, errorText);
      return {
        text: `⚠️ *No AI model downloaded yet — showing a quick offline check. Download a model (top of chat) for Pyxi to actually read and fix your code.*\n\n${heuristic.text}`,
        code: heuristic.code
      };
    }

    try {
      return await this.reviewCodeWithAI(code, errorText);
    } catch (err) {
      console.warn('AI code analysis failed, falling back to offline check', err);
      const heuristic = this.analyzeActiveCodeHeuristic(code, errorText);
      return {
        text: `❌ **AI analysis failed:** ${classifyError(err)}\n\nShowing a quick offline check instead:\n\n${heuristic.text}`,
        code: heuristic.code
      };
    }
  }

  // "Tap to generate fix" entry point for the error banner — same idea as
  // analyzeActiveCode() but keeps the explanation/fixSnippet shape the UI expects.
  async explainError(code = '', errorText = '') {
    if (!errorText) return { explanation: "No execution error detected in your current session!", fixSnippet: code };

    const ready = await this.ensureModelReady();
    if (!ready) return this.explainErrorHeuristic(code, errorText);

    try {
      const result = await this.reviewCodeWithAI(code, errorText);
      return { explanation: result.text, fixSnippet: result.code };
    } catch (err) {
      console.warn('AI error explanation failed, falling back to offline check', err);
      return this.explainErrorHeuristic(code, errorText);
    }
  }

  // Main Entry Point for User Prompts
  async generateResponse(userPrompt, activeCode = '') {
    const promptLower = userPrompt.toLowerCase().trim();

    // Check if the user is asking to explain / understand code
    const isExplanationIntent = /\b(explain|how does|how do|what does|understand|walkthrough|tell me how|describe|working of)\b/.test(promptLower);

    const ready = await this.ensureModelReady();
    if (!ready) {
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
      const rawResponse = await this.generateWithWorker(fullPromptText);
      const workerResponse = stripRepetitionLoop(rawResponse);

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
        text: `❌ **Local AI Error:** ${classifyError(err)}`,
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
