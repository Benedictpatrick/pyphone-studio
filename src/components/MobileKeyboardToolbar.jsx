import React from 'react';
import { Play, CornerDownLeft, Space, Delete } from 'lucide-react';

export default function MobileKeyboardToolbar({ onInsertText, onRunCurrent, isRunning }) {
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
    <div className="mobile-keyboard-toolbar">
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
