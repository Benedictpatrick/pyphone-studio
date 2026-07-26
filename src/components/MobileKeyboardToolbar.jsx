import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

export default function MobileKeyboardToolbar({ onInsertText, onRunCurrent, isRunning }) {
  const [bottom, setBottom] = useState(0);
  const toolbarRef = useRef(null);

  useEffect(() => {
    const updatePosition = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      // Position toolbar at the bottom of the visible viewport (above keyboard)
      const toolbarHeight = toolbarRef.current?.offsetHeight || 80;
      const newBottom = Math.max(0, vv.height + vv.offsetTop - toolbarHeight);
      setBottom(newBottom);
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updatePosition);
      vv.addEventListener('scroll', updatePosition);
      updatePosition();
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updatePosition);
        vv.removeEventListener('scroll', updatePosition);
      }
    };
  }, []);

  const quickSymbols = [
    ':', '=', '(', ')', '[', ']', '{', '}', '_', '"', "'", '#', ',', '.', '+', '-', '*', '/', '%'
  ];

  const quickShortcuts = [
    { label: 'import', text: 'import ' },
    { label: 'pd', text: 'import pandas as pd\n' },
    { label: 'plt', text: 'import matplotlib.pyplot as plt\n' },
    { label: 'sns', text: 'import seaborn as sns\n' },
    { label: 'np', text: 'import numpy as np\n' },
    { label: 'df', text: 'df' },
    { label: 'show()', text: 'plt.show()' },
    { label: 'head()', text: '.head()' },
    { label: 'read_csv', text: "pd.read_csv('')" },
    { label: 'plot()', text: '.plot()' },
    { label: 'Tab', text: '    ' }
  ];

  return (
    <div
      className="mobile-keyboard-toolbar"
      ref={toolbarRef}
      style={{ bottom: `${bottom}px` }}
    >
      <div className="toolbar-section symbols-row">
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
            key={idx}
            className="kb-key-btn symbol-btn"
            onClick={() => onInsertText(sym)}
          >
            {sym}
          </button>
        ))}
      </div>

      <div className="toolbar-section shortcuts-row">
        {quickShortcuts.map((sc, idx) => (
          <button
            key={idx}
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
