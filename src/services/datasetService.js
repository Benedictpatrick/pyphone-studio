// Sample CSV Datasets for Python Data Analysis & Visualization

export const SAMPLE_DATASETS = {
  students_marks: {
    name: "Student Marks & Subject Performance",
    filename: "students_marks.csv",
    description: "Student marks across Math, Science, English, and calculated Average Marks",
    category: "Academic Performance",
    csv: `student_name,math,science,english,average_marks
Arun,78,85,82,81.7
Ben,92,89,86,89.0
Charan,65,72,75,70.7
Divya,88,91,90,89.7
Eva,74,76,80,76.7
Farhan,81,84,79,81.3`
  },
  iris: {
    name: "Iris Flower Dataset",
    filename: "iris.csv",
    description: "Classic dataset with sepal/petal measurements across 3 iris species",
    category: "Classification & Scatter Plots",
    csv: `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
5.4,3.9,1.7,0.4,setosa
4.6,3.4,1.4,0.3,setosa
5.0,3.4,1.5,0.2,setosa
4.4,2.9,1.4,0.2,setosa
4.9,3.1,1.5,0.1,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
5.7,2.8,4.5,1.3,versicolor
6.3,3.3,4.7,1.6,versicolor
4.9,2.4,3.3,1.0,versicolor
6.6,2.9,4.6,1.3,versicolor
5.2,2.7,3.9,1.4,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.8,2.2,virginica
7.6,3.0,6.6,2.1,virginica
4.9,2.5,4.5,1.7,virginica
7.3,2.9,6.3,1.8,virginica
6.7,2.5,5.8,1.8,virginica
7.2,3.6,6.1,2.5,virginica`
  },
  titanic: {
    name: "Titanic Passengers",
    filename: "titanic.csv",
    description: "Passenger demographics, ticket class, and survival status",
    category: "Data Cleaning & Bar/Pie Charts",
    csv: `passenger_id,survived,pclass,sex,age,sibsp,parch,fare,embarked
1,0,3,male,22,1,0,7.25,S
2,1,1,female,38,1,0,71.28,C
3,1,3,female,26,0,0,7.92,S
4,1,1,female,35,1,0,53.10,S
5,0,3,male,35,0,0,8.05,S
6,0,3,male,28,0,0,8.46,Q
7,0,1,male,54,0,0,51.86,S
8,0,3,male,2,3,1,21.07,S
9,1,3,female,27,0,2,11.13,S
10,1,2,female,14,1,0,30.07,C
11,1,3,female,4,1,1,16.70,S
12,1,1,female,58,0,0,26.55,S
13,0,3,male,20,0,0,8.05,S
14,0,3,male,39,1,5,31.27,S
15,0,3,female,14,0,0,7.85,S
16,1,2,female,55,0,0,16.00,S
17,0,3,male,2,4,1,29.12,Q
18,1,2,male,31,0,0,13.00,S
19,0,3,female,31,1,0,18.00,S
20,1,3,female,22,0,0,7.22,C`
  },
  tips: {
    name: "Restaurant Tips",
    filename: "tips.csv",
    description: "Waiter tip records by total bill, day, gender, and party size",
    category: "Seaborn Boxplot & Correlation",
    csv: `total_bill,tip,sex,smoker,day,time,size
16.99,1.01,Female,No,Sun,Dinner,2
10.34,1.66,Male,No,Sun,Dinner,3
21.01,3.50,Male,No,Sun,Dinner,3
23.68,3.31,Male,No,Sun,Dinner,2
24.59,3.61,Female,No,Sun,Dinner,4
25.29,4.71,Male,No,Sun,Dinner,4
8.77,2.00,Male,No,Sun,Dinner,2
26.88,3.12,Male,No,Sun,Dinner,4
15.04,1.96,Male,No,Sun,Dinner,2
14.78,3.23,Male,No,Sun,Dinner,2
10.27,1.71,Male,No,Sun,Dinner,2
35.26,5.00,Female,No,Sun,Dinner,4
15.42,1.57,Male,No,Sun,Dinner,2
18.43,3.00,Male,No,Fri,Dinner,4
14.83,3.02,Female,No,Fri,Dinner,2
21.58,3.41,Male,No,Fri,Dinner,2
10.33,1.67,Female,No,Thu,Lunch,3
16.29,3.71,Male,No,Thu,Lunch,3
16.97,3.50,Female,No,Thu,Lunch,3
20.65,3.35,Male,No,Sat,Dinner,3`
  },
  stocks: {
    name: "Tech Stock Prices",
    filename: "stocks.csv",
    description: "Daily closing prices for Apple, Google, Microsoft, and Amazon",
    category: "Time Series & Line Plots",
    csv: `date,AAPL,GOOGL,MSFT,AMZN,volume
2024-01-02,185.64,138.17,370.87,149.93,52430000
2024-01-03,184.25,138.84,370.60,148.47,49810000
2024-01-04,181.91,136.39,367.94,144.57,51200000
2024-01-05,181.18,135.73,367.75,145.24,47200000
2024-01-08,185.56,138.84,374.69,149.10,59100000
2024-01-09,185.14,140.95,375.79,151.37,42300000
2024-01-10,186.19,142.26,382.77,153.73,46700000
2024-01-11,185.59,142.08,384.63,155.20,49100000
2024-01-12,185.92,142.65,388.47,154.62,40800000
2024-01-16,183.63,143.20,390.27,153.16,45600000`
  }
};
