import db from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

interface AttorneyAnalytics {
  attorneyId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    profileViews: number;
    matchRequests: number;
    matchAcceptanceRate: number;
    consultationBookings: number;
    consultationCompletionRate: number;
    averageRating: number;
    totalReviews: number;
    revenue: {
      total: number;
      consultations: number;
      subscriptions: number;
      currency: 'CAD';
    };
    clientRetentionRate: number;
    responseTime: {
      averageHours: number;
      medianHours: number;
    };
    documentShares: number;
    messagesSent: number;
    messagesReceived: number;
  };
  trends: {
    profileViewsTrend: number; // percentage change from previous period
    matchRequestsTrend: number;
    revenueTrend: number;
    ratingTrend: number;
  };
  topPracticeAreas: Array<{
    area: string;
    requests: number;
    acceptanceRate: number;
    averageValue: number;
  }>;
  clientDemographics: {
    ageGroups: Array<{ range: string; count: number; percentage: number }>;
    locations: Array<{ city: string; province: string; count: number }>;
    caseTypes: Array<{ type: string; count: number; percentage: number }>;
  };
  performanceMetrics: {
    qualityScore: number; // out of 100
    reliabilityScore: number;
    professionalismScore: number;
    communicationScore: number;
  };
}

interface PlatformAnalytics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  userMetrics: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    userRetentionRate: number;
    averageSessionDuration: number;
  };
  attorneyMetrics: {
    totalAttorneys: number;
    verifiedAttorneys: number;
    newAttorneys: number;
    activeAttorneys: number;
    averageRating: number;
  };
  matchingMetrics: {
    totalMatches: number;
    successfulMatches: number;
    matchSuccessRate: number;
    averageMatchTime: number; // in hours
    topPracticeAreas: Array<{ area: string; matches: number }>;
  };
  consultationMetrics: {
    totalConsultations: number;
    completedConsultations: number;
    completionRate: number;
    averageDuration: number; // in minutes
    totalRevenue: number;
  };
  geographicDistribution: {
    provinces: Array<{ province: string; users: number; attorneys: number }>;
    cities: Array<{ city: string; province: string; activity: number }>;
  };
  systemMetrics: {
    apiResponseTime: number; // in ms
    errorRate: number; // percentage
    uptime: number; // percentage
  };
}

interface RevenueAnalytics {
  attorneyId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  revenue: {
    total: number;
    consultations: number;
    subscriptions: number;
    documentShares: number;
    commissions: number;
    currency: 'CAD';
  };
  transactions: {
    count: number;
    averageValue: number;
    largestTransaction: number;
    smallestTransaction: number;
  };
  clients: {
    newClients: number;
    returningClients: number;
    totalClients: number;
    averageClientValue: number;
  };
  projections: {
    nextMonth: number;
    nextQuarter: number;
    annualized: number;
  };
  breakdown: Array<{
    date: string;
    consultations: number;
    subscriptions: number;
    total: number;
  }>;
}

export class AnalyticsService {
  async getAttorneyAnalytics(
    attorneyId: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    startDate?: Date,
    endDate?: Date
  ): Promise<AttorneyAnalytics> {
    try {
      const dateRange = this.calculateDateRange(period, startDate, endDate);
      const previousDateRange = this.calculatePreviousDateRange(period, dateRange.startDate, dateRange.endDate);

      // Get current period metrics
      const currentMetrics = await this.calculateAttorneyMetrics(attorneyId, dateRange.startDate, dateRange.endDate);
      
      // Get previous period metrics for trend calculation
      const previousMetrics = await this.calculateAttorneyMetrics(attorneyId, previousDateRange.startDate, previousDateRange.endDate);

      // Calculate trends
      const trends = this.calculateTrends(currentMetrics, previousMetrics);

      // Get top practice areas
      const topPracticeAreas = await this.getTopPracticeAreas(attorneyId, dateRange.startDate, dateRange.endDate);

      // Get client demographics
      const clientDemographics = await this.getClientDemographics(attorneyId, dateRange.startDate, dateRange.endDate);

      // Calculate performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(attorneyId, dateRange.startDate, dateRange.endDate);

      return {
        attorneyId,
        period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        metrics: currentMetrics,
        trends,
        topPracticeAreas,
        clientDemographics,
        performanceMetrics
      };
    } catch (error) {
      console.error('Error getting attorney analytics:', error);
      throw new Error('Failed to get attorney analytics');
    }
  }

  async getRevenueAnalytics(
    attorneyId: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    startDate?: Date,
    endDate?: Date
  ): Promise<RevenueAnalytics> {
    try {
      const dateRange = this.calculateDateRange(period, startDate, endDate);

      // Get revenue data
      const revenueData = await this.calculateRevenueMetrics(attorneyId, dateRange.startDate, dateRange.endDate);

      // Get transaction data
      const transactionData = await this.calculateTransactionMetrics(attorneyId, dateRange.startDate, dateRange.endDate);

      // Get client data
      const clientData = await this.calculateClientMetrics(attorneyId, dateRange.startDate, dateRange.endDate);

      // Calculate projections
      const projections = await this.calculateRevenueProjections(attorneyId, revenueData);

      // Get daily/weekly/monthly breakdown
      const breakdown = await this.getRevenueBreakdown(attorneyId, period, dateRange.startDate, dateRange.endDate);

      return {
        attorneyId,
        period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        revenue: revenueData,
        transactions: transactionData,
        clients: clientData,
        projections,
        breakdown
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw new Error('Failed to get revenue analytics');
    }
  }

  async getPlatformAnalytics(
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    startDate?: Date,
    endDate?: Date
  ): Promise<PlatformAnalytics> {
    try {
      const dateRange = this.calculateDateRange(period, startDate, endDate);

      // Calculate all platform metrics
      const userMetrics = await this.calculateUserMetrics(dateRange.startDate, dateRange.endDate);
      const attorneyMetrics = await this.calculateAttorneyPlatformMetrics(dateRange.startDate, dateRange.endDate);
      const matchingMetrics = await this.calculateMatchingMetrics(dateRange.startDate, dateRange.endDate);
      const consultationMetrics = await this.calculateConsultationMetrics(dateRange.startDate, dateRange.endDate);
      const geographicDistribution = await this.calculateGeographicDistribution(dateRange.startDate, dateRange.endDate);
      const systemMetrics = await this.calculateSystemMetrics(dateRange.startDate, dateRange.endDate);

      return {
        period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        userMetrics,
        attorneyMetrics,
        matchingMetrics,
        consultationMetrics,
        geographicDistribution,
        systemMetrics
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      throw new Error('Failed to get platform analytics');
    }
  }

  async trackEvent(
    eventType: string,
    userId?: string,
    userType?: 'user' | 'attorney',
    metadata?: any
  ): Promise<void> {
    try {
      const eventData = {
        id: uuidv4(),
        event_type: eventType,
        user_id: userId,
        user_type: userType,
        metadata: JSON.stringify(metadata || {}),
        ip_address: 'hidden', // In production, capture from request
        user_agent: 'hidden', // In production, capture from request
        timestamp: new Date(),
        created_at: new Date()
      };

      await db('analytics_events').insert(eventData);
    } catch (error) {
      console.error('Error tracking event:', error);
      // Don't throw - analytics should not break the main flow
    }
  }

  async generateReport(
    reportType: 'attorney_performance' | 'revenue_summary' | 'platform_overview',
    filters: {
      attorneyId?: string;
      period?: 'month' | 'quarter' | 'year';
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    reportId: string;
    reportType: string;
    generatedAt: Date;
    data: any;
    downloadUrl?: string;
  }> {
    try {
      const reportId = uuidv4();
      let reportData: any;

      switch (reportType) {
        case 'attorney_performance':
          if (!filters.attorneyId) {throw new Error('Attorney ID required for performance report');}
          reportData = await this.getAttorneyAnalytics(
            filters.attorneyId,
            filters.period || 'month',
            filters.startDate,
            filters.endDate
          );
          break;

        case 'revenue_summary':
          if (!filters.attorneyId) {throw new Error('Attorney ID required for revenue report');}
          reportData = await this.getRevenueAnalytics(
            filters.attorneyId,
            filters.period || 'month',
            filters.startDate,
            filters.endDate
          );
          break;

        case 'platform_overview':
          reportData = await this.getPlatformAnalytics(
            filters.period || 'month',
            filters.startDate,
            filters.endDate
          );
          break;

        default:
          throw new Error('Invalid report type');
      }

      // Store report
      const reportRecord = {
        id: reportId,
        report_type: reportType,
        filters: JSON.stringify(filters),
        data: JSON.stringify(reportData),
        generated_at: new Date(),
        generated_by: filters.attorneyId || 'system',
        created_at: new Date()
      };

      await db('analytics_reports').insert(reportRecord);

      // Generate PDF/Excel export (mock implementation)
      const downloadUrl = await this.generateReportFile(reportId, reportType, reportData);

      return {
        reportId,
        reportType,
        generatedAt: new Date(),
        data: reportData,
        downloadUrl
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }

  private calculateDateRange(
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    startDate?: Date,
    endDate?: Date
  ): { startDate: Date; endDate: Date } {
    if (startDate && endDate) {
      return { startDate, endDate };
    }

    const now = new Date();
    let start: Date;

    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate: start, endDate: now };
  }

  private calculatePreviousDateRange(
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    startDate: Date,
    endDate: Date
  ): { startDate: Date; endDate: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(startDate.getTime())
    };
  }

  private async calculateAttorneyMetrics(
    attorneyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      // Profile views
      const profileViews = await db('analytics_events')
        .where('event_type', 'attorney_profile_view')
        .where('metadata', 'like', `%"attorneyId":"${attorneyId}"%`)
        .whereBetween('timestamp', [startDate, endDate])
        .count('* as count')
        .first();

      // Match requests
      const matchRequests = await db('matches')
        .where('attorney_id', attorneyId)
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      const acceptedMatches = await db('matches')
        .where('attorney_id', attorneyId)
        .where('status', 'accepted')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      // Consultations
      const consultationBookings = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      const completedConsultations = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .where('status', 'completed')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      // Revenue calculation
      const revenueData = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .where('payment_status', 'paid')
        .whereBetween('created_at', [startDate, endDate])
        .sum('cost_amount as total')
        .first();

      // Rating and reviews
      const ratingData = await db('attorney_reviews')
        .where('attorney_id', attorneyId)
        .whereBetween('created_at', [startDate, endDate])
        .avg('rating as avg_rating')
        .count('* as review_count')
        .first();

      // Response time
      const responseTimeData = await db('messages')
        .join('conversations', 'messages.conversation_id', 'conversations.id')
        .where('conversations.attorney_id', attorneyId)
        .where('messages.sender_type', 'attorney')
        .whereBetween('messages.created_at', [startDate, endDate])
        .select(
          db.raw('AVG(EXTRACT(EPOCH FROM (messages.created_at - LAG(messages.created_at) OVER (PARTITION BY conversation_id ORDER BY created_at)))/3600) as avg_hours')
        )
        .first();

      // Document shares
      const documentShares = await db('shared_documents')
        .where('owner_id', attorneyId)
        .where('owner_type', 'attorney')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      // Messages
      const messagesSent = await db('messages')
        .where('sender_id', attorneyId)
        .where('sender_type', 'attorney')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      const messagesReceived = await db('messages')
        .where('recipient_id', attorneyId)
        .where('recipient_type', 'attorney')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      const matchRequestCount = parseInt(matchRequests?.count || '0');
      const acceptedMatchCount = parseInt(acceptedMatches?.count || '0');
      const consultationBookingCount = parseInt(consultationBookings?.count || '0');
      const completedConsultationCount = parseInt(completedConsultations?.count || '0');

      return {
        profileViews: parseInt(profileViews?.count || '0'),
        matchRequests: matchRequestCount,
        matchAcceptanceRate: matchRequestCount > 0 ? (acceptedMatchCount / matchRequestCount) * 100 : 0,
        consultationBookings: consultationBookingCount,
        consultationCompletionRate: consultationBookingCount > 0 ? (completedConsultationCount / consultationBookingCount) * 100 : 0,
        averageRating: parseFloat(ratingData?.avg_rating || '0'),
        totalReviews: parseInt(ratingData?.review_count || '0'),
        revenue: {
          total: parseFloat(revenueData?.total || '0'),
          consultations: parseFloat(revenueData?.total || '0'),
          subscriptions: 0, // To be implemented
          currency: 'CAD'
        },
        clientRetentionRate: 0, // To be calculated
        responseTime: {
          averageHours: parseFloat(responseTimeData?.avg_hours || '0'),
          medianHours: 0 // To be calculated
        },
        documentShares: parseInt(documentShares?.count || '0'),
        messagesSent: parseInt(messagesSent?.count || '0'),
        messagesReceived: parseInt(messagesReceived?.count || '0')
      };
    } catch (error) {
      console.error('Error calculating attorney metrics:', error);
      throw new Error('Failed to calculate attorney metrics');
    }
  }

  private calculateTrends(currentMetrics: any, previousMetrics: any): any {
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) {return current > 0 ? 100 : 0;}
      return ((current - previous) / previous) * 100;
    };

    return {
      profileViewsTrend: calculatePercentageChange(currentMetrics.profileViews, previousMetrics.profileViews),
      matchRequestsTrend: calculatePercentageChange(currentMetrics.matchRequests, previousMetrics.matchRequests),
      revenueTrend: calculatePercentageChange(currentMetrics.revenue.total, previousMetrics.revenue.total),
      ratingTrend: calculatePercentageChange(currentMetrics.averageRating, previousMetrics.averageRating)
    };
  }

  private async getTopPracticeAreas(
    attorneyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ area: string; requests: number; acceptanceRate: number; averageValue: number }>> {
    try {
      const practiceAreaData = await db('matches')
        .join('practice_areas', 'matches.practice_area_id', 'practice_areas.id')
        .where('matches.attorney_id', attorneyId)
        .whereBetween('matches.created_at', [startDate, endDate])
        .groupBy('practice_areas.name_en', 'practice_areas.id')
        .select(
          'practice_areas.name_en as area',
          db.raw('COUNT(*) as requests'),
          db.raw('COUNT(CASE WHEN matches.status = \'accepted\' THEN 1 END) as accepted'),
          db.raw('AVG(CASE WHEN video_consultations.cost_amount IS NOT NULL THEN video_consultations.cost_amount END) as avg_value')
        )
        .leftJoin('video_consultations', 'matches.id', 'video_consultations.match_id')
        .orderBy('requests', 'desc')
        .limit(5);

      return practiceAreaData.map(area => ({
        area: area.area,
        requests: parseInt(area.requests),
        acceptanceRate: area.requests > 0 ? (parseInt(area.accepted) / parseInt(area.requests)) * 100 : 0,
        averageValue: parseFloat(area.avg_value || '0')
      }));
    } catch (error) {
      console.error('Error getting top practice areas:', error);
      return [];
    }
  }

  private async getClientDemographics(
    attorneyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      // Age groups (mock data - in production, calculate from user birth dates)
      const ageGroups = [
        { range: '18-25', count: 15, percentage: 20 },
        { range: '26-35', count: 25, percentage: 33 },
        { range: '36-45', count: 20, percentage: 27 },
        { range: '46-55', count: 10, percentage: 13 },
        { range: '55+', count: 5, percentage: 7 }
      ];

      // Locations
      const locations = await db('matches')
        .join('users', 'matches.user_id', 'users.id')
        .where('matches.attorney_id', attorneyId)
        .whereBetween('matches.created_at', [startDate, endDate])
        .groupBy('users.city', 'users.province')
        .select(
          'users.city',
          'users.province',
          db.raw('COUNT(*) as count')
        )
        .orderBy('count', 'desc')
        .limit(10);

      // Case types
      const caseTypes = await db('matches')
        .join('practice_areas', 'matches.practice_area_id', 'practice_areas.id')
        .where('matches.attorney_id', attorneyId)
        .whereBetween('matches.created_at', [startDate, endDate])
        .groupBy('practice_areas.name_en')
        .select(
          'practice_areas.name_en as type',
          db.raw('COUNT(*) as count')
        )
        .orderBy('count', 'desc');

      const totalCases = caseTypes.reduce((sum, caseType) => sum + parseInt(caseType.count), 0);

      return {
        ageGroups,
        locations: locations.map(loc => ({
          city: loc.city,
          province: loc.province,
          count: parseInt(loc.count)
        })),
        caseTypes: caseTypes.map(caseType => ({
          type: caseType.type,
          count: parseInt(caseType.count),
          percentage: totalCases > 0 ? (parseInt(caseType.count) / totalCases) * 100 : 0
        }))
      };
    } catch (error) {
      console.error('Error getting client demographics:', error);
      return { ageGroups: [], locations: [], caseTypes: [] };
    }
  }

  private async calculatePerformanceMetrics(
    attorneyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      // Quality score based on ratings and reviews
      const ratingData = await db('attorney_reviews')
        .where('attorney_id', attorneyId)
        .whereBetween('created_at', [startDate, endDate])
        .avg('rating as avg_rating')
        .avg('quality_score as avg_quality')
        .avg('reliability_score as avg_reliability')
        .avg('professionalism_score as avg_professionalism')
        .avg('communication_score as avg_communication')
        .first();

      return {
        qualityScore: Math.round(parseFloat(ratingData?.avg_quality || '80')), // Mock default
        reliabilityScore: Math.round(parseFloat(ratingData?.avg_reliability || '85')), // Mock default
        professionalismScore: Math.round(parseFloat(ratingData?.avg_professionalism || '90')), // Mock default
        communicationScore: Math.round(parseFloat(ratingData?.avg_communication || '88')) // Mock default
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        qualityScore: 80,
        reliabilityScore: 85,
        professionalismScore: 90,
        communicationScore: 88
      };
    }
  }

  private async calculateRevenueMetrics(
    attorneyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const consultationRevenue = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .where('payment_status', 'paid')
        .whereBetween('created_at', [startDate, endDate])
        .sum('cost_amount as total')
        .first();

      // Mock subscription and other revenue streams
      const subscriptionRevenue = 0;
      const documentRevenue = 0;
      const commissionRevenue = 0;

      const totalRevenue = parseFloat(consultationRevenue?.total || '0');

      return {
        total: totalRevenue + subscriptionRevenue + documentRevenue + commissionRevenue,
        consultations: totalRevenue,
        subscriptions: subscriptionRevenue,
        documentShares: documentRevenue,
        commissions: commissionRevenue,
        currency: 'CAD'
      };
    } catch (error) {
      console.error('Error calculating revenue metrics:', error);
      return {
        total: 0,
        consultations: 0,
        subscriptions: 0,
        documentShares: 0,
        commissions: 0,
        currency: 'CAD'
      };
    }
  }

  private async calculateTransactionMetrics(
    attorneyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const transactionData = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .where('payment_status', 'paid')
        .whereBetween('created_at', [startDate, endDate])
        .select(
          db.raw('COUNT(*) as count'),
          db.raw('AVG(cost_amount) as avg_value'),
          db.raw('MAX(cost_amount) as max_value'),
          db.raw('MIN(cost_amount) as min_value')
        )
        .first();

      return {
        count: parseInt(transactionData?.count || '0'),
        averageValue: parseFloat(transactionData?.avg_value || '0'),
        largestTransaction: parseFloat(transactionData?.max_value || '0'),
        smallestTransaction: parseFloat(transactionData?.min_value || '0')
      };
    } catch (error) {
      console.error('Error calculating transaction metrics:', error);
      return {
        count: 0,
        averageValue: 0,
        largestTransaction: 0,
        smallestTransaction: 0
      };
    }
  }

  private async calculateClientMetrics(
    attorneyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      // New vs returning clients based on consultation history
      const clientData = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .whereBetween('created_at', [startDate, endDate])
        .select('user_id')
        .distinct();

      const newClientsData = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .whereBetween('created_at', [startDate, endDate])
        .whereNotExists(function() {
          this.select('*')
            .from('video_consultations as vc2')
            .whereRaw('vc2.user_id = video_consultations.user_id')
            .whereRaw('vc2.attorney_id = video_consultations.attorney_id')
            .where('vc2.created_at', '<', startDate);
        })
        .count('DISTINCT user_id as count')
        .first();

      const totalClients = clientData.length;
      const newClients = parseInt(newClientsData?.count || '0');
      const returningClients = totalClients - newClients;

      // Average client value
      const averageClientValue = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .where('payment_status', 'paid')
        .whereBetween('created_at', [startDate, endDate])
        .select(
          db.raw('AVG(total_per_client.total) as avg_value')
        )
        .from(
          db('video_consultations')
            .where('attorney_id', attorneyId)
            .where('payment_status', 'paid')
            .whereBetween('created_at', [startDate, endDate])
            .groupBy('user_id')
            .select('user_id', db.raw('SUM(cost_amount) as total'))
            .as('total_per_client')
        )
        .first();

      return {
        newClients,
        returningClients,
        totalClients,
        averageClientValue: parseFloat(averageClientValue?.avg_value || '0')
      };
    } catch (error) {
      console.error('Error calculating client metrics:', error);
      return {
        newClients: 0,
        returningClients: 0,
        totalClients: 0,
        averageClientValue: 0
      };
    }
  }

  private async calculateRevenueProjections(
    attorneyId: string,
    currentRevenue: any
  ): Promise<any> {
    // Simple projection logic - in production, use more sophisticated modeling
    const monthlyAverage = currentRevenue.total;
    
    return {
      nextMonth: monthlyAverage * 1.05, // 5% growth assumption
      nextQuarter: monthlyAverage * 3 * 1.1, // 10% quarterly growth
      annualized: monthlyAverage * 12 * 1.15 // 15% annual growth
    };
  }

  private async getRevenueBreakdown(
    attorneyId: string,
    period: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      let dateFormat: string;
      
      switch (period) {
        case 'day':
          dateFormat = 'YYYY-MM-DD HH24:00:00';
          break;
        case 'week':
        case 'month':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'quarter':
        case 'year':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      const breakdownData = await db('video_consultations')
        .where('attorney_id', attorneyId)
        .where('payment_status', 'paid')
        .whereBetween('created_at', [startDate, endDate])
        .select(
          db.raw(`TO_CHAR(created_at, '${dateFormat}') as date`),
          db.raw('COUNT(*) as consultations'),
          db.raw('SUM(cost_amount) as total')
        )
        .groupBy('date')
        .orderBy('date');

      return breakdownData.map(item => ({
        date: item.date,
        consultations: parseInt(item.consultations),
        subscriptions: 0, // To be implemented
        total: parseFloat(item.total)
      }));
    } catch (error) {
      console.error('Error getting revenue breakdown:', error);
      return [];
    }
  }

  private async calculateUserMetrics(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation - in production, implement full user analytics
    return {
      totalUsers: 1500,
      newUsers: 120,
      activeUsers: 800,
      userRetentionRate: 75,
      averageSessionDuration: 1800 // seconds
    };
  }

  private async calculateAttorneyPlatformMetrics(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation - in production, implement full attorney analytics
    return {
      totalAttorneys: 200,
      verifiedAttorneys: 180,
      newAttorneys: 15,
      activeAttorneys: 150,
      averageRating: 4.6
    };
  }

  private async calculateMatchingMetrics(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation - in production, implement full matching analytics
    return {
      totalMatches: 500,
      successfulMatches: 350,
      matchSuccessRate: 70,
      averageMatchTime: 24, // hours
      topPracticeAreas: [
        { area: 'Family Law', matches: 150 },
        { area: 'Corporate Law', matches: 100 },
        { area: 'Criminal Law', matches: 80 }
      ]
    };
  }

  private async calculateConsultationMetrics(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation - in production, implement full consultation analytics
    return {
      totalConsultations: 300,
      completedConsultations: 280,
      completionRate: 93.3,
      averageDuration: 45, // minutes
      totalRevenue: 45000
    };
  }

  private async calculateGeographicDistribution(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation - in production, implement geographic analytics
    return {
      provinces: [
        { province: 'QC', users: 500, attorneys: 80 },
        { province: 'ON', users: 600, attorneys: 90 },
        { province: 'BC', users: 300, attorneys: 25 }
      ],
      cities: [
        { city: 'Montreal', province: 'QC', activity: 1000 },
        { city: 'Toronto', province: 'ON', activity: 1200 },
        { city: 'Vancouver', province: 'BC', activity: 600 }
      ]
    };
  }

  private async calculateSystemMetrics(startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation - in production, implement system monitoring
    return {
      apiResponseTime: 150, // ms
      errorRate: 0.5, // percentage
      uptime: 99.9 // percentage
    };
  }

  private async generateReportFile(
    reportId: string,
    reportType: string,
    data: any
  ): Promise<string> {
    // Mock implementation - in production, generate PDF/Excel files
    return `https://reports.judge.ca/${reportId}.pdf`;
  }
}

// Database schema additions needed:
/*
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID,
  user_type VARCHAR(20) CHECK (user_type IN ('user', 'attorney')),
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type VARCHAR(50) NOT NULL,
  filters JSONB NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by UUID,
  download_url VARCHAR(500),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attorney_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES video_consultations(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 100),
  reliability_score INTEGER CHECK (reliability_score >= 1 AND reliability_score <= 100),
  professionalism_score INTEGER CHECK (professionalism_score >= 1 AND professionalism_score <= 100),
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 100),
  review_text TEXT,
  is_verified_client BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, user_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_reports_type ON analytics_reports(report_type);
CREATE INDEX idx_attorney_reviews_attorney ON attorney_reviews(attorney_id);
CREATE INDEX idx_attorney_reviews_rating ON attorney_reviews(rating);
*/