// LocalStorage & Offline Multi-Project Persistence Service for PyPhone Studio

const STORAGE_KEYS = {
  NOTEBOOK_CELLS: 'pyphone_notebook_cells_v3',
  SCRIPT_CODE: 'pyphone_script_code_v3',
  LAST_MODE: 'pyphone_last_mode_v3',
  SAVED_PROJECTS: 'pyphone_saved_projects_v1'
};

// Seed default starter projects if empty
const DEFAULT_PROJECTS = [];

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

// Multi-Project Management API
export function getSavedProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_PROJECTS;
  }
}

export function saveProject(projectData) {
  try {
    const projects = getSavedProjects();
    const existingIndex = projects.findIndex(p => p.id === projectData.id);
    let updated;

    if (existingIndex >= 0) {
      projects[existingIndex] = {
        ...projects[existingIndex],
        ...projectData,
        updatedAt: new Date().toISOString()
      };
      updated = projects;
    } else {
      const newProj = {
        id: `proj-${Date.now()}`,
        title: projectData.title || 'Untitled Data Project',
        type: projectData.type || 'script',
        code: projectData.code || '',
        cells: projectData.cells || [],
        updatedAt: new Date().toISOString()
      };
      updated = [newProj, ...projects];
    }

    localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save project:', err);
    return getSavedProjects();
  }
}

export function renameProject(projectId, newTitle) {
  try {
    const projects = getSavedProjects();
    const updated = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, title: newTitle, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    return getSavedProjects();
  }
}

export function deleteProject(projectId) {
  try {
    const projects = getSavedProjects();
    const updated = projects.filter(p => p.id !== projectId);
    localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    return getSavedProjects();
  }
}
