import React, { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

export default function MobileKeyboardToolbar({ onInsertText, onRunCurrent, isRunning }) {
  const toolbarRef = useRef(null);

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;

    const updatePosition = () => {
      const vv = window.visualViewport;
      if (!vv) {
        el.style.bottom = '0px';
        el.style.top = 'auto';
        return;
      }

      // Calculate distance from bottom of visual viewport to bottom of layout window
      const layoutHeight = window.innerHeight;
      const visibleBottom = vv.offsetTop + vv.height;
      const bottomOffset = Math.max(0, Math.round(layoutHeight - visibleBottom));

      el.style.bottom = `${bottomOffset}px`;
      el.style.top = 'auto';
      el.style.left = `${vv.offsetLeft}px`;
      el.style.width = `${vv.width}px`;
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updatePosition);
      vv.addEventListener('scroll', updatePosition);
    }
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    // Reposition on focus/blur events across the document
    const handleFocusIn = () => {
      setTimeout(updatePosition, 50);
      setTimeout(updatePosition, 150);
      setTimeout(updatePosition, 300);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusIn);

    updatePosition();
    const timer = setTimeout(updatePosition, 100);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updatePosition);
        vv.removeEventListener('scroll', updatePosition);
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusIn);
      clearTimeout(timer);
    };
  }, []);

  const quickSymbols = [
    ':', '=', '(', ')', '[', ']', '{', '}', '_', '"', "'", '#', ',', '.', '+', '-', '*', '/', '%'
  ];

  const quickShortcuts = [
    { label: 'import', text: 'import ' },
    { label: 'pd',      text: 'import pandas as pd\n' },
    { label: 'plt',     text: 'import matplotlib.pyplot as plt\n' },
    { label: 'sns',     text: 'import seaborn as sns\n' },
    { label: 'np',      text: 'import numpy as np\n' },
    { label: 'df',      text: 'df' },
    { label: 'show()',  text: 'plt.show()' },
    { label: 'head()',  text: '.head()' },
    { label: 'read_csv',text: "pd.read_csv('')" },
    { label: 'plot()',  text: '.plot()' },
    { label: 'Tab',     text: '    ' }
  ];

  return (
    <div className="mobile-keyboard-toolbar" ref={toolbarRef}>
      <div className="toolbar-section">
        <button
          className="kb-run-btn"
          onClick={onRunCurrent}
          disabled={isRunning}
          title="Run Current Code"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>RUN</span>
        </button>

        {quickSymbols.map((sym, idx) => (
          <button
            key={`sym-${idx}`}
            className="kb-key-btn symbol-btn"
            onClick={() => onInsertText(sym)}
          >
            {sym}
          </button>
        ))}

        <span className="toolbar-divider" />

        {quickShortcuts.map((sc, idx) => (
          <button
            key={`sc-${idx}`}
            className="kb-key-btn shortcut-btn"
            onClick={() => onInsertText(sc.text)}
          >
            {sc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
