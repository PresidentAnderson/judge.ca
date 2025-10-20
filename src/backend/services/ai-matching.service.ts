import db from '../utils/database';
import { Attorney, MatchRequest, Match } from '../../shared/types';

interface AIMatchingCriteria {
  practiceAreaId: string;
  caseDescription: string;
  budgetType: string;
  budgetMin?: number;
  budgetMax?: number;
  urgency: string;
  preferredLanguage: string;
  location?: string;
  caseComplexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
  clientType?: 'individual' | 'small_business' | 'corporation';
}

interface AIMatchScore {
  attorney: Attorney;
  totalScore: number;
  confidence: number;
  matchReasons: string[];
  riskFactors: string[];
  estimatedCost: {
    min: number;
    max: number;
    currency: 'CAD';
  };
  estimatedDuration: {
    min: number;
    max: number;
    unit: 'days' | 'weeks' | 'months';
  };
}

export class AIMatchingService {
  private readonly ML_WEIGHTS = {
    practiceAreaExpertise: 0.30,
    experienceLevel: 0.25,
    clientFeedback: 0.20,
    availability: 0.10,
    communication: 0.05,
    costAlignment: 0.05,
    geographic: 0.03,
    caseComplexityMatch: 0.02
  };

  async findAdvancedMatches(criteria: AIMatchingCriteria): Promise<AIMatchScore[]> {
    try {
      // Get eligible attorneys
      const attorneys = await this.getEligibleAttorneys(criteria);
      
      // Analyze case complexity using NLP
      const caseComplexity = await this.analyzeCaseComplexity(criteria.caseDescription);
      
      // Score each attorney
      const scoredMatches: AIMatchScore[] = [];
      
      for (const attorney of attorneys) {
        const score = await this.calculateAIScore(attorney, criteria, caseComplexity);
        if (score.totalScore > 0.4) { // Minimum threshold
          scoredMatches.push(score);
        }
      }
      
      // Sort by score and confidence
      return scoredMatches
        .sort((a, b) => {
          const scoreA = a.totalScore * (a.confidence / 100);
          const scoreB = b.totalScore * (b.confidence / 100);
          return scoreB - scoreA;
        })
        .slice(0, 15); // Top 15 matches
        
    } catch (error) {
      console.error('AI Matching error:', error);
      throw new Error('Failed to generate AI matches');
    }
  }

  private async getEligibleAttorneys(criteria: AIMatchingCriteria): Promise<Attorney[]> {
    // Get attorneys with relevant practice areas
    const query = db('attorneys')
      .join('attorney_practice_areas', 'attorneys.id', 'attorney_practice_areas.attorney_id')
      .where('attorney_practice_areas.practice_area_id', criteria.practiceAreaId)
      .where('attorneys.is_active', true)
      .where('attorneys.is_verified', true)
      .select('attorneys.*', 'attorney_practice_areas.years_experience as specialty_experience');
    
    const attorneys = await query;
    return attorneys.map(attorney => this.transformAttorney(attorney));
  }

  private async analyzeCaseComplexity(description: string): Promise<{
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    confidence: number;
    factors: string[];
  }> {
    // Simple NLP analysis for case complexity
    const complexityKeywords = {
      very_complex: [
        'class action', 'securities fraud', 'international', 'multi-jurisdictional',
        'appellate court', 'constitutional', 'precedent-setting', 'regulatory investigation'
      ],
      complex: [
        'corporate merger', 'intellectual property', 'employment discrimination',
        'medical malpractice', 'construction defect', 'environmental liability',
        'tax audit', 'bankruptcy', 'custody battle'
      ],
      moderate: [
        'contract dispute', 'personal injury', 'property damage', 'employment termination',
        'landlord tenant', 'insurance claim', 'small business', 'estate planning'
      ],
      simple: [
        'traffic violation', 'name change', 'will preparation', 'power of attorney',
        'incorporation', 'lease review', 'debt collection', 'small claims'
      ]
    };

    const text = description.toLowerCase();
    const factors: string[] = [];
    let complexity: 'simple' | 'moderate' | 'complex' | 'very_complex' = 'simple';
    let confidence = 50;

    // Check for complexity indicators
    for (const [level, keywords] of Object.entries(complexityKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          complexity = level as any;
          factors.push(keyword);
          confidence += 10;
        }
      }
    }

    // Additional complexity factors
    if (text.length > 500) {
      factors.push('detailed description');
      confidence += 5;
    }
    
    if (text.includes('urgent') || text.includes('immediate')) {
      factors.push('time-sensitive');
      confidence += 5;
    }

    return { complexity, confidence: Math.min(confidence, 95), factors };
  }

  private async calculateAIScore(
    attorney: Attorney, 
    criteria: AIMatchingCriteria, 
    caseAnalysis: any
  ): Promise<AIMatchScore> {
    const scores = {
      practiceAreaExpertise: await this.scorePracticeAreaExpertise(attorney, criteria),
      experienceLevel: this.scoreExperienceLevel(attorney, caseAnalysis.complexity),
      clientFeedback: this.scoreClientFeedback(attorney),
      availability: await this.scoreAvailability(attorney, criteria),
      communication: this.scoreCommunication(attorney, criteria),
      costAlignment: this.scoreCostAlignment(attorney, criteria),
      geographic: this.scoreGeographic(attorney, criteria),
      caseComplexityMatch: this.scoreCaseComplexityMatch(attorney, caseAnalysis)
    };

    // Calculate weighted total score
    let totalScore = 0;
    for (const [factor, score] of Object.entries(scores)) {
      totalScore += score * this.ML_WEIGHTS[factor as keyof typeof this.ML_WEIGHTS];
    }

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(attorney, scores);

    // Generate match reasons
    const matchReasons = this.generateMatchReasons(scores, attorney);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(scores, attorney, caseAnalysis);

    // Estimate costs and duration
    const estimatedCost = this.estimateCost(attorney, criteria, caseAnalysis);
    const estimatedDuration = this.estimateDuration(criteria, caseAnalysis);

    return {
      attorney,
      totalScore,
      confidence,
      matchReasons,
      riskFactors,
      estimatedCost,
      estimatedDuration
    };
  }

  private async scorePracticeAreaExpertise(attorney: Attorney, criteria: AIMatchingCriteria): Promise<number> {
    // Get attorney's specialization data
    const specializations = await db('attorney_practice_areas')
      .join('practice_areas', 'attorney_practice_areas.practice_area_id', 'practice_areas.id')
      .where('attorney_practice_areas.attorney_id', attorney.id)
      .select('*');

    const relevantSpec = specializations.find(spec => spec.practice_area_id === criteria.practiceAreaId);
    
    if (!relevantSpec) {return 0;}

    let score = 0.6; // Base score for having the practice area

    // Bonus for primary specialization
    if (relevantSpec.is_primary) {score += 0.3;}

    // Bonus for years of specialization
    const specYears = relevantSpec.years_experience || 0;
    if (specYears >= 10) {score += 0.1;}
    else if (specYears >= 5) {score += 0.05;}

    return Math.min(score, 1.0);
  }

  private scoreExperienceLevel(attorney: Attorney, complexity: string): number {
    const experienceYears = attorney.yearsExperience;
    
    const experienceRequirements = {
      simple: 1,
      moderate: 3,
      complex: 7,
      very_complex: 12
    };

    const required = experienceRequirements[complexity as keyof typeof experienceRequirements];
    
    if (experienceYears >= required * 2) {return 1.0;}
    if (experienceYears >= required * 1.5) {return 0.9;}
    if (experienceYears >= required) {return 0.8;}
    if (experienceYears >= required * 0.7) {return 0.6;}
    return 0.3;
  }

  private scoreClientFeedback(attorney: Attorney): number {
    const rating = attorney.ratingAverage;
    const reviewCount = attorney.ratingCount;

    if (reviewCount === 0) {return 0.5;} // Neutral for new attorneys

    let score = 0;
    if (rating >= 4.8) {score = 1.0;}
    else if (rating >= 4.5) {score = 0.9;}
    else if (rating >= 4.0) {score = 0.8;}
    else if (rating >= 3.5) {score = 0.6;}
    else {score = 0.3;}

    // Confidence boost for more reviews
    if (reviewCount >= 50) {score += 0.05;}
    else if (reviewCount >= 20) {score += 0.03;}
    else if (reviewCount >= 10) {score += 0.01;}

    return Math.min(score, 1.0);
  }

  private async scoreAvailability(attorney: Attorney, criteria: AIMatchingCriteria): Promise<number> {
    // Check attorney's current availability status
    if (attorney.availabilityStatus === 'unavailable') {return 0;}
    if (attorney.availabilityStatus === 'busy') {return 0.3;}

    let score = 0.8; // Base availability score

    // Check urgency alignment
    const urgencyScore = {
      immediate: attorney.availabilityStatus === 'available' ? 0.2 : 0,
      within_week: 0.15,
      within_month: 0.1,
      flexible: 0.05
    };

    score += urgencyScore[criteria.urgency as keyof typeof urgencyScore] || 0;

    // Check actual calendar availability (simplified)
    const currentCasesCount = await db('matches')
      .where('attorney_id', attorney.id)
      .where('status', 'accepted')
      .whereRaw("created_at > NOW() - INTERVAL '30 days'")
      .count('* as count')
      .first();

    const caseLoad = parseInt(currentCasesCount?.count || '0');
    if (caseLoad < 5) {score += 0.05;}
    else if (caseLoad > 15) {score -= 0.1;}

    return Math.min(score, 1.0);
  }

  private scoreCommunication(attorney: Attorney, criteria: AIMatchingCriteria): number {
    const attorneyLanguages = attorney.languages || [];
    
    if (attorneyLanguages.includes(criteria.preferredLanguage)) {
      return 1.0;
    }
    
    // Partial credit for bilingual attorneys
    if (attorneyLanguages.length > 1) {
      return 0.7;
    }

    return 0.3;
  }

  private scoreCostAlignment(attorney: Attorney, criteria: AIMatchingCriteria): number {
    if (criteria.budgetType === 'flexible') {return 1.0;}

    if (criteria.budgetType === 'contingency') {
      return attorney.contingencyAvailable ? 1.0 : 0;
    }

    if (criteria.budgetType === 'fixed') {
      return attorney.fixedFeeAvailable ? 1.0 : 0.5;
    }

    if (criteria.budgetType === 'hourly' && attorney.hourlyRateMin && attorney.hourlyRateMax) {
      if (!criteria.budgetMax) {return 0.5;}

      const attorneyAvgRate = (attorney.hourlyRateMin + attorney.hourlyRateMax) / 2;
      const clientMaxBudget = criteria.budgetMax;

      if (attorneyAvgRate <= clientMaxBudget) {return 1.0;}
      if (attorneyAvgRate <= clientMaxBudget * 1.2) {return 0.8;}
      if (attorneyAvgRate <= clientMaxBudget * 1.5) {return 0.5;}
      return 0.2;
    }

    return 0.5; // Default neutral score
  }

  private scoreGeographic(attorney: Attorney, criteria: AIMatchingCriteria): number {
    if (!criteria.location || !attorney.city) {return 0.5;}

    const clientCity = criteria.location.toLowerCase();
    const attorneyCity = attorney.city.toLowerCase();

    if (clientCity === attorneyCity) {return 1.0;}
    if (attorney.province === 'QC') {return 0.7;} // Same province
    return 0.3; // Different province
  }

  private scoreCaseComplexityMatch(attorney: Attorney, caseAnalysis: any): number {
    const attorneyExperience = attorney.yearsExperience;
    const complexity = caseAnalysis.complexity;

    const experienceComplexityMatch = {
      simple: attorneyExperience >= 1 ? 1.0 : 0.5,
      moderate: attorneyExperience >= 3 ? 1.0 : attorneyExperience >= 1 ? 0.7 : 0.3,
      complex: attorneyExperience >= 7 ? 1.0 : attorneyExperience >= 5 ? 0.8 : 0.4,
      very_complex: attorneyExperience >= 12 ? 1.0 : attorneyExperience >= 8 ? 0.7 : 0.3
    };

    return experienceComplexityMatch[complexity as keyof typeof experienceComplexityMatch] || 0.5;
  }

  private calculateConfidence(attorney: Attorney, scores: any): number {
    let confidence = 60; // Base confidence

    // Data completeness factors
    if (attorney.bioFr || attorney.bioEn) {confidence += 5;}
    if (attorney.profilePhotoUrl) {confidence += 3;}
    if (attorney.ratingCount > 10) {confidence += 10;}
    if (attorney.ratingCount > 50) {confidence += 5;}
    if (attorney.yearsExperience > 5) {confidence += 5;}
    if (attorney.hourlyRateMin && attorney.hourlyRateMax) {confidence += 7;}

    // Score consistency (low variance indicates reliable data)
    const scoreValues = Object.values(scores) as number[];
    const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
    const variance = scoreValues.reduce((acc, score) => acc + Math.pow(score - avgScore, 2), 0) / scoreValues.length;
    
    if (variance < 0.1) {confidence += 10;} // Low variance = high confidence
    else if (variance > 0.3) {confidence -= 5;} // High variance = lower confidence

    return Math.min(confidence, 98);
  }

  private generateMatchReasons(scores: any, attorney: Attorney): string[] {
    const reasons: string[] = [];

    if (scores.practiceAreaExpertise > 0.8) {
      reasons.push('Expert dans ce domaine juridique');
    }
    
    if (scores.experienceLevel > 0.8) {
      reasons.push(`${attorney.yearsExperience} années d'expérience`);
    }
    
    if (scores.clientFeedback > 0.8) {
      reasons.push(`Excellentes évaluations (${attorney.ratingAverage}/5)`);
    }
    
    if (scores.availability > 0.8) {
      reasons.push('Disponible rapidement');
    }
    
    if (attorney.freeConsultation) {
      reasons.push('Consultation gratuite offerte');
    }
    
    if (scores.costAlignment > 0.8) {
      reasons.push('Tarifs alignés avec votre budget');
    }

    if (scores.geographic > 0.8) {
      reasons.push('Situé dans votre région');
    }

    return reasons;
  }

  private identifyRiskFactors(scores: any, attorney: Attorney, caseAnalysis: any): string[] {
    const risks: string[] = [];

    if (scores.experienceLevel < 0.5) {
      risks.push('Expérience limitée pour ce type de cas');
    }

    if (attorney.ratingCount < 5) {
      risks.push('Peu d\'évaluations clients disponibles');
    }

    if (scores.availability < 0.3) {
      risks.push('Disponibilité limitée');
    }

    if (!attorney.profilePhotoUrl && (!attorney.bioFr && !attorney.bioEn)) {
      risks.push('Profil incomplet');
    }

    if (caseAnalysis.complexity === 'very_complex' && attorney.yearsExperience < 10) {
      risks.push('Cas très complexe nécessitant plus d\'expérience');
    }

    return risks;
  }

  private estimateCost(attorney: Attorney, criteria: AIMatchingCriteria, caseAnalysis: any): {
    min: number;
    max: number;
    currency: 'CAD';
  } {
    let baseMin = 1000;
    let baseMax = 5000;

    // Adjust based on case complexity
    const complexityMultipliers = {
      simple: { min: 0.5, max: 0.7 },
      moderate: { min: 1.0, max: 1.5 },
      complex: { min: 2.0, max: 4.0 },
      very_complex: { min: 5.0, max: 15.0 }
    };

    const multiplier = complexityMultipliers[caseAnalysis.complexity as keyof typeof complexityMultipliers];
    baseMin *= multiplier.min;
    baseMax *= multiplier.max;

    // Adjust based on attorney rates
    if (attorney.hourlyRateMin && attorney.hourlyRateMax) {
      const avgRate = (attorney.hourlyRateMin + attorney.hourlyRateMax) / 2;
      const estimatedHours = {
        simple: { min: 5, max: 15 },
        moderate: { min: 15, max: 40 },
        complex: { min: 40, max: 120 },
        very_complex: { min: 120, max: 500 }
      };

      const hours = estimatedHours[caseAnalysis.complexity as keyof typeof estimatedHours];
      baseMin = Math.max(baseMin, avgRate * hours.min);
      baseMax = Math.max(baseMax, avgRate * hours.max);
    }

    return {
      min: Math.round(baseMin),
      max: Math.round(baseMax),
      currency: 'CAD'
    };
  }

  private estimateDuration(criteria: AIMatchingCriteria, caseAnalysis: any): {
    min: number;
    max: number;
    unit: 'days' | 'weeks' | 'months';
  } {
    const durationEstimates = {
      simple: { min: 1, max: 4, unit: 'weeks' as const },
      moderate: { min: 1, max: 3, unit: 'months' as const },
      complex: { min: 3, max: 12, unit: 'months' as const },
      very_complex: { min: 6, max: 24, unit: 'months' as const }
    };

    const estimate = durationEstimates[caseAnalysis.complexity as keyof typeof durationEstimates];
    
    // Adjust for urgency
    if (criteria.urgency === 'immediate') {
      estimate.min = Math.max(1, Math.floor(estimate.min * 0.7));
      estimate.max = Math.floor(estimate.max * 0.8);
    }

    return estimate;
  }

  private transformAttorney(attorney: any): Attorney {
    return {
      id: attorney.id,
      email: attorney.email,
      barNumber: attorney.bar_number,
      firstName: attorney.first_name,
      lastName: attorney.last_name,
      firmName: attorney.firm_name,
      phone: attorney.phone,
      addressLine1: attorney.address_line1,
      addressLine2: attorney.address_line2,
      city: attorney.city,
      province: attorney.province,
      postalCode: attorney.postal_code,
      yearsExperience: attorney.years_experience,
      hourlyRateMin: attorney.hourly_rate_min,
      hourlyRateMax: attorney.hourly_rate_max,
      fixedFeeAvailable: attorney.fixed_fee_available,
      contingencyAvailable: attorney.contingency_available,
      freeConsultation: attorney.free_consultation,
      consultationFee: attorney.consultation_fee,
      languages: JSON.parse(attorney.languages || '["fr"]'),
      bioFr: attorney.bio_fr,
      bioEn: attorney.bio_en,
      profilePhotoUrl: attorney.profile_photo_url,
      isVerified: attorney.is_verified,
      isActive: attorney.is_active,
      availabilityStatus: attorney.availability_status,
      ratingAverage: parseFloat(attorney.rating_average) || 0,
      ratingCount: attorney.rating_count || 0,
      createdAt: attorney.created_at,
      updatedAt: attorney.updated_at
    };
  }
}