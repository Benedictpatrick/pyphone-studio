// Pyodide Python Engine WebAssembly Integration Service
import { SAMPLE_DATASETS } from './datasetService';

let pyodideInstance = null;
let isLoading = false;
let loadPromise = null;

/**
 * Initialize Pyodide WASM runtime and pre-load Python Data Science packages
 */
export async function initPyodide(onProgress = () => {}) {
  if (pyodideInstance) return pyodideInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      isLoading = true;
      onProgress({ status: 'loading-wasm', message: 'Initializing Python 3.11 WASM Engine...' });

      if (typeof window.loadPyodide !== 'function') {
        throw new Error('Pyodide script not loaded from CDN. Please check your internet connection.');
      }

      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
      });

      onProgress({ status: 'loading-packages', message: 'Loading NumPy, Pandas & Matplotlib...' });

      // Load built-in C-extension packages
      await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib', 'micropip']);

      onProgress({ status: 'loading-seaborn', message: 'Installing Seaborn via micropip...' });

      // Import micropip inside Python first, then install seaborn
      await pyodide.runPythonAsync(`
import micropip
await micropip.install('seaborn')
`);

      onProgress({ status: 'loading-datasets', message: 'Mounting pre-loaded CSV datasets...' });

      // Write sample CSV files into Pyodide virtual FS
      for (const key in SAMPLE_DATASETS) {
        const dataset = SAMPLE_DATASETS[key];
        pyodide.FS.writeFile(`/home/pyodide/${dataset.filename}`, dataset.csv);
      }

      // Configure Python Matplotlib & Output Interceptors & Variable Inspector
      await pyodide.runPythonAsync(`
import sys
import io
import os
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Set working directory so pd.read_csv('file.csv') resolves to mounted datasets
os.chdir('/home/pyodide')

# Save original streams BEFORE overriding so we can restore them reliably
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr

# Custom plot collector
_captured_plots = []

def _custom_show():
    global _captured_plots
    try:
        fig = plt.gcf()
        if fig and len(fig.axes) > 0:
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', dpi=180, facecolor='white', edgecolor='none')
            buf.seek(0)
            img_b64 = base64.b64encode(buf.read()).decode('utf-8')
            _captured_plots.append(img_b64)
            plt.close('all')
    except Exception as e:
        print("Plot rendering warning:", e)

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
`);

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
      // Run user code
      const rawResult = await pyodide.runPythonAsync(codeString);

      // Auto-check if matplotlib figure was left open without plt.show()
      await pyodide.runPythonAsync(`
if len(plt.get_fignums()) > 0:
    plt.show()
`);

      if (rawResult !== undefined && rawResult !== null) {
        evalResult = String(rawResult);

        // Store result in Python globals for DataFrame check
        pyodide.globals.set('__last_res', rawResult);

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
      errorMsg = err.message || String(err);
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
      plotsArray = pyPlots && pyPlots.toJs
        ? pyPlots.toJs({ depth: -1 })
        : (Array.isArray(pyPlots) ? pyPlots : []);
    } catch (_) { plotsArray = []; }

    // Restore stdout/stderr to saved original streams (not sys.__stdout__ which is None in Pyodide)
    await pyodide.runPythonAsync(`
sys.stdout = _orig_stdout
sys.stderr = _orig_stderr
`);

    // Merge stderr into the error message if there's no explicit exception
    // so Python warnings/deprecation notices are surfaced to the user
    const combinedStderr = stderr.trim();
    if (combinedStderr && !errorMsg) {
      // Show as a soft warning rather than a hard error
      errorMsg = `Warning (stderr):\n${combinedStderr}`;
    }

    return {
      stdout: stdout || '',
      stderr: stderr || '',
      error: errorMsg,
      plots: plotsArray,
      result: evalResult,
      isDataFrame,
      dfHtml
    };
  };

  // Chain runs sequentially; if previous run errored, still proceed
  executionQueue = executionQueue.then(run).catch(() => run());
  return executionQueue;
}

/**
 * Retrieve list of active Python variables in memory
 */
export async function getActiveVariables() {
  if (!pyodideInstance) return [];
  try {
    const pyVars = await pyodideInstance.runPythonAsync(`_get_user_variables()`);
    return pyVars && pyVars.toJs ? pyVars.toJs({ depth: -1 }) : [];
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
