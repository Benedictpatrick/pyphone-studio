// Python Starter Code Templates for Data Analysis & Visualization (Emoji-Free)

export const PYTHON_TEMPLATES = [
  {
    id: 'student-average-marks-bar',
    title: 'Average Marks of Students (Bar Chart)',
    category: 'Matplotlib Bar',
    description: 'Bar chart showing average marks of Arun, Ben, Charan, Divya, Eva, and Farhan.',
    code: `import pandas as pd
import matplotlib.pyplot as plt

# Load Student Marks dataset
df = pd.read_csv('students_marks.csv')

plt.figure(figsize=(8, 5))
plt.bar(df['student_name'], df['average_marks'], color='#1f77b4', width=0.7)

plt.title('Average Marks of Students', fontsize=14)
plt.xlabel('Students', fontsize=11)
plt.ylabel('Average Marks', fontsize=11)
plt.ylim(0, 95)
plt.tight_layout()

# Render graph in PyPhone Studio
plt.show()
`
  },
  {
    id: 'student-performance-subject-lines',
    title: 'Student Performance by Subject (Multi-Line)',
    category: 'Matplotlib Line',
    description: 'Multi-line chart tracking student performance across Math, Science, and English.',
    code: `import pandas as pd
import matplotlib.pyplot as plt

# Load Student Marks dataset
df = pd.read_csv('students_marks.csv')

plt.figure(figsize=(8, 5))
plt.plot(df['student_name'], df['math'], marker='o', label='Math', color='#1f77b4', linewidth=1.5)
plt.plot(df['student_name'], df['science'], marker='o', label='Science', color='#ff7f0e', linewidth=1.5)
plt.plot(df['student_name'], df['english'], marker='o', label='English', color='#2ca02c', linewidth=1.5)

plt.title('Student Performance by Subject', fontsize=14)
plt.xlabel('Students', fontsize=11)
plt.ylabel('Marks', fontsize=11)
plt.legend(loc='upper right')
plt.tight_layout()

# Render graph in PyPhone Studio
plt.show()
`
  },
  {
    id: 'matplotlib-iris-scatter',
    title: 'Iris Species Scatter Matrix',
    category: 'Matplotlib Scatter',
    description: 'Compare Sepal Length vs Sepal Width across iris species with custom color palettes.',
    code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('iris.csv')

plt.figure(figsize=(7, 4.5))
colors = {'setosa': '#ff5577', 'versicolor': '#0099ff', 'virginica': '#6a4cf5'}

for species, group in df.groupby('species'):
    plt.scatter(group['sepal_length'], group['sepal_width'], 
                label=species, color=colors[species], alpha=0.85, s=60)

plt.title('Iris Sepal Dimensions by Species', fontsize=14)
plt.xlabel('Sepal Length (cm)', fontsize=11)
plt.ylabel('Sepal Width (cm)', fontsize=11)
plt.grid(True, linestyle='--', alpha=0.3)
plt.legend(title='Species')
plt.tight_layout()

plt.show()
`
  },
  {
    id: 'seaborn-tips-bar',
    title: 'Restaurant Revenue Distribution',
    category: 'Seaborn',
    description: 'Statistical bar plot of total bills categorized by day and gender using Seaborn.',
    code: `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="darkgrid")
df = pd.read_csv('tips.csv')

fig, ax = plt.subplots(figsize=(7, 4.5))
sns.barplot(data=df, x='day', y='total_bill', hue='sex', palette='muted', ax=ax)

ax.set_title('Average Total Bill by Day & Gender', fontsize=14)
ax.set_xlabel('Day of the Week')
ax.set_ylabel('Total Bill ($)')

plt.tight_layout()
plt.show()
`
  },
  {
    id: 'stock-trend-lines',
    title: 'Equities Time Series Analysis',
    category: 'Time Series',
    description: 'Multi-line trend plot comparing daily closing stock prices for tech companies.',
    code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('stocks.csv')
df['date'] = pd.to_datetime(df['date'])

plt.figure(figsize=(7, 4.5))
plt.plot(df['date'], df['AAPL'], marker='o', label='Apple (AAPL)', color='#d44df0', linewidth=2)
plt.plot(df['date'], df['GOOGL'], marker='s', label='Google (GOOGL)', color='#ff7a3d', linewidth=2)
plt.plot(df['date'], df['MSFT'], marker='^', label='Microsoft (MSFT)', color='#0099ff', linewidth=2)

plt.title('Tech Stock Price Trends (Jan 2024)', fontsize=14)
plt.xlabel('Date')
plt.ylabel('Closing Price ($)')
plt.gcf().autofmt_xdate()
plt.grid(True, alpha=0.3)
plt.legend(loc='upper left')
plt.tight_layout()

plt.show()
`
  }
];
