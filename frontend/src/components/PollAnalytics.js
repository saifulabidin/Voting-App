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
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await API.getAnalytics(id);
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.response?.data?.message || 'Error loading analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!analytics) return null;

  const formatTimePoints = (timePoints) => {
    return timePoints.map(time => {
      const date = new Date(time);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    });
  };

  const countEventsUpToTimePoint = (events, timePoint) => {
    return events.filter(event => new Date(event) <= new Date(timePoint)).length;
  };

  const processTimeSeriesData = () => {
    const { timePoints, viewsOverTime, votesOverTime, sharesOverTime, optionsAddedOverTime } = analytics;
    
    return {
      labels: formatTimePoints(timePoints),
      datasets: [
        {
          label: t('views'),
          data: timePoints.map(time => countEventsUpToTimePoint(viewsOverTime, time)),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: t('votes'),
          data: timePoints.map(time => countEventsUpToTimePoint(votesOverTime, time)),
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.1
        },
        {
          label: t('shares'),
          data: timePoints.map(time => countEventsUpToTimePoint(sharesOverTime, time)),
          borderColor: 'rgb(255, 159, 64)',
          tension: 0.1
        },
        {
          label: t('optionAdds'),
          data: timePoints.map(time => countEventsUpToTimePoint(optionsAddedOverTime, time)),
          borderColor: 'rgb(255, 99, 132)',
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
      },
      title: {
        display: true,
        text: t('engagement')
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
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
          <span className="stat-value">{analytics.totalViews}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('totalVotes')}</span>
          <span className="stat-value">{analytics.totalVotes}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('totalShares')}</span>
          <span className="stat-value">{analytics.totalShares}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('totalOptionsAdded')}</span>
          <span className="stat-value">{analytics.totalOptionsAdded}</span>
        </div>
      </div>

      <div className="analytics-chart">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PollAnalytics;