import { Knex } from 'knex';
import { User, Attorney, PracticeArea, MatchRequest, Match, Review } from '../../shared/types';

export class UserModel {
  constructor(private db: Knex) {}

  async create(userData: Partial<User>): Promise<User> {
    const [user] = await this.db('users')
      .insert({
        email: userData.email,
        password_hash: userData.passwordHash,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        preferred_language: userData.preferredLanguage || 'fr'
      })
      .returning('*');
    
    return this.transformUser(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.db('users')
      .where('id', id)
      .whereNull('deleted_at')
      .first();
    
    return user ? this.transformUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db('users')
      .where('email', email)
      .whereNull('deleted_at')
      .first();
    
    return user ? this.transformUser(user) : null;
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await this.db('users')
      .where('id', id)
      .update({
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        preferred_language: userData.preferredLanguage,
        is_verified: userData.isVerified,
        email_verified_at: userData.emailVerifiedAt,
        updated_at: new Date()
      })
      .returning('*');
    
    return this.transformUser(user);
  }

  private transformUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      preferredLanguage: user.preferred_language,
      isVerified: user.is_verified,
      emailVerifiedAt: user.email_verified_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
}

export class AttorneyModel {
  constructor(private db: Knex) {}

  async create(attorneyData: Partial<Attorney>): Promise<Attorney> {
    const [attorney] = await this.db('attorneys')
      .insert({
        email: attorneyData.email,
        password_hash: attorneyData.passwordHash,
        bar_number: attorneyData.barNumber,
        first_name: attorneyData.firstName,
        last_name: attorneyData.lastName,
        firm_name: attorneyData.firmName,
        phone: attorneyData.phone,
        address_line1: attorneyData.addressLine1,
        address_line2: attorneyData.addressLine2,
        city: attorneyData.city,
        province: attorneyData.province || 'QC',
        postal_code: attorneyData.postalCode,
        years_experience: attorneyData.yearsExperience,
        hourly_rate_min: attorneyData.hourlyRateMin,
        hourly_rate_max: attorneyData.hourlyRateMax,
        fixed_fee_available: attorneyData.fixedFeeAvailable,
        contingency_available: attorneyData.contingencyAvailable,
        free_consultation: attorneyData.freeConsultation,
        consultation_fee: attorneyData.consultationFee,
        languages: JSON.stringify(attorneyData.languages || ['fr']),
        bio_fr: attorneyData.bioFr,
        bio_en: attorneyData.bioEn
      })
      .returning('*');
    
    return this.transformAttorney(attorney);
  }

  async findById(id: string): Promise<Attorney | null> {
    const attorney = await this.db('attorneys')
      .where('id', id)
      .whereNull('deleted_at')
      .first();
    
    return attorney ? this.transformAttorney(attorney) : null;
  }

  async findByEmail(email: string): Promise<Attorney | null> {
    const attorney = await this.db('attorneys')
      .where('email', email)
      .whereNull('deleted_at')
      .first();
    
    return attorney ? this.transformAttorney(attorney) : null;
  }

  async findByBarNumber(barNumber: string): Promise<Attorney | null> {
    const attorney = await this.db('attorneys')
      .where('bar_number', barNumber)
      .whereNull('deleted_at')
      .first();
    
    return attorney ? this.transformAttorney(attorney) : null;
  }

  async findActiveAttorneys(practiceAreaId?: string, limit = 50): Promise<Attorney[]> {
    let query = this.db('attorneys')
      .where('is_active', true)
      .where('availability_status', 'available')
      .whereNull('deleted_at');

    if (practiceAreaId) {
      query = query
        .join('attorney_practice_areas', 'attorneys.id', 'attorney_practice_areas.attorney_id')
        .where('attorney_practice_areas.practice_area_id', practiceAreaId);
    }

    const attorneys = await query
      .orderBy('rating_average', 'desc')
      .limit(limit);

    return attorneys.map(attorney => this.transformAttorney(attorney));
  }

  async update(id: string, attorneyData: Partial<Attorney>): Promise<Attorney> {
    const [attorney] = await this.db('attorneys')
      .where('id', id)
      .update({
        first_name: attorneyData.firstName,
        last_name: attorneyData.lastName,
        firm_name: attorneyData.firmName,
        phone: attorneyData.phone,
        address_line1: attorneyData.addressLine1,
        address_line2: attorneyData.addressLine2,
        city: attorneyData.city,
        province: attorneyData.province,
        postal_code: attorneyData.postalCode,
        years_experience: attorneyData.yearsExperience,
        hourly_rate_min: attorneyData.hourlyRateMin,
        hourly_rate_max: attorneyData.hourlyRateMax,
        fixed_fee_available: attorneyData.fixedFeeAvailable,
        contingency_available: attorneyData.contingencyAvailable,
        free_consultation: attorneyData.freeConsultation,
        consultation_fee: attorneyData.consultationFee,
        languages: JSON.stringify(attorneyData.languages),
        bio_fr: attorneyData.bioFr,
        bio_en: attorneyData.bioEn,
        profile_photo_url: attorneyData.profilePhotoUrl,
        is_verified: attorneyData.isVerified,
        is_active: attorneyData.isActive,
        availability_status: attorneyData.availabilityStatus,
        updated_at: new Date()
      })
      .returning('*');
    
    return this.transformAttorney(attorney);
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

export class PracticeAreaModel {
  constructor(private db: Knex) {}

  async findAll(): Promise<PracticeArea[]> {
    const areas = await this.db('practice_areas')
      .orderBy('name_fr');
    
    return areas.map(area => this.transformPracticeArea(area));
  }

  async findById(id: string): Promise<PracticeArea | null> {
    const area = await this.db('practice_areas')
      .where('id', id)
      .first();
    
    return area ? this.transformPracticeArea(area) : null;
  }

  private transformPracticeArea(area: any): PracticeArea {
    return {
      id: area.id,
      nameFr: area.name_fr,
      nameEn: area.name_en,
      descriptionFr: area.description_fr,
      descriptionEn: area.description_en,
      parentId: area.parent_id,
      createdAt: area.created_at
    };
  }
}

export class MatchRequestModel {
  constructor(private db: Knex) {}

  async create(requestData: Partial<MatchRequest>): Promise<MatchRequest> {
    const [request] = await this.db('match_requests')
      .insert({
        user_id: requestData.userId,
        practice_area_id: requestData.practiceAreaId,
        case_description: requestData.caseDescription,
        budget_type: requestData.budgetType,
        budget_min: requestData.budgetMin,
        budget_max: requestData.budgetMax,
        urgency: requestData.urgency,
        preferred_language: requestData.preferredLanguage,
        additional_requirements: requestData.additionalRequirements
      })
      .returning('*');
    
    return this.transformMatchRequest(request);
  }

  async findById(id: string): Promise<MatchRequest | null> {
    const request = await this.db('match_requests')
      .where('id', id)
      .first();
    
    return request ? this.transformMatchRequest(request) : null;
  }

  async findByUserId(userId: string): Promise<MatchRequest[]> {
    const requests = await this.db('match_requests')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
    
    return requests.map(request => this.transformMatchRequest(request));
  }

  private transformMatchRequest(request: any): MatchRequest {
    return {
      id: request.id,
      userId: request.user_id,
      practiceAreaId: request.practice_area_id,
      caseDescription: request.case_description,
      budgetType: request.budget_type,
      budgetMin: request.budget_min,
      budgetMax: request.budget_max,
      urgency: request.urgency,
      preferredLanguage: request.preferred_language,
      additionalRequirements: request.additional_requirements,
      status: request.status,
      createdAt: request.created_at,
      updatedAt: request.updated_at
    };
  }
}