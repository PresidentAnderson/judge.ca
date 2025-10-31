export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email'
  },
  USERS: {
    PROFILE: '/api/users/profile',
    DASHBOARD: '/api/users/dashboard',
    MATCH_REQUESTS: '/api/users/match-requests'
  },
  ATTORNEYS: {
    PROFILE: '/api/attorneys/profile',
    DASHBOARD: '/api/attorneys/dashboard',
    AVAILABILITY: '/api/attorneys/availability',
    STATS: '/api/attorneys/dashboard/stats'
  },
  MATCHES: '/api/matches',
  REVIEWS: '/api/reviews',
  EDUCATION: '/api/education',
  ADMIN: '/api/admin'
};

export const PRACTICE_AREAS = {
  CIVIL_LAW: 'civil_law',
  CRIMINAL_LAW: 'criminal_law',
  FAMILY_LAW: 'family_law',
  CORPORATE_LAW: 'corporate_law',
  REAL_ESTATE: 'real_estate',
  EMPLOYMENT_LAW: 'employment_law',
  IMMIGRATION_LAW: 'immigration_law',
  PERSONAL_INJURY: 'personal_injury',
  INTELLECTUAL_PROPERTY: 'intellectual_property',
  TAX_LAW: 'tax_law'
};

export const BUDGET_TYPES = {
  HOURLY: 'hourly',
  FIXED: 'fixed',
  CONTINGENCY: 'contingency',
  FLEXIBLE: 'flexible'
};

export const URGENCY_LEVELS = {
  IMMEDIATE: 'immediate',
  WITHIN_WEEK: 'within_week',
  WITHIN_MONTH: 'within_month',
  FLEXIBLE: 'flexible'
};

export const MATCH_STATUS = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

export const ATTORNEY_AVAILABILITY = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  UNAVAILABLE: 'unavailable'
};

export const USER_ROLES = {
  USER: 'user',
  ATTORNEY: 'attorney',
  ADMIN: 'admin'
};

export const LANGUAGES = {
  FRENCH: 'fr',
  ENGLISH: 'en'
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  CASE_DESCRIPTION_MIN_LENGTH: 50,
  BIO_MAX_LENGTH: 1000,
  PHONE_REGEX: /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
  POSTAL_CODE_REGEX: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  PROFILE_PHOTO_DIMENSIONS: {
    WIDTH: 400,
    HEIGHT: 400
  }
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'Compte utilisateur créé avec succès',
  ATTORNEY_REGISTERED: 'Compte avocat créé avec succès',
  LOGIN_SUCCESS: 'Connexion réussie',
  PROFILE_UPDATED: 'Profil mis à jour avec succès',
  MATCH_REQUEST_CREATED: 'Demande de correspondance créée',
  MATCH_ACCEPTED: 'Correspondance acceptée',
  EMAIL_SENT: 'Courriel envoyé avec succès'
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Adresse courriel ou mot de passe incorrect',
  EMAIL_ALREADY_EXISTS: 'Cette adresse courriel est déjà utilisée',
  BAR_NUMBER_EXISTS: 'Ce numéro de barreau est déjà utilisé',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  ATTORNEY_NOT_FOUND: 'Avocat non trouvé',
  UNAUTHORIZED: 'Accès non autorisé',
  VALIDATION_FAILED: 'Erreur de validation des données',
  SERVER_ERROR: 'Erreur interne du serveur',
  FILE_TOO_LARGE: 'Fichier trop volumineux',
  INVALID_FILE_TYPE: 'Type de fichier non supporté'
};