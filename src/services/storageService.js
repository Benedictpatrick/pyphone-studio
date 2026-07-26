// LocalStorage Persistence Service for PyPhone Studio

const STORAGE_KEYS = {
  NOTEBOOK_CELLS: 'pyphone_notebook_cells_v3',
  SCRIPT_CODE: 'pyphone_script_code_v3',
  LAST_MODE: 'pyphone_last_mode_v3'
};

export function saveNotebookState(cells) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTEBOOK_CELLS, JSON.stringify(cells));
  } catch (err) {
    console.warn('Failed to auto-save notebook to localStorage:', err);
  }
}

export function loadNotebookState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTEBOOK_CELLS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveScriptState(code) {
  try {
    localStorage.setItem(STORAGE_KEYS.SCRIPT_CODE, code);
  } catch (err) {
    console.warn('Failed to auto-save script code:', err);
  }
}

export function loadScriptState() {
  try {
    return localStorage.getItem(STORAGE_KEYS.SCRIPT_CODE) || null;
  } catch (err) {
    return null;
  }
}

export function saveLastMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_MODE, mode);
  } catch (err) {}
}

export function loadLastMode() {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_MODE) || 'notebook';
  } catch (err) {
    return 'notebook';
  }
}
