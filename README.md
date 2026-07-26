# PyPhone Studio — Mobile Python Data Science IDE 📱🐍

**PyPhone Studio** is a mobile-first WebAssembly Python IDE built for smartphones, enabling students and data science learners to write, run, and visualize Python code (**Pandas, Matplotlib, Seaborn, NumPy**) directly on their phones with **100% real execution**—no laptop or cloud server required!

---

## ✨ Key Features

- 🐍 **Official Python 3.11 WASM Engine**: Powered by Pyodide, executing genuine CPython calculations line-by-line right in the mobile browser.
- 📊 **High-Resolution Matplotlib & Seaborn Visualizations**: Renders 180 DPI high-contrast graphs, bar charts, scatter plots, and time-series line charts with full axis labels and tick values.
- 📓 **Dual IDE Modes**:
  - **Notebook Mode**: Interactive Google Colab-style cells with Markdown notes, code execution counters, inline outputs, and reordering.
  - **Script Mode**: PyCharm-style single-file editor (`main.py`) with line numbers and split terminal/plot panels.
- 📱 **Mobile Touch Quick-Keys Toolbar**: Floating keyboard bar for smartphones providing 1-tap syntax characters (`:`, `=`, `(`, `)`, `[`, `]`, `{`, `}`, `"`, `'`, `#`) and quick snippets (`import pandas as pd`, `plt.show()`, `.head()`).
- 🔍 **Real-Time Variable Explorer**: Inspect active in-memory Python variables (`DataFrame` shapes, lists, arrays, types, and value previews).
- ☀️ **Light & Dark Mode**: Seamless 1-tap theme switcher between **Framer Dark Canvas** (`#090909`) and **Clean Light Canvas** (`#ffffff`).
- 📁 **Preloaded Datasets & Code Templates**: Built-in CSV datasets (`students_marks.csv`, `iris.csv`, `titanic.csv`, `tips.csv`, `stocks.csv`) and starter templates.
- 📄 **Export Options**: Export your work as `.py` scripts, `.ipynb` Jupyter Notebooks, or standalone single-file `.html` assignments with embedded figures.

---

## 🚀 Getting Started

### Local Development
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Host on local network for smartphone testing
npm run dev -- --host
```

### Production Build
```bash
npm run build
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Vanilla CSS (Framer Dark & Light Canvas Design System)
- **Python WASM**: Pyodide v0.26.1 (NumPy, Pandas, Matplotlib, Seaborn, Micropip)
- **Icons**: Lucide React (100% Vector SVG, Zero Emojis)

---

## 📜 License

MIT License. Designed for students and data science education everywhere.
