// Export Notebook or Script to a Standalone Single HTML Homework Report

import { sanitizeHtml } from '../lib/sanitize';

export function exportToHtmlReport({ title = "Python Program & Code Report", cells = [], scriptCode = "", scriptOutput = null, mode = "notebook" }) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let bodyContent = '';

  if (mode === 'notebook') {
    bodyContent = cells.map((cell, idx) => {
      if (cell.type === 'markdown') {
        return `
        <div class="report-cell markdown-cell">
          <div class="cell-content">${escapeHtml(cell.code).replace(/\n/g, '<br/>')}</div>
        </div>`;
      }

      let outputsHtml = '';
      if (cell.output) {
        if (cell.output.stdout) {
          outputsHtml += `<pre class="stdout-box">${escapeHtml(cell.output.stdout)}</pre>`;
        }
        if (cell.output.dfHtml) {
          outputsHtml += `<div class="df-wrapper">${sanitizeHtml(cell.output.dfHtml)}</div>`;
        }
        if (cell.output.plots && cell.output.plots.length > 0) {
          outputsHtml += `<div class="plots-grid">` + 
            cell.output.plots.map(b64 => `<img src="data:image/png;base64,${b64}" class="report-plot-img" />`).join('') +
            `</div>`;
        }
        if (cell.output.error) {
          outputsHtml += `<pre class="error-box">${escapeHtml(cell.output.error)}</pre>`;
        }
      }

      return `
      <div class="report-cell code-cell">
        <div class="cell-tag">In [${cell.executionCount || (idx + 1)}]:</div>
        <pre class="code-block"><code>${escapeHtml(cell.code)}</code></pre>
        ${outputsHtml ? `<div class="output-container"><div class="out-tag">Out:</div>${outputsHtml}</div>` : ''}
      </div>`;
    }).join('\n');
  } else {
    let scriptOutputsHtml = '';
    if (scriptOutput) {
      if (scriptOutput.stdout) scriptOutputsHtml += `<pre class="stdout-box">${escapeHtml(scriptOutput.stdout)}</pre>`;
      if (scriptOutput.dfHtml) scriptOutputsHtml += `<div class="df-wrapper">${sanitizeHtml(scriptOutput.dfHtml)}</div>`;
      if (scriptOutput.plots && scriptOutput.plots.length > 0) {
        scriptOutputsHtml += `<div class="plots-grid">` + 
          scriptOutput.plots.map(b64 => `<img src="data:image/png;base64,${b64}" class="report-plot-img" />`).join('') +
          `</div>`;
      }
      if (scriptOutput.error) scriptOutputsHtml += `<pre class="error-box">${escapeHtml(scriptOutput.error)}</pre>`;
    }

    bodyContent = `
    <div class="report-cell code-cell">
      <div class="cell-tag">Python Script (main.py):</div>
      <pre class="code-block"><code>${escapeHtml(scriptCode)}</code></pre>
      ${scriptOutputsHtml ? `<div class="output-container"><div class="out-tag">Execution Output:</div>${scriptOutputsHtml}</div>` : ''}
    </div>`;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      max-width: 860px;
      margin: 0 auto;
      padding: 24px 16px;
      line-height: 1.6;
    }
    header {
      border-bottom: 2px solid #30363d;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    h1 {
      color: #10b981;
      margin: 0 0 6px 0;
      font-size: 1.8rem;
    }
    .meta {
      font-size: 0.85rem;
      color: #8b949e;
    }
    .report-cell {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      margin-bottom: 20px;
      padding: 16px;
    }
    .cell-tag, .out-tag {
      font-family: monospace;
      font-size: 0.75rem;
      color: #10b981;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .code-block {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 12px;
      font-family: "Fira Code", monospace;
      font-size: 0.85rem;
      overflow-x: auto;
      color: #a5d6ff;
      margin: 0 0 12px 0;
    }
    .stdout-box {
      background: #0d1117;
      border-left: 3px solid #0ea5e9;
      padding: 10px;
      font-family: monospace;
      font-size: 0.82rem;
      color: #e6edf3;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .error-box {
      background: rgba(244, 63, 94, 0.15);
      border-left: 3px solid #f43f5e;
      padding: 10px;
      font-family: monospace;
      font-size: 0.82rem;
      color: #fca5a5;
      white-space: pre-wrap;
    }
    .plots-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 12px;
    }
    .report-plot-img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #30363d;
      background: #161b22;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: monospace;
      font-size: 0.8rem;
      margin-top: 10px;
    }
    th {
      background: #21262d;
      color: #10b981;
      padding: 8px;
      text-align: left;
      border: 1px solid #30363d;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #21262d;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      font-size: 0.8rem;
      color: #8b949e;
      border-top: 1px solid #30363d;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <header>
    <h1>🐍 ${escapeHtml(title)}</h1>
    <div class="meta">Generated via PyPhone Studio • ${dateStr}</div>
  </header>
  
  <main>
    ${bodyContent}
  </main>

  <footer>
    Created with PyPhone Studio Mobile Python IDE
  </footer>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pyphone_report_${Date.now()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
