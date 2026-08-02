import { linter } from '@codemirror/lint';

export function checkPythonSyntax(code) {
  const diagnostics = [];
  const lines = code.split('\n');

  let bracketStack = [];
  const bracketPairs = { '(': ')', '[': ']', '{': '}' };

  let currentOffset = 0;

  lines.forEach((lineText, lineIdx) => {
    const trimmed = lineText.trim();
    const lineStartPos = currentOffset;
    const lineEndPos = currentOffset + lineText.length;
    currentOffset += lineText.length + 1; // +1 for newline

    if (!trimmed || trimmed.startsWith('#')) return;

    // 1. Missing colon check on control statements
    const controlKeywords = ['if', 'elif', 'else', 'for', 'while', 'def', 'class', 'try', 'except', 'with', 'finally'];
    const firstWord = trimmed.split(/[\s(:]/)[0];

    if (controlKeywords.includes(firstWord)) {
      // Strip comments
      const codePart = trimmed.split('#')[0].trim();
      if (codePart && !codePart.endsWith(':') && !codePart.endsWith('\\')) {
        diagnostics.push({
          from: lineStartPos,
          to: lineEndPos,
          severity: 'warning',
          message: `SyntaxWarning: Expected ':' at end of '${firstWord}' statement`
        });
      }
    }

    // 2. Unclosed string quotes on single line (non-multiline)
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < lineText.length; i++) {
      const char = lineText[i];
      if ((char === '"' || char === "'") && (i === 0 || lineText[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
    }
    if (inString && !trimmed.startsWith('"""') && !trimmed.startsWith("'''")) {
      diagnostics.push({
        from: lineStartPos,
        to: lineEndPos,
        severity: 'error',
        message: `SyntaxError: EOL while scanning string literal (${stringChar})`
      });
    }

    // 3. Trailing line continuation backslash check
    if (trimmed.endsWith('\\') && (lineIdx === lines.length - 1 || lines[lineIdx + 1].trim() === '')) {
      diagnostics.push({
        from: lineStartPos,
        to: lineEndPos,
        severity: 'error',
        message: `SyntaxError: Unexpected trailing '\\' at end of line (line continuation without next line)`
      });
    }

    // 4. Common keyword typo check (e.g. mport -> import)
    const commonTypos = {
      'mport': 'import',
      'imprt': 'import',
      'retun': 'return',
      'prnt': 'print'
    };
    if (commonTypos[firstWord]) {
      diagnostics.push({
        from: lineStartPos,
        to: lineStartPos + firstWord.length,
        severity: 'error',
        message: `SyntaxError: Invalid keyword '${firstWord}'. Did you mean '${commonTypos[firstWord]}'?`
      });
    }

    // 5. Bracket matching
    for (let i = 0; i < lineText.length; i++) {
      const char = lineText[i];
      if (['(', '[', '{'].includes(char)) {
        bracketStack.push({ char, lineIdx, pos: lineStartPos + i });
      } else if ([')', ']', '}'].includes(char)) {
        if (bracketStack.length === 0) {
          diagnostics.push({
            from: lineStartPos + i,
            to: lineStartPos + i + 1,
            severity: 'error',
            message: `SyntaxError: Unmatched closing '${char}'`
          });
        } else {
          const last = bracketStack.pop();
          if (bracketPairs[last.char] !== char) {
            diagnostics.push({
              from: lineStartPos + i,
              to: lineStartPos + i + 1,
              severity: 'error',
              message: `SyntaxError: Mismatched bracket '${char}' for '${last.char}'`
            });
          }
        }
      }
    }
  });

  // Unclosed brackets remaining
  bracketStack.forEach(b => {
    diagnostics.push({
      from: b.pos,
      to: b.pos + 1,
      severity: 'error',
      message: `SyntaxError: Unclosed '${b.char}'`
    });
  });

  return diagnostics;
}

export const pythonLinterExtension = linter((view) => {
  return checkPythonSyntax(view.state.doc.toString());
});
