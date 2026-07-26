// Python Data Science Cheat Sheet & Reference Snippets (Emoji-Free)

export const CHEAT_SHEET_SECTIONS = [
  {
    id: 'pandas-basics',
    title: 'Pandas Data Cleaning & Grouping',
    items: [
      {
        label: 'Load CSV File',
        code: `df = pd.read_csv('filename.csv')`
      },
      {
        label: 'View First & Last Rows',
        code: `print(df.head(5))\nprint(df.tail(5))`
      },
      {
        label: 'Dataset Info & Summary Stats',
        code: `print(df.info())\nprint(df.describe())`
      },
      {
        label: 'Filter Rows by Condition',
        code: `filtered_df = df[df['age'] > 25]`
      },
      {
        label: 'Handle Missing Values (Nulls)',
        code: `print(df.isnull().sum())\ndf_clean = df.dropna()\n# Or fill missing values: df['age'] = df['age'].fillna(df['age'].median())`
      },
      {
        label: 'Group By & Aggregate',
        code: `group_stats = df.groupby('category')['score'].agg(['mean', 'max', 'count'])\nprint(group_stats)`
      }
    ]
  },
  {
    id: 'matplotlib-viz',
    title: 'Matplotlib Graphics & Customization',
    items: [
      {
        label: 'Line Chart',
        code: `plt.figure(figsize=(7, 4))\nplt.plot(x, y, color='#0099ff', marker='o', label='Trend')\nplt.title('Line Chart Title')\nplt.xlabel('X Axis')\nplt.ylabel('Y Axis')\nplt.grid(True, alpha=0.3)\nplt.legend()\nplt.show()`
      },
      {
        label: 'Bar Chart',
        code: `plt.figure(figsize=(7, 4))\nplt.bar(categories, values, color='#6a4cf5')\nplt.title('Category Comparison')\nplt.xticks(rotation=45)\nplt.tight_layout()\nplt.show()`
      },
      {
        label: 'Histogram (Distribution)',
        code: `plt.figure(figsize=(7, 4))\nplt.hist(df['column_name'], bins=15, color='#d44df0', edgecolor='#141414')\nplt.title('Data Distribution')\nplt.show()`
      },
      {
        label: 'Scatter Plot',
        code: `plt.figure(figsize=(7, 4))\nplt.scatter(df['x'], df['y'], c=df['category_code'], cmap='viridis', alpha=0.85)\nplt.colorbar(label='Scale')\nplt.show()`
      }
    ]
  },
  {
    id: 'seaborn-viz',
    title: 'Seaborn Statistical Visualizations',
    items: [
      {
        label: 'Correlation Heatmap',
        code: `import seaborn as sns\nplt.figure(figsize=(6, 4.5))\ncorr = df.select_dtypes(include=['float64', 'int64']).corr()\nsns.heatmap(corr, annot=True, cmap='coolwarm', fmt='.2f')\nplt.title('Correlation Matrix')\nplt.show()`
      },
      {
        label: 'Boxplot by Category',
        code: `plt.figure(figsize=(7, 4.5))\nsns.boxplot(data=df, x='category', y='value', palette='Set2')\nplt.title('Value Distribution across Categories')\nplt.show()`
      },
      {
        label: 'Regression Plot',
        code: `plt.figure(figsize=(7, 4.5))\nsns.regplot(data=df, x='study_hours', y='math_score', color='#0099ff')\nplt.title('Linear Trend & Confidence Interval')\nplt.show()`
      }
    ]
  },
  {
    id: 'numpy-math',
    title: 'NumPy Vector & Matrix Operations',
    items: [
      {
        label: 'Create Array & Reshape',
        code: `arr = np.array([1, 2, 3, 4, 5, 6])\nmatrix = arr.reshape(2, 3)\nprint(matrix)`
      },
      {
        label: 'Basic Statistics',
        code: `mean_val = np.mean(arr)\nstd_val = np.std(arr)\nmax_idx = np.argmax(arr)`
      }
    ]
  }
];
