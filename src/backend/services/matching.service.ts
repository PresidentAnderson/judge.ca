import db from '../utils/database';
import { logger } from '../utils/logger';

interface MatchRequest {
  userId: string;
  practiceAreaId: string;
  budgetType: 'hourly' | 'fixed' | 'contingency' | 'flexible';
  budgetMin?: number;
  budgetMax?: number;
  urgency: 'immediate' | 'within_week' | 'within_month' | 'flexible';
  preferredLanguage: 'fr' | 'en';
  location: string;
  caseDescription: string;
  specificRequirements?: string;
}

interface MatchScore {
  attorneyId: string;
  totalScore: number;
  scores: {
    practiceArea: number;
    budget: number;
    language: number;
    location: number;
    availability: number;
    experience: number;
    rating: number;
    responsiveness: number;
  };
  explanation: string[];
}

export class MatchingService {
  private readonly WEIGHTS = {
    practiceArea: 0.25,
    budget: 0.20,
    language: 0.15,
    location: 0.10,
    availability: 0.10,
    experience: 0.10,
    rating: 0.05,
    responsiveness: 0.05
  };

  async findMatches(request: MatchRequest): Promise<MatchScore[]> {
    try {
      // Get all active attorneys with the required practice area
      const attorneys = await db('attorneys')
        .join('attorney_practice_areas', 'attorneys.id', 'attorney_practice_areas.attorney_id')
        .where({
          'attorney_practice_areas.practice_area_id': request.practiceAreaId,
          'attorneys.is_active': true,
          'attorneys.is_verified': true
        })
        .select(
          'attorneys.*',
          'attorney_practice_areas.years_experience as practice_area_experience',
          'attorney_practice_areas.is_primary'
        );

      // Calculate match scores for each attorney
      const matchScores: MatchScore[] = await Promise.all(
        attorneys.map(async (attorney) => {
          const scores = await this.calculateScores(attorney, request);
          const totalScore = this.calculateTotalScore(scores);
          const explanation = this.generateExplanation(attorney, scores, request);

          return {
            attorneyId: attorney.id,
            totalScore,
            scores,
            explanation
          };
        })
      );

      // Sort by total score descending
      matchScores.sort((a, b) => b.totalScore - a.totalScore);

      // Return top matches (limit to 10)
      return matchScores.slice(0, 10);
    } catch (error) {
      logger.error('Error finding matches:', error);
      throw error;
    }
  }

  private async calculateScores(attorney: any, request: MatchRequest) {
    const scores = {
      practiceArea: this.calculatePracticeAreaScore(attorney),
      budget: this.calculateBudgetScore(attorney, request),
      language: this.calculateLanguageScore(attorney, request),
      location: await this.calculateLocationScore(attorney, request),
      availability: await this.calculateAvailabilityScore(attorney, request),
      experience: this.calculateExperienceScore(attorney, request),
      rating: this.calculateRatingScore(attorney),
      responsiveness: await this.calculateResponsivenessScore(attorney)
    };

    return scores;
  }

  private calculatePracticeAreaScore(attorney: any): number {
    // Primary practice area gets full score
    if (attorney.is_primary) return 100;
    
    // Secondary practice areas based on experience
    if (attorney.practice_area_experience >= 10) return 90;
    if (attorney.practice_area_experience >= 5) return 80;
    if (attorney.practice_area_experience >= 3) return 70;
    return 60;
  }

  private calculateBudgetScore(attorney: any, request: MatchRequest): number {
    // Perfect match for flexible budget
    if (request.budgetType === 'flexible') return 100;

    // Check if attorney offers the requested budget type
    if (request.budgetType === 'contingency' && !attorney.contingency_available) return 0;
    if (request.budgetType === 'fixed' && !attorney.fixed_fee_available) return 20;

    // For hourly rates
    if (request.budgetType === 'hourly' && request.budgetMin && request.budgetMax) {
      const attorneyAvgRate = (attorney.hourly_rate_min + attorney.hourly_rate_max) / 2;
      
      // Perfect match
      if (attorneyAvgRate >= request.budgetMin && attorneyAvgRate <= request.budgetMax) {
        return 100;
      }
      
      // Calculate distance from budget range
      if (attorneyAvgRate < request.budgetMin) {
        const percentBelow = (request.budgetMin - attorneyAvgRate) / request.budgetMin;
        return Math.max(0, 100 - (percentBelow * 200)); // Steep penalty for being under budget
      }
      
      if (attorneyAvgRate > request.budgetMax) {
        const percentAbove = (attorneyAvgRate - request.budgetMax) / request.budgetMax;
        return Math.max(0, 100 - (percentAbove * 100)); // Less steep penalty for being over budget
      }
    }

    return 80; // Default score if criteria don't match perfectly
  }

  private calculateLanguageScore(attorney: any, request: MatchRequest): number {
    const attorneyLanguages = JSON.parse(attorney.languages || '[]');
    
    // Perfect match
    if (attorneyLanguages.includes(request.preferredLanguage)) return 100;
    
    // Can work in other language
    if (attorneyLanguages.length > 0) return 50;
    
    return 0;
  }

  private async calculateLocationScore(attorney: any, request: MatchRequest): Promise<number> {
    // Simple implementation - in production, use geocoding API
    const requestCity = request.location.toLowerCase().split(',')[0].trim();
    const attorneyCity = attorney.city?.toLowerCase().trim();
    
    if (requestCity === attorneyCity) return 100;
    
    // Same province
    if (attorney.province === 'QC') return 70;
    
    return 30;
  }

  private async calculateAvailabilityScore(attorney: any, request: MatchRequest): Promise<number> {
    // Check attorney's availability status
    if (attorney.availability_status === 'unavailable') return 0;
    if (attorney.availability_status === 'busy') return 50;
    
    // Factor in urgency
    if (request.urgency === 'immediate' && attorney.availability_status !== 'available') {
      return 25;
    }
    
    // Check calendar availability
    const hasAvailability = await this.checkCalendarAvailability(attorney.id, request.urgency);
    
    return hasAvailability ? 100 : 60;
  }

  private calculateExperienceScore(attorney: any, request: MatchRequest): number {
    const yearsExp = attorney.years_experience;
    
    // Analyze case complexity from description (simple heuristic)
    const complexityKeywords = ['complex', 'corporate', 'international', 'multi-party', 'class action'];
    const isComplex = complexityKeywords.some(keyword => 
      request.caseDescription.toLowerCase().includes(keyword)
    );
    
    if (isComplex) {
      // Complex cases need experienced attorneys
      if (yearsExp >= 15) return 100;
      if (yearsExp >= 10) return 85;
      if (yearsExp >= 5) return 70;
      return 50;
    } else {
      // Simple cases can work with less experienced attorneys
      if (yearsExp >= 3) return 100;
      if (yearsExp >= 1) return 90;
      return 80;
    }
  }

  private calculateRatingScore(attorney: any): number {
    if (attorney.rating_count === 0) return 70; // New attorneys get neutral score
    
    const rating = attorney.rating_average;
    if (rating >= 4.8) return 100;
    if (rating >= 4.5) return 90;
    if (rating >= 4.0) return 80;
    if (rating >= 3.5) return 60;
    return 40;
  }

  private async calculateResponsivenessScore(attorney: any): Promise<number> {
    // Check average response time from past matches
    const avgResponseTime = await db('matches')
      .where('attorney_id', attorney.id)
      .whereNotNull('updated_at')
      .select(db.raw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours'))
      .first();
    
    if (!avgResponseTime || !avgResponseTime.avg_hours) return 70; // No history
    
    const hours = avgResponseTime.avg_hours;
    if (hours <= 4) return 100;
    if (hours <= 12) return 90;
    if (hours <= 24) return 80;
    if (hours <= 48) return 60;
    return 40;
  }

  private calculateTotalScore(scores: any): number {
    let totalScore = 0;
    
    for (const [criterion, score] of Object.entries(scores)) {
      totalScore += (score as number) * this.WEIGHTS[criterion as keyof typeof this.WEIGHTS];
    }
    
    return Math.round(totalScore);
  }

  private generateExplanation(attorney: any, scores: any, request: MatchRequest): string[] {
    const explanations: string[] = [];
    
    // Practice area match
    if (scores.practiceArea >= 90) {
      explanations.push(`Specializes in this area of law${attorney.is_primary ? ' as primary practice' : ''}`);
    }
    
    // Budget match
    if (scores.budget >= 90) {
      explanations.push('Rates align well with your budget');
    } else if (scores.budget >= 70) {
      explanations.push('Rates are close to your budget range');
    }
    
    // Language match
    if (scores.language === 100) {
      explanations.push(`Practices in ${request.preferredLanguage === 'fr' ? 'French' : 'English'}`);
    }
    
    // Location match
    if (scores.location === 100) {
      explanations.push('Located in your city');
    } else if (scores.location >= 70) {
      explanations.push('Located in Quebec');
    }
    
    // Experience
    if (attorney.years_experience >= 10) {
      explanations.push(`${attorney.years_experience} years of experience`);
    }
    
    // Rating
    if (attorney.rating_average >= 4.5 && attorney.rating_count >= 5) {
      explanations.push(`Highly rated (${attorney.rating_average}/5)`);
    }
    
    // Availability
    if (scores.availability === 100 && request.urgency === 'immediate') {
      explanations.push('Available immediately');
    }
    
    return explanations;
  }

  private async checkCalendarAvailability(attorneyId: string, urgency: string): Promise<boolean> {
    // Check attorney's calendar based on urgency
    const daysToCheck = urgency === 'immediate' ? 1 : 
                       urgency === 'within_week' ? 7 : 
                       urgency === 'within_month' ? 30 : 60;
    
    const availability = await db('attorney_availability')
      .where('attorney_id', attorneyId)
      .where('is_available', true)
      .first();
    
    return !!availability;
  }

  async createMatchRecord(matchRequestId: string, attorneyId: string, matchScore: number): Promise<string> {
    const [match] = await db('matches').insert({
      match_request_id: matchRequestId,
      attorney_id: attorneyId,
      match_score: matchScore,
      status: 'proposed'
    }).returning('id');
    
    return match.id;
  }
}