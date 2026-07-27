// Pyodide Python Engine WebAssembly Integration Service
import { SAMPLE_DATASETS } from './datasetService';

let pyodideInstance = null;
let isLoading = false;
let loadPromise = null;
// ── Interrupt / Cancel Support ──────────────────────────────────────────────
let interruptBuffer = null;      // Uint8Array backed by SharedArrayBuffer
let _executionRunning = false;   // soft flag for UI
let _cancelReject = null;        // used when SAB is not available

/**
 * Returns true if code is currently being executed.
 */
export function isExecutionRunning() {
  return _executionRunning;
}

/**
 * Returns true if native interrupt (SharedArrayBuffer SIGINT) is supported.
 */
export function isInterruptSupported() {
  return interruptBuffer !== null;
}

/**
 * Cancel the currently running Python execution.
 * - If SharedArrayBuffer is available: sends SIGINT (KeyboardInterrupt) into Pyodide.
 * - Otherwise: rejects the JS-side promise (Python keeps running until the call returns,
 *   but the UI unblocks and the result is discarded).
 */
export function cancelPythonExecution() {
  if (interruptBuffer) {
    // SIGINT value = 2, Pyodide polls this and raises KeyboardInterrupt
    interruptBuffer[0] = 2;
  }
  if (_cancelReject) {
    _cancelReject(new Error('Execution cancelled by user'));
    _cancelReject = null;
  }
}


/**
 * Initialize Pyodide WASM runtime and pre-load Python Data Science packages
 */
export async function initPyodide(onProgress = () => {}, forceRetry = false) {
  if (forceRetry) {
    pyodideInstance = null;
    loadPromise = null;
    isLoading = false;
  }
  if (pyodideInstance) return pyodideInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      isLoading = true;
      onProgress({ status: 'loading-wasm', message: 'Connecting to Python WASM Engine...' });

      // Poll up to 15 times (4.5 seconds) for window.loadPyodide script from CDN
      let retries = 0;
      while (typeof window.loadPyodide !== 'function' && retries < 15) {
        await new Promise((res) => setTimeout(res, 300));
        retries++;
      }

      // If script tag wasn't ready, dynamically inject Pyodide CDN script
      if (typeof window.loadPyodide !== 'function') {
        onProgress({ status: 'loading-wasm', message: 'Downloading Pyodide WASM runtime...' });
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide CDN script. Please check your network connection.'));
          document.head.appendChild(script);
        });
      }

      if (typeof window.loadPyodide !== 'function') {
        throw new Error('Pyodide CDN script failed to load. Please check your network connection and tap to retry.');
      }

      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/',
        stdin: () => window.prompt('Python Input Required:')
      });

      // Load built-in C-extension packages sequentially for mobile stability
      onProgress({ status: 'loading-packages', message: 'Loading NumPy...' });
      await pyodide.loadPackage('numpy');

      onProgress({ status: 'loading-packages', message: 'Loading Pandas...' });
      await pyodide.loadPackage('pandas');

      onProgress({ status: 'loading-packages', message: 'Loading Matplotlib...' });
      await pyodide.loadPackage('matplotlib');

      onProgress({ status: 'loading-packages', message: 'Loading micropip...' });
      await pyodide.loadPackage('micropip');

      // Attempt Seaborn install safely
      try {
        onProgress({ status: 'loading-seaborn', message: 'Installing Seaborn & mpld3...' });
        await pyodide.runPythonAsync(`
import micropip
await micropip.install(['seaborn', 'mpld3'])
`);
      } catch (seabornErr) {
        console.warn('Optional package (Seaborn) skipped:', seabornErr);
      }

      onProgress({ status: 'loading-datasets', message: 'Mounting pre-loaded CSV datasets...' });

      // Create home directory safely in Pyodide virtual FS
      try {
        pyodide.FS.mkdir('/home/pyodide');
      } catch (_) {}

      // Write sample CSV files into Pyodide virtual FS safely
      for (const key in SAMPLE_DATASETS) {
        const dataset = SAMPLE_DATASETS[key];
        try {
          pyodide.FS.writeFile(`/home/pyodide/${dataset.filename}`, dataset.csv);
          pyodide.FS.writeFile(`/${dataset.filename}`, dataset.csv);
        } catch (e) {
          console.warn(`Dataset write skipped for ${dataset.filename}:`, e);
        }
      }

      // Configure Python Matplotlib & Output Interceptors & Variable Inspector
      await pyodide.runPythonAsync(`
import sys
import io
import os
import base64
import warnings
warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=FutureWarning)
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import json

# Set working directory safely
try:
    os.chdir('/home/pyodide')
except Exception:
    pass


# Save original streams BEFORE overriding so we can restore them reliably
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr

# Custom plot collector
_captured_plots = []

def _custom_show(*args, **kwargs):
    global _captured_plots
    try:
        fignums = plt.get_fignums()
        if not fignums:
            fig = plt.gcf()
            if fig and len(fig.axes) > 0:
                fignums = [fig.number]
        for fignum in fignums:
            fig = plt.figure(fignum)
            try:
                import mpld3
                html_str = mpld3.fig_to_html(fig)
                _captured_plots.append(json.dumps({"type": "html", "data": html_str}))
            except ImportError:
                buf = io.BytesIO()
                fig.savefig(buf, format='png', bbox_inches='tight', dpi=180, facecolor='white', edgecolor='none')
                buf.seek(0)
                img_b64 = base64.b64encode(buf.read()).decode('utf-8')
                _captured_plots.append(json.dumps({"type": "png", "data": img_b64}))
        plt.close('all')
    except Exception as e:
        pass


# Override plt.show
plt.show = _custom_show

# Standard output redirection helper
class OutputBuffer:
    def __init__(self):
        self.out = []
    def write(self, s):
        self.out.append(str(s))
    def flush(self):
        pass
    def getvalue(self):
        return "".join(self.out)

_stdout_buf = OutputBuffer()
_stderr_buf = OutputBuffer()

# Variable Inspector Helper
def _get_user_variables():
    import pandas as pd, numpy as np
    user_vars = []
    ignore = {
        'sys', 'io', 'os', 'base64', 'matplotlib', 'plt', 'pd', 'np', 'sns',
        'micropip', 'OutputBuffer', '_captured_plots', '_stdout_buf', '_stderr_buf',
        '_custom_show', '_get_user_variables', '__last_res',
        '_orig_stdout', '_orig_stderr'
    }
    for k, v in list(globals().items()):
        if k.startswith('_') or k in ignore:
            continue
        v_type = type(v).__name__
        v_shape = ""
        v_repr = str(v)
        if isinstance(v, pd.DataFrame):
            v_shape = f"({v.shape[0]} x {v.shape[1]})"
            v_repr = f"Cols: {list(v.columns)}"
        elif isinstance(v, (np.ndarray, list, dict, tuple)):
            try: v_shape = f"len={len(v)}"
            except: pass
        if len(v_repr) > 70:
            v_repr = v_repr[:67] + "..."
        user_vars.append({"name": k, "type": v_type, "shape": v_shape, "repr": v_repr})
    return user_vars

import traceback
from pyodide.code import eval_code
import asyncio

_pyphone_last_error = ""

async def _pyphone_run_code(code_str):
    global _pyphone_last_error, __last_res
    _pyphone_last_error = ""
    try:
        res = eval_code(code_str, globals())
        if asyncio.iscoroutine(res):
            res = await res
        __last_res = res
        return res
    except BaseException:
        _pyphone_last_error = traceback.format_exc()
        raise Exception("PYPHONE_EXEC_ERROR")
`);

      // Setup interrupt buffer if SharedArrayBuffer is available (requires COOP headers)
      try {
        if (typeof SharedArrayBuffer !== 'undefined') {
          interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
          pyodide.setInterruptBuffer(interruptBuffer);
        }
      } catch (_) {
        interruptBuffer = null;
      }

      pyodideInstance = pyodide;
      isLoading = false;
      onProgress({ status: 'ready', message: 'Python Engine Ready!' });
      return pyodide;
    } catch (err) {
      isLoading = false;
      loadPromise = null;
      console.error('Pyodide Init Error:', err);
      throw err;
    }
  })();

  return loadPromise;
}

let executionQueue = Promise.resolve();

/**
 * Execute Python code block and return stdout, stderr, plots, and evaluated result
 */
export async function executePythonCode(codeString) {
  const run = async () => {
    // Reset interrupt buffer before each run
    if (interruptBuffer) interruptBuffer[0] = 0;
    _executionRunning = true;
    _cancelReject = null;
    const pyodide = await initPyodide();

    // Reset captured output buffers and redirect stdout/stderr
    await pyodide.runPythonAsync(`
_captured_plots = []
_stdout_buf = OutputBuffer()
_stderr_buf = OutputBuffer()
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf
`);

    let evalResult = null;
    let errorMsg = null;
    let isDataFrame = false;
    let dfHtml = null;

    try {
      // Run user code via our robust python wrapper to bypass WASM error truncation bugs
      const runner = pyodide.globals.get('_pyphone_run_code');
      let rawResult;
      try {
        rawResult = await runner(codeString);
      } finally {
        runner.destroy();
      }

      // Auto-check if matplotlib figure was left open without plt.show()
      await pyodide.runPythonAsync(`
if len(plt.get_fignums()) > 0:
    plt.show()
`);

      if (rawResult !== undefined && rawResult !== null) {
        try {
          evalResult = String(rawResult);
        } finally {
          rawResult.destroy?.();
        }

        // Check if evaluated result is a Pandas DataFrame
        const isDfCheck = await pyodide.runPythonAsync(`
import pandas as pd
isinstance(__last_res, pd.DataFrame)
`);
        if (isDfCheck) {
          dfHtml = await pyodide.runPythonAsync(`__last_res.to_html(classes='pyphone-df-table', border=0)`);
          isDataFrame = true;
        }
      }
    } catch (err) {
      // Check if our Python wrapper caught a true Python error and saved the traceback
      let pyTraceback = null;
      try {
        pyTraceback = await pyodide.runPythonAsync('_pyphone_last_error');
      } catch (_) {}

      if (pyTraceback && pyTraceback.trim() !== '') {
        errorMsg = pyTraceback;
      } else {
        // Fallback for JS/WASM level failures
        const msg = err.message || '';
        const stack = err.stack || '';
        if (msg === err.name || msg === 'PythonError' || msg.trim() === '') {
          errorMsg = stack || String(err);
        } else {
          errorMsg = msg;
          if (stack && stack.includes('Traceback') && !msg.includes('Traceback')) {
            errorMsg += '\n' + stack;
          }
        }
      }
    }


    // Retrieve captured stdout, stderr, and plots — with safe fallbacks
    let stdout = '';
    let stderr = '';
    let plotsArray = [];

    try {
      stdout = await pyodide.runPythonAsync(`_stdout_buf.getvalue()`) || '';
    } catch (_) { stdout = ''; }

    try {
      stderr = await pyodide.runPythonAsync(`_stderr_buf.getvalue()`) || '';
    } catch (_) { stderr = ''; }

    try {
      const pyPlots = await pyodide.runPythonAsync(`_captured_plots`);
      try {
        const rawArray = pyPlots && pyPlots.toJs
          ? pyPlots.toJs({ depth: -1 })
          : (Array.isArray(pyPlots) ? pyPlots : []);
          
        plotsArray = rawArray.map(item => {
          try {
            return typeof item === 'string' ? JSON.parse(item) : item;
          } catch (e) {
            return { type: "png", data: item };
          }
        });
      } finally {
        pyPlots?.destroy?.();
      }
    } catch (_) { plotsArray = []; }

    // Restore stdout/stderr to saved original streams (not sys.__stdout__ which is None in Pyodide)
    await pyodide.runPythonAsync(`
sys.stdout = _orig_stdout
sys.stderr = _orig_stderr
`);

    // If there was no uncaught Python exception, append non-fatal stderr (like warnings)
    // to stdout so it displays as console output rather than a red Execution Exception error.
    let finalStdout = stdout || '';
    const combinedStderr = stderr.trim();
    if (combinedStderr && !errorMsg) {
      finalStdout = finalStdout ? `${finalStdout}\n[Warning]\n${combinedStderr}` : `[Warning]\n${combinedStderr}`;
    }

    _executionRunning = false;
    return {
      stdout: finalStdout,
      stderr: stderr || '',
      error: errorMsg,
      plots: plotsArray,
      result: evalResult,
      isDataFrame,
      dfHtml
    };

  };

  // Wrap with a cancellable promise when SAB is not available
  const runWithCancelFallback = () => {
    const runPromise = run().finally(() => { _executionRunning = false; });
    if (interruptBuffer) return runPromise; // SAB path — cancel is native
    return new Promise((resolve, reject) => {
      _cancelReject = reject;
      runPromise.then(resolve, reject);
    });
  };

  // Chain runs sequentially. A failed earlier run must not block the next one,
  // but it also must not cause the same user code to execute a second time.
  executionQueue = executionQueue.catch(() => undefined).then(runWithCancelFallback);
  return executionQueue;
}

/**
 * Retrieve list of active Python variables in memory
 */
export async function getActiveVariables() {
  if (!pyodideInstance) return [];
  try {
    const pyVars = await pyodideInstance.runPythonAsync(`_get_user_variables()`);
    try {
      return pyVars && pyVars.toJs ? pyVars.toJs({ depth: -1 }) : [];
    } finally {
      pyVars?.destroy?.();
    }
  } catch (err) {
    console.warn('Variable Explorer error:', err);
    return [];
  }
}

/**
 * Write a custom CSV file uploaded by the user into Pyodide FS
 */
export async function writeCustomDataset(filename, csvContent) {
  const pyodide = await initPyodide();
  pyodide.FS.writeFile(`/home/pyodide/${filename}`, csvContent);
  return filename;
}

/**
 * Dynamically install a pure Python package from PyPI via micropip
 */
export async function installPyodidePackage(pkgName, onLog = () => {}) {
  const pyodide = await initPyodide();
  try {
    const micropip = pyodide.pyimport('micropip');
    onLog(`Calling micropip.install('${pkgName}')...`);
    // redirect stdout to catch micropip logs if any
    await micropip.install(pkgName);
    onLog(`Finished installing ${pkgName}`);
    micropip.destroy();
  } catch (err) {
    onLog(`Error installing ${pkgName}: ${err.message}`);
    throw err;
  }
}
