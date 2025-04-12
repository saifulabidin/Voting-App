import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const PollChart = ({ poll }) => {
  if (!poll || !poll.options) return null;

  const data = {
    labels: poll.options.map(opt => opt.option),
    datasets: [
      {
        data: poll.options.map(opt => opt.votes),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF99CC',
          '#99CCFF'
        ],
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} votes (${percentage}%)`;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: true
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default PollChart;