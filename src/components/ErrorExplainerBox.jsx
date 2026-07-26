import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

export default function ErrorExplainerBox({ errorText }) {
  if (!errorText) return null;

  // Simple heuristic diagnostic parser (Emoji-Free)
  const getDiagnostic = (rawErr) => {
    if (rawErr.includes('KeyError')) {
      const match = rawErr.match(/KeyError:\s*['"]?([^'"]+)['"]?/);
      const colName = match ? match[1] : 'column';
      return {
        title: `Column Not Found (KeyError: '${colName}')`,
        explanation: `Python tried to access column '${colName}', but it doesn't exist in your DataFrame.`,
        tip: `Check column names with 'print(df.columns)'. Column names are case-sensitive.`
      };
    }
    if (rawErr.includes('NameError')) {
      const match = rawErr.match(/NameError:\s*name\s*['"]?([^'"]+)['"]?\s*is not defined/);
      const varName = match ? match[1] : 'variable';
      return {
        title: `Variable Not Defined (NameError: '${varName}')`,
        explanation: `'${varName}' has not been created or imported yet.`,
        tip: `Make sure you executed the previous cell where '${varName}' was defined.`
      };
    }
    if (rawErr.includes('FileNotFoundError') || rawErr.includes('No such file')) {
      return {
        title: 'CSV File Not Found (FileNotFoundError)',
        explanation: `Python cannot find the specified CSV file in Pyodide memory.`,
        tip: `Click 'Data' in the navigation bar to mount preloaded CSV datasets.`
      };
    }
    if (rawErr.includes('SyntaxError')) {
      return {
        title: 'Syntax Error (SyntaxError)',
        explanation: `There is a typo, unclosed string quote, or missing parenthesis in your Python code.`,
        tip: `Check line ends for missing colons ':' or unclosed brackets '()'.`
      };
    }
    if (rawErr.includes('IndentationError')) {
      return {
        title: 'Indentation Error (IndentationError)',
        explanation: `Python expects 4 spaces for indented blocks under 'for', 'if', or 'def'.`,
        tip: `Use the 'Tab' key on the mobile toolbar to indent code cleanly.`
      };
    }

    return {
      title: 'Python Exception Diagnostic',
      explanation: `An error occurred while executing the Python code.`,
      tip: `Read the traceback log above to locate the line number causing the issue.`
    };
  };

  const diag = getDiagnostic(errorText);

  return (
    <div className="error-explainer-card">
      <div className="explainer-header">
        <AlertCircle className="w-4 h-4 text-blue-400 mr-1.5" />
        <span>{diag.title}</span>
      </div>
      <p className="explainer-body">{diag.explanation}</p>
      <div className="explainer-tip">
        <HelpCircle className="w-3.5 h-3.5 text-blue-400 mr-1.5 flex-shrink-0" />
        <span><strong>Fix Tip:</strong> {diag.tip}</span>
      </div>
    </div>
  );
}
