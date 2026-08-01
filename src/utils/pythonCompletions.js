// Lightweight zero-latency Python autocomplete dictionary for CodeMirror 6
export const PYTHON_DATA_SCIENCE_COMPLETIONS = [
  // Common Data Science Imports & Snippets
  { label: 'import pandas as pd', type: 'keyword', detail: 'Pandas DataFrames' },
  { label: 'import numpy as np', type: 'keyword', detail: 'NumPy Arrays' },
  { label: 'import matplotlib.pyplot as plt', type: 'keyword', detail: 'Matplotlib Plots' },
  { label: 'import seaborn as sns', type: 'keyword', detail: 'Seaborn Visuals' },
  { label: 'import math', type: 'keyword', detail: 'Math module' },
  { label: 'import random', type: 'keyword', detail: 'Random module' },
  { label: 'import os', type: 'keyword', detail: 'OS module' },
  { label: 'import sys', type: 'keyword', detail: 'Sys module' },

  // Pandas Methods & Attributes
  { label: 'pd.read_csv()', type: 'function', detail: 'Read CSV File' },
  { label: 'pd.DataFrame()', type: 'function', detail: 'Create DataFrame' },
  { label: 'df.head()', type: 'function', detail: 'First 5 rows' },
  { label: 'df.tail()', type: 'function', detail: 'Last 5 rows' },
  { label: 'df.info()', type: 'function', detail: 'DataFrame summary' },
  { label: 'df.describe()', type: 'function', detail: 'Statistical summary' },
  { label: 'df.shape', type: 'property', detail: '(rows, columns)' },
  { label: 'df.columns', type: 'property', detail: 'Column names' },
  { label: 'df.groupby()', type: 'function', detail: 'Group by column' },
  { label: 'df.sort_values()', type: 'function', detail: 'Sort DataFrame' },
  { label: 'df.fillna()', type: 'function', detail: 'Fill NaN values' },
  { label: 'df.dropna()', type: 'function', detail: 'Drop NaN values' },

  // Matplotlib & Seaborn
  { label: 'plt.show()', type: 'function', detail: 'Render Matplotlib Chart' },
  { label: 'plt.figure()', type: 'function', detail: 'Figure container' },
  { label: 'plt.plot()', type: 'function', detail: 'Line chart' },
  { label: 'plt.scatter()', type: 'function', detail: 'Scatter plot' },
  { label: 'plt.bar()', type: 'function', detail: 'Bar chart' },
  { label: 'plt.hist()', type: 'function', detail: 'Histogram' },
  { label: 'plt.title()', type: 'function', detail: 'Set chart title' },
  { label: 'plt.xlabel()', type: 'function', detail: 'Set X axis label' },
  { label: 'plt.ylabel()', type: 'function', detail: 'Set Y axis label' },
  { label: 'plt.grid(True)', type: 'function', detail: 'Show grid lines' },
  { label: 'sns.scatterplot()', type: 'function', detail: 'Seaborn Scatter' },
  { label: 'sns.barplot()', type: 'function', detail: 'Seaborn Bar' },
  { label: 'sns.heatmap()', type: 'function', detail: 'Seaborn Heatmap' },
  { label: 'sns.boxplot()', type: 'function', detail: 'Seaborn Boxplot' },

  // Core Python Built-ins & Syntax
  { label: 'print()', type: 'function', detail: 'Print to stdout' },
  { label: 'range()', type: 'function', detail: 'Sequence generator' },
  { label: 'len()', type: 'function', detail: 'Get length' },
  { label: 'type()', type: 'function', detail: 'Get object type' },
  { label: 'str()', type: 'function', detail: 'Convert to string' },
  { label: 'int()', type: 'function', detail: 'Convert to integer' },
  { label: 'float()', type: 'function', detail: 'Convert to float' },
  { label: 'list()', type: 'function', detail: 'Create list' },
  { label: 'dict()', type: 'function', detail: 'Create dictionary' },
  { label: 'def', type: 'keyword', detail: 'Define function' },
  { label: 'return', type: 'keyword', detail: 'Return value' },
  { label: 'if', type: 'keyword', detail: 'Conditional' },
  { label: 'elif', type: 'keyword', detail: 'Else if' },
  { label: 'else:', type: 'keyword', detail: 'Else block' },
  { label: 'for i in range():', type: 'keyword', detail: 'For loop' },
  { label: 'while', type: 'keyword', detail: 'While loop' },
  { label: 'try:', type: 'keyword', detail: 'Try block' },
  { label: 'except Exception as e:', type: 'keyword', detail: 'Catch block' },
];

export function pythonAutocompletions(context) {
  const word = context.matchBefore(/[\w.]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  return {
    from: word.from,
    options: PYTHON_DATA_SCIENCE_COMPLETIONS
  };
}
