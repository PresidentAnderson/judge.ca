import { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';

interface AnalyticsQuery {
  timeframe?: string;
  metric?: string;
}

interface DashboardData {
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
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  topPages: Array<{
    page: string;
    views: number;
    avgTime: number;
  }>;
  userGrowth: Array<{
    date: string;
    users: number;
    revenue: number;
  }>;
  errorRate: number;
  uptime: number;
}

// Mock data generator for demonstration
const generateMockData = (timeframe: string): DashboardData => {
  const now = new Date();
  const multiplier = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;

  return {
    totalUsers: Math.floor(1250 * multiplier * 0.1),
    activeConsultations: Math.floor(23 + Math.random() * 10),
    revenue: Math.floor(15750 * multiplier * 0.1),
    conversionRate: 3.2 + Math.random() * 2,
    avgResponseTime: Math.floor(150 + Math.random() * 100),
    systemHealth: Math.random() > 0.8 ? 'warning' : 'good',
    pageViews: Math.floor(8500 * multiplier * 0.1),
    uniqueVisitors: Math.floor(2100 * multiplier * 0.1),
    bounceRate: 32.5 + Math.random() * 10,
    errorRate: Math.random() * 2,
    uptime: 99.8 + Math.random() * 0.2,
    recentActivity: [
      {
        type: 'New User Registration',
        message: 'Client registered for legal consultation',
        timestamp: new Date(now.getTime() - Math.random() * 3600000),
        severity: 'info' as const
      },
      {
        type: 'Attorney Verification',
        message: 'Attorney profile verified successfully',
        timestamp: new Date(now.getTime() - Math.random() * 3600000),
        severity: 'info' as const
      },
      {
        type: 'Consultation Booked',
        message: 'New consultation scheduled for family law',
        timestamp: new Date(now.getTime() - Math.random() * 3600000),
        severity: 'info' as const
      },
      {
        type: 'Payment Processed',
        message: 'Payment of $150 CAD processed successfully',
        timestamp: new Date(now.getTime() - Math.random() * 3600000),
        severity: 'info' as const
      },
      {
        type: 'Error Alert',
        message: 'API response time spike detected',
        timestamp: new Date(now.getTime() - Math.random() * 1800000),
        severity: 'warning' as const
      }
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    topPages: [
      { page: '/attorney-search', views: Math.floor(450 * multiplier * 0.1), avgTime: 180 },
      { page: '/consultation-booking', views: Math.floor(320 * multiplier * 0.1), avgTime: 240 },
      { page: '/legal-guides', views: Math.floor(280 * multiplier * 0.1), avgTime: 300 },
      { page: '/attorney-profiles', views: Math.floor(195 * multiplier * 0.1), avgTime: 150 },
      { page: '/pricing', views: Math.floor(175 * multiplier * 0.1), avgTime: 120 }
    ],
    userGrowth: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      users: Math.floor(150 + Math.random() * 50),
      revenue: Math.floor(2500 + Math.random() * 1000)
    }))
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeframe = '24h', metric } = req.query as AnalyticsQuery;

    // Validate timeframe
    const validTimeframes = ['1h', '24h', '7d', '30d'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ error: 'Invalid timeframe' });
    }

    // In a real implementation, you would:
    // 1. Query your analytics database
    // 2. Fetch data from Google Analytics API
    // 3. Get metrics from your application database
    // 4. Combine data from multiple sources

    const dashboardData = generateMockData(timeframe);

    // If specific metric requested, return only that metric
    if (metric && metric in dashboardData) {
      return res.status(200).json({
        metric,
        value: dashboardData[metric as keyof DashboardData],
        timeframe
      });
    }

    // Log successful analytics request
    console.log(`Analytics dashboard accessed - timeframe: ${timeframe}`);

    // Track the dashboard access
    Sentry.addBreadcrumb({
      message: 'Analytics dashboard accessed',
      category: 'analytics',
      data: { timeframe },
      level: 'info'
    });

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    
    Sentry.captureException(error, {
      tags: {
        section: 'analytics',
        endpoint: 'dashboard'
      },
      extra: {
        query: req.query,
        method: req.method
      }
    });

    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
}