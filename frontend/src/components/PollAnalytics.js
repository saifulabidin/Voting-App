import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import '../styles/poll-analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PollAnalytics = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalVotes: 0,
    totalShares: 0,
    totalOptionsAdded: 0,
    viewsOverTime: [],
    votesOverTime: [],
    sharesOverTime: [],
    optionsAddedOverTime: [],
    timePoints: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await API.getAnalytics(id);
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.response?.data?.message || 'Error loading analytics');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnalytics();
    }
  }, [id]);

  if (loading) return <div className="loading">{t('loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  const formatTimePoints = (timePoints = []) => {
    return timePoints.map(time => {
      const date = new Date(time);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    });
  };

  const countEventsUpToTimePoint = (events = [], timePoint) => {
    return events.filter(event => new Date(event) <= new Date(timePoint)).length;
  };

  const processTimeSeriesData = () => {
    const { timePoints = [], viewsOverTime = [], votesOverTime = [], sharesOverTime = [], optionsAddedOverTime = [] } = analytics;
    
    return {
      labels: formatTimePoints(timePoints),
      datasets: [
        {
          label: t('views'),
          data: timePoints.map(time => countEventsUpToTimePoint(viewsOverTime, time)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1
        },
        {
          label: t('votes'),
          data: timePoints.map(time => countEventsUpToTimePoint(votesOverTime, time)),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.1
        },
        {
          label: t('shares'),
          data: timePoints.map(time => countEventsUpToTimePoint(sharesOverTime, time)),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.1
        },
        {
          label: t('optionAdds'),
          data: timePoints.map(time => countEventsUpToTimePoint(optionsAddedOverTime, time)),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1
        }
      ]
    };
  };

  const chartData = processTimeSeriesData();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: t('engagement'),
        color: '#94a3b8',
        font: {
          size: 16,
          weight: '500'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#242830',
        titleColor: '#ffffff',
        bodyColor: '#94a3b8',
        borderColor: '#3f4451',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#94a3b8'
        },
        grid: {
          color: '#3f4451',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#94a3b8',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: '#3f4451',
          drawBorder: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="analytics-container">
      <h2>{t('analyticsTitle')}</h2>
      
      <div className="analytics-stats">
        <div className="stat-item">
          <span className="stat-label">{t('totalViews')}</span>
          <span className="stat-value">{analytics.totalViews || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('totalVotes')}</span>
          <span className="stat-value">{analytics.totalVotes || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('totalShares')}</span>
          <span className="stat-value">{analytics.totalShares || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('totalOptionsAdded')}</span>
          <span className="stat-value">{analytics.totalOptionsAdded || 0}</span>
        </div>
      </div>

      <div className="analytics-chart">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PollAnalytics;