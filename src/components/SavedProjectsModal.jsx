import React, { useState } from 'react';
import { 
  X, 
  FolderCode, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  FileCode, 
  BookOpen, 
  Download, 
  Search,
  ExternalLink
} from 'lucide-react';

export default function SavedProjectsModal({ 
  isOpen, 
  onClose, 
  projects, 
  onSaveCurrent, 
  onLoadProject, 
  onRenameProject, 
  onDeleteProject,
  activeMode,
  onExportProject
}) {
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  if (!isOpen) return null;

  // Filter projects by search query
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    const titleToSave = newTitle.trim() || `Untitled ${activeMode === 'script' ? 'Script' : 'Notebook'} ${new Date().toLocaleDateString()}`;
    onSaveCurrent(titleToSave);
    setNewTitle('');
  };

  const handleStartRename = (proj) => {
    setEditingId(proj.id);
    setEditingTitle(proj.title);
  };

  const handleConfirmRename = (id) => {
    if (editingTitle.trim()) {
      onRenameProject(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  // Helper for formatting date
  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  // Code snippet helper
  const getSnippet = (proj) => {
    if (proj.type === 'script') {
      if (!proj.code) return '# Empty script';
      return proj.code.length > 90 ? proj.code.slice(0, 90) + '...' : proj.code;
    }
    if (proj.cells && proj.cells.length > 0) {
      const firstCode = proj.cells.find(c => c.type === 'code');
      if (!firstCode) return '# Notebook cells';
      return firstCode.code.length > 90 ? firstCode.code.slice(0, 90) + '...' : firstCode.code;
    }
    return '# Empty notebook';
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card projects-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="bottom-sheet-handle"></div>
          <div className="modal-header-top-row">
            <div className="modal-title">
              <FolderCode className="w-5 h-5" />
              <span>My Saved Projects</span>
              <span className="projects-count-badge">{projects.length}</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Quick Save Current Workspace Card */}
          <form onSubmit={handleSaveSubmit} className="save-workspace-box">
            <label className="form-label font-medium">Save Active {activeMode === 'script' ? 'Script' : 'Notebook'}</label>
            <div className="save-input-row">
              <input 
                type="text"
                className="modal-input"
                placeholder={`e.g. Assignment 1: Student Marks.${activeMode === 'script' ? 'py' : 'ipynb'}`}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button type="submit" className="framer-btn-primary save-btn">
                <Plus className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </form>

          {/* Search Projects */}
          <div className="projects-search-bar">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search saved programs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="projects-search-input"
            />
          </div>

          {/* Saved Programs List */}
          <div className="projects-list">
            {filteredProjects.length === 0 ? (
              <div className="empty-projects-state">
                <FolderCode className="w-8 h-8 text-slate-400 mb-2" />
                <p className="empty-text">No saved programs found.</p>
              </div>
            ) : (
              filteredProjects.map((proj) => (
                <div key={proj.id} className="project-item-card">
                  <div className="project-item-header">
                    <div className="project-type-tag">
                      {proj.type === 'script' ? (
                        <>
                          <FileCode className="w-3.5 h-3.5" />
                          <span>.py Script</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>.ipynb Notebook</span>
                        </>
                      )}
                    </div>
                    <span className="project-date">{formatDate(proj.updatedAt)}</span>
                  </div>

                  {/* Title or Inline Edit */}
                  {editingId === proj.id ? (
                    <div className="inline-rename-row">
                      <input 
                        type="text" 
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="modal-input rename-input"
                        autoFocus
                      />
                      <button 
                        className="modal-close-btn confirm-btn"
                        onClick={() => handleConfirmRename(proj.id)}
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                      </button>
                    </div>
                  ) : (
                    <h4 className="project-item-title">{proj.title}</h4>
                  )}

                  {/* Code Snippet Preview */}
                  <pre className="project-snippet-preview">{getSnippet(proj)}</pre>

                  {/* Action Toolbar */}
                  <div className="project-item-actions">
                    <button 
                      className="framer-btn-primary open-proj-btn"
                      onClick={() => {
                        onLoadProject(proj);
                        onClose();
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>

                    <button 
                      className="framer-btn-secondary action-icon-btn"
                      onClick={() => handleStartRename(proj)}
                      title="Rename Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      className="framer-btn-secondary action-icon-btn"
                      onClick={() => onExportProject(proj)}
                      title="Export File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      className="framer-btn-secondary action-icon-btn delete-btn"
                      onClick={() => onDeleteProject(proj.id)}
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
