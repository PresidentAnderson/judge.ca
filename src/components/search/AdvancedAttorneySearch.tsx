import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { debounce } from 'lodash';
import { FiSearch, FiFilter, FiX, FiMapPin, FiDollarSign, FiStar, FiCalendar } from 'react-icons/fi';

interface Attorney {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
  barNumber: string;
  province: string;
  specializations: string[];
  experienceYears: number;
  languages: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
  bio: string;
  city: string;
  consultationFee: number;
  verified: boolean;
}

interface SearchFilters {
  query: string;
  specialization: string;
  province: string;
  city: string;
  minExperience: number;
  maxHourlyRate: number;
  minRating: number;
  languages: string[];
  availability: string;
  sortBy: 'relevance' | 'rating' | 'price_low' | 'price_high' | 'experience';
}

const SPECIALIZATIONS = [
  'Criminal Law',
  'Family Law',
  'Immigration Law',
  'Corporate Law',
  'Real Estate Law',
  'Personal Injury',
  'Employment Law',
  'Tax Law',
  'Intellectual Property',
  'Estate Planning',
  'Bankruptcy Law',
  'Environmental Law'
];

const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon'
];

const LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'Mandarin',
  'Cantonese',
  'Arabic',
  'Hindi',
  'Punjabi',
  'Portuguese',
  'Italian'
];

export const AdvancedAttorneySearch: React.FC = () => {
  const router = useRouter();
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    specialization: '',
    province: '',
    city: '',
    minExperience: 0,
    maxHourlyRate: 1000,
    minRating: 0,
    languages: [],
    availability: '',
    sortBy: 'relevance'
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        Object.entries(searchFilters).forEach(([key, value]) => {
          if (value) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
        queryParams.append('page', currentPage.toString());
        queryParams.append('limit', '12');

        const response = await fetch(`/api/attorneys/search?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setAttorneys(data.attorneys);
          setTotalResults(data.total);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    [currentPage]
  );

  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, currentPage, debouncedSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleLanguageToggle = (language: string) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      specialization: '',
      province: '',
      city: '',
      minExperience: 0,
      maxHourlyRate: 1000,
      minRating: 0,
      languages: [],
      availability: '',
      sortBy: 'relevance'
    });
  };

  const AttorneyCard = ({ attorney }: { attorney: Attorney }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 cursor-pointer"
         onClick={() => router.push(`/attorney/${attorney.id}`)}>
      <div className="flex items-start space-x-4">
        {attorney.profilePhoto ? (
          <img 
            src={attorney.profilePhoto} 
            alt={`${attorney.firstName} ${attorney.lastName}`}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl text-gray-500">
              {attorney.firstName[0]}{attorney.lastName[0]}
            </span>
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {attorney.firstName} {attorney.lastName}
              {attorney.verified && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              )}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              attorney.availability === 'available' 
                ? 'bg-green-100 text-green-800' 
                : attorney.availability === 'busy'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {attorney.availability}
            </span>
          </div>
          
          <div className="mt-1 text-sm text-gray-600">
            <span className="flex items-center">
              <FiMapPin className="w-3 h-3 mr-1" />
              {attorney.city}, {attorney.province}
            </span>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-1">
            {attorney.specializations.slice(0, 3).map(spec => (
              <span key={spec} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                {spec}
              </span>
            ))}
            {attorney.specializations.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                +{attorney.specializations.length - 3} more
              </span>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-yellow-500">
                <FiStar className="w-4 h-4 mr-1 fill-current" />
                {attorney.rating.toFixed(1)} ({attorney.reviewCount})
              </span>
              <span className="text-gray-600">
                {attorney.experienceYears} years exp.
              </span>
            </div>
            <span className="flex items-center font-semibold text-gray-900">
              <FiDollarSign className="w-4 h-4" />
              {attorney.hourlyRate}/hr
            </span>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Languages: {attorney.languages.join(', ')}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  placeholder="Search by name, specialization, or keyword..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FiFilter className="w-5 h-5 mr-2" />
              Filters
              {Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== 'relevance' && v !== 0 && v !== 1000)) && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
          </div>
          
          {/* Sort Options */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Found {totalResults} attorneys matching your criteria
            </p>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="experience">Most Experienced</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
              
              {/* Specialization */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <select
                  value={filters.specialization}
                  onChange={(e) => handleFilterChange('specialization', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Specializations</option>
                  {SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              
              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province
                </label>
                <select
                  value={filters.province}
                  onChange={(e) => handleFilterChange('province', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Provinces</option>
                  {PROVINCES.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="Enter city name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Experience */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Experience (years)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={filters.minExperience}
                  onChange={(e) => handleFilterChange('minExperience', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>{filters.minExperience} years</span>
                  <span>30+</span>
                </div>
              </div>
              
              {/* Hourly Rate */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Hourly Rate ($)
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={filters.maxHourlyRate}
                  onChange={(e) => handleFilterChange('maxHourlyRate', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$50</span>
                  <span>${filters.maxHourlyRate}</span>
                  <span>$1000+</span>
                </div>
              </div>
              
              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <div className="flex space-x-2">
                  {[0, 3, 3.5, 4, 4.5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => handleFilterChange('minRating', rating)}
                      className={`px-3 py-2 rounded-lg border ${
                        filters.minRating === rating
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Languages */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {LANGUAGES.map(lang => (
                    <label key={lang} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.languages.includes(lang)}
                        onChange={() => handleLanguageToggle(lang)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Availability */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="available">Available Now</option>
                  <option value="busy">Busy (Limited)</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Results Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                        <div className="flex space-x-2">
                          <div className="h-6 bg-gray-200 rounded w-20" />
                          <div className="h-6 bg-gray-200 rounded w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : attorneys.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {attorneys.map(attorney => (
                    <AttorneyCard key={attorney.id} attorney={attorney} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalResults > 12 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {[...Array(Math.ceil(totalResults / 12))].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === i + 1
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      )).slice(
                        Math.max(0, currentPage - 3),
                        Math.min(Math.ceil(totalResults / 12), currentPage + 2)
                      )}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalResults / 12), prev + 1))}
                        disabled={currentPage === Math.ceil(totalResults / 12)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <FiSearch className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attorneys found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};