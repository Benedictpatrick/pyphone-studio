import React, { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

export default function MobileKeyboardToolbar({ onInsertText, onRunCurrent, isRunning }) {
  const toolbarRef = useRef(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const reposition = () => {
      const el = toolbarRef.current;
      if (!el) return;

      const toolbarH = el.offsetHeight;
      // Anchor toolbar to the bottom edge of the visual viewport (above keyboard)
      const newTop = vv.offsetTop + vv.height - toolbarH;
      el.style.top = `${newTop}px`;
      el.style.left = `${vv.offsetLeft}px`;
      el.style.width = `${vv.width}px`;
      // Clear any previous bottom style
      el.style.bottom = 'auto';
    };

    vv.addEventListener('resize', reposition);
    vv.addEventListener('scroll', reposition);
    window.addEventListener('resize', reposition);
    // Run once immediately and after a tiny delay to catch first paint height
    reposition();
    const t = setTimeout(reposition, 80);

    return () => {
      vv.removeEventListener('resize', reposition);
      vv.removeEventListener('scroll', reposition);
      window.removeEventListener('resize', reposition);
      clearTimeout(t);
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
