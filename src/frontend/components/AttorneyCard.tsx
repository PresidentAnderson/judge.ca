import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

interface AttorneyCardProps {
  attorney: {
    id: string;
    firstName: string;
    lastName: string;
    firmName?: string;
    profilePhotoUrl?: string;
    ratingAverage: number;
    ratingCount: number;
    yearsExperience: number;
    languages: string[];
    bioFr?: string;
    bioEn?: string;
    hourlyRateMin?: number;
    hourlyRateMax?: number;
    freeConsultation: boolean;
    practiceAreas?: Array<{
      nameFr: string;
      nameEn: string;
      isPrimary: boolean;
    }>;
  };
  matchScore?: number;
  matchReasons?: string[];
  showMatchInfo?: boolean;
}

export const AttorneyCard: React.FC<AttorneyCardProps> = ({
  attorney,
  matchScore,
  matchReasons,
  showMatchInfo = false
}) => {
  const { t, i18n } = useTranslation('common');
  const isFrenchl = i18n.language === 'fr';

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-${attorney.id}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#e5e5e5" />
              </linearGradient>
            </defs>
            <path fill={`url(#half-${attorney.id})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }

    return stars;
  };

  const getBio = () => {
    if (isFrenchl && attorney.bioFr) return attorney.bioFr;
    if (!isFrenchl && attorney.bioEn) return attorney.bioEn;
    return attorney.bioFr || attorney.bioEn || '';
  };

  const formatRate = () => {
    if (attorney.hourlyRateMin && attorney.hourlyRateMax) {
      return `${attorney.hourlyRateMin}$ - ${attorney.hourlyRateMax}$ /h`;
    }
    return t('attorney.rateOnRequest');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Match Score Banner */}
      {showMatchInfo && matchScore && (
        <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {Math.round(matchScore * 100)}% {t('attorney.match')}
            </span>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{t('attorney.recommended')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Attorney Header */}
        <div className="flex items-start space-x-4 mb-4">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            {attorney.profilePhotoUrl ? (
              <img
                src={attorney.profilePhotoUrl}
                alt={`${attorney.firstName} ${attorney.lastName}`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium text-lg">
                  {attorney.firstName[0]}{attorney.lastName[0]}
                </span>
              </div>
            )}
          </div>

          {/* Attorney Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {attorney.firstName} {attorney.lastName}
            </h3>
            {attorney.firmName && (
              <p className="text-sm text-gray-600 truncate">{attorney.firmName}</p>
            )}
            
            {/* Rating */}
            <div className="flex items-center mt-1">
              <div className="flex items-center">
                {renderStars(attorney.ratingAverage)}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {attorney.ratingAverage.toFixed(1)} ({attorney.ratingCount} {t('attorney.reviews')})
              </span>
            </div>

            {/* Experience & Languages */}
            <div className="flex items-center mt-2 space-x-4">
              <span className="text-sm text-gray-600">
                {attorney.yearsExperience} {t('attorney.yearsExperience')}
              </span>
              <div className="flex items-center space-x-1">
                {attorney.languages.map((lang, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lang.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-3">
            {getBio() || t('attorney.noDescription')}
          </p>
        </div>

        {/* Practice Areas */}
        {attorney.practiceAreas && attorney.practiceAreas.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {t('attorney.practiceAreas')}
            </h4>
            <div className="flex flex-wrap gap-1">
              {attorney.practiceAreas.slice(0, 3).map((area, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    area.isPrimary
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {isFrenchl ? area.nameFr : area.nameEn}
                  {area.isPrimary && (
                    <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              ))}
              {attorney.practiceAreas.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{attorney.practiceAreas.length - 3} {t('attorney.more')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Match Reasons */}
        {showMatchInfo && matchReasons && matchReasons.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {t('attorney.whyMatch')}
            </h4>
            <ul className="space-y-1">
              {matchReasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900">
              {formatRate()}
            </span>
            {attorney.freeConsultation && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t('attorney.freeConsultation')}
              </span>
            )}
          </div>
          
          <Link
            href={`/attorneys/${attorney.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            {t('attorney.viewProfile')}
          </Link>
        </div>
      </div>
    </div>
  );
};