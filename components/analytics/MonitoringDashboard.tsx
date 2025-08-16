import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  Eye,
  MessageSquare,
  Star,
  Clock
} from 'lucide-react';

interface DashboardMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
}

interface AnalyticsData {
  totalUsers: number;
  activeConsultations: number;
  revenue: number;
  conversionRate: number;
  avgResponseTime: number;
  systemHealth: 'good' | 'warning' | 'critical';
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: Date;
    severity: 'info' | 'warning' | 'error';
  }>;
}

const MonitoringDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeConsultations: 0,
    revenue: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    systemHealth: 'good',
    recentActivity: []
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics/dashboard?timeframe=${selectedTimeframe}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics: DashboardMetric[] = [
    {
      label: 'Total Users',
      value: analyticsData.totalUsers.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: Users
    },
    {
      label: 'Active Consultations',
      value: analyticsData.activeConsultations,
      change: '+8.3%',
      trend: 'up',
      icon: Calendar
    },
    {
      label: 'Revenue',
      value: `$${analyticsData.revenue.toLocaleString()}`,
      change: '+15.2%',
      trend: 'up',
      icon: DollarSign
    },
    {
      label: 'Conversion Rate',
      value: `${analyticsData.conversionRate.toFixed(1)}%`,
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp
    },
    {
      label: 'Avg Response Time',
      value: `${analyticsData.avgResponseTime}ms`,
      change: '-5.4%',
      trend: 'up',
      icon: Clock
    },
    {
      label: 'System Health',
      value: analyticsData.systemHealth.toUpperCase(),
      change: 'Stable',
      trend: analyticsData.systemHealth === 'good' ? 'up' : analyticsData.systemHealth === 'warning' ? 'neutral' : 'down',
      icon: Activity
    }
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Real-Time Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className={`text-sm mt-1 ${getTrendColor(metric.trend)}`}>
                    {metric.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  metric.label === 'System Health' 
                    ? getHealthColor(analyticsData.systemHealth)
                    : 'bg-blue-100'
                }`}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Real-Time Activity Feed
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analyticsData.recentActivity.length > 0 ? (
              analyticsData.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getSeverityColor(activity.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{activity.type}</p>
                      <p className="text-sm text-gray-600 mt-1">{activity.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity to display</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            System Alerts
          </h3>
        </div>
        <div className="p-6">
          {analyticsData.systemHealth === 'good' ? (
            <div className="text-center py-8">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">All systems operational</p>
              <p className="text-gray-500 text-sm mt-1">No alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 font-medium">Performance Warning</p>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Response times are higher than usual. Monitoring the situation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">View Details</p>
              <p className="text-sm text-gray-600">Full analytics report</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <MessageSquare className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Export Data</p>
              <p className="text-sm text-gray-600">Download CSV report</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Star className="h-6 w-6 text-yellow-600 mb-2" />
              <p className="font-medium text-gray-900">Set Alerts</p>
              <p className="text-sm text-gray-600">Configure notifications</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Trends</p>
              <p className="text-sm text-gray-600">View historical data</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;