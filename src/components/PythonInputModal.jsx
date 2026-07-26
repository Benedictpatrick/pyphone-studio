import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export default function PythonInputModal({ request, onSubmit, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setValue('');
    inputRef.current?.focus();
  }, [request?.index]);

  if (!request) return null;

  const prompt = request.prompts[request.index] || 'Enter a value';
  const isLastPrompt = request.index === request.prompts.length - 1;

  return (
    <div className="modal-overlay python-input-overlay">
      <form className="modal-card python-input-modal" role="dialog" aria-modal="true" aria-labelledby="python-input-title" onSubmit={(event) => { event.preventDefault(); onSubmit(value); }}>
        <div className="modal-header">
          <div className="modal-header-top-row">
            <div className="modal-title">
              <Keyboard className="w-5 h-5 text-blue-400" />
              <span id="python-input-title">Python input()</span>
            </div>
            <button className="modal-close-btn" type="button" onClick={onCancel} aria-label="Cancel input">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body python-input-body">
          <p className="python-input-progress">Input {request.index + 1} of {request.prompts.length}</p>
          <label className="python-input-prompt" htmlFor="python-input-value">{prompt}</label>
          <input
            ref={inputRef}
            id="python-input-value"
            className="modal-input python-input-field"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <p className="python-input-help">Your value is passed to Python as text, just like standard <code>input()</code>.</p>
          <div className="python-input-actions">
            <button className="framer-btn-secondary" type="button" onClick={onCancel}>Cancel run</button>
            <button className="framer-btn-primary" type="submit">{isLastPrompt ? 'Run code' : 'Continue'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
