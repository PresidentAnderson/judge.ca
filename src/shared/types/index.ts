export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredLanguage: 'fr' | 'en';
  isVerified: boolean;
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attorney {
  id: string;
  email: string;
  barNumber: string;
  firstName: string;
  lastName: string;
  firmName?: string;
  phone: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province: string;
  postalCode?: string;
  yearsExperience: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  fixedFeeAvailable: boolean;
  contingencyAvailable: boolean;
  freeConsultation: boolean;
  consultationFee?: number;
  languages: string[];
  bioFr?: string;
  bioEn?: string;
  profilePhotoUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeArea {
  id: string;
  nameFr: string;
  nameEn: string;
  descriptionFr?: string;
  descriptionEn?: string;
  parentId?: string;
  createdAt: Date;
}

export interface MatchRequest {
  id: string;
  userId: string;
  practiceAreaId: string;
  caseDescription: string;
  budgetType: 'hourly' | 'fixed' | 'contingency' | 'flexible';
  budgetMin?: number;
  budgetMax?: number;
  urgency: 'immediate' | 'within_week' | 'within_month' | 'flexible';
  preferredLanguage: 'fr' | 'en';
  additionalRequirements?: string;
  status: 'pending' | 'matched' | 'cancelled' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  matchRequestId: string;
  attorneyId: string;
  matchScore: number;
  status: 'proposed' | 'accepted' | 'rejected' | 'expired';
  attorneyResponse?: string;
  userFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  attorneyId: string;
  userId: string;
  matchId?: string;
  rating: number;
  reviewText?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttorneyAvailability {
  id: string;
  attorneyId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId?: string;
  attorneyId?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface EducationalContent {
  id: string;
  titleFr: string;
  titleEn: string;
  contentFr: string;
  contentEn: string;
  category?: string;
  tags?: string[];
  author?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
  attorney?: Attorney;
  expiresIn: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}