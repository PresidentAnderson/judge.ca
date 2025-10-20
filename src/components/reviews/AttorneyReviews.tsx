import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { FiStar, FiThumbsUp, FiThumbsDown, FiFilter, FiCheck, FiX, FiUser, FiAward } from 'react-icons/fi';

interface Review {
  id: string;
  attorneyId: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  rating: number;
  title: string;
  content: string;
  categories: {
    communication: number;
    expertise: number;
    responsiveness: number;
    value: number;
  };
  caseType: string;
  caseOutcome: 'positive' | 'neutral' | 'negative';
  wouldRecommend: boolean;
  verifiedClient: boolean;
  helpful: number;
  notHelpful: number;
  attorneyResponse?: {
    content: string;
    date: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  recommendationRate: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categoryAverages: {
    communication: number;
    expertise: number;
    responsiveness: number;
    value: number;
  };
}

interface AttorneyReviewsProps {
  attorneyId: string;
  showWriteReview?: boolean;
}

export const AttorneyReviews: React.FC<AttorneyReviewsProps> = ({ 
  attorneyId, 
  showWriteReview = false 
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'positive' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [showReviewForm, setShowReviewForm] = useState(showWriteReview);
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'notHelpful'>>({});
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    content: '',
    categories: {
      communication: 0,
      expertise: 0,
      responsiveness: 0,
      value: 0
    },
    caseType: '',
    caseOutcome: 'neutral' as 'positive' | 'neutral' | 'negative',
    wouldRecommend: true
  });

  useEffect(() => {
    loadReviews();
    loadReviewStats();
  }, [attorneyId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attorneys/${attorneyId}/reviews?sort=${sortBy}&filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        
        // Load user's votes
        if (user) {
          const votesResponse = await fetch(`/api/reviews/votes?userId=${user.id}`);
          if (votesResponse.ok) {
            const votesData = await votesResponse.json();
            setUserVotes(votesData.votes);
          }
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewStats = async () => {
    try {
      const response = await fetch(`/api/attorneys/${attorneyId}/review-stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || reviewForm.rating === 0 || !reviewForm.title || !reviewForm.content) {return;}

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attorneyId,
          ...reviewForm
        })
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews([newReview, ...reviews]);
        setShowReviewForm(false);
        
        // Reset form
        setReviewForm({
          rating: 0,
          title: '',
          content: '',
          categories: {
            communication: 0,
            expertise: 0,
            responsiveness: 0,
            value: 0
          },
          caseType: '',
          caseOutcome: 'neutral',
          wouldRecommend: true
        });
        
        // Reload stats
        loadReviewStats();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'notHelpful') => {
    if (!user) {return;}

    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ voteType })
      });

      if (response.ok) {
        setUserVotes({ ...userVotes, [reviewId]: voteType });
        
        // Update review counts
        setReviews(reviews.map(review => {
          if (review.id === reviewId) {
            const prevVote = userVotes[reviewId];
            return {
              ...review,
              helpful: voteType === 'helpful' 
                ? review.helpful + 1 
                : prevVote === 'helpful' 
                  ? review.helpful - 1 
                  : review.helpful,
              notHelpful: voteType === 'notHelpful' 
                ? review.notHelpful + 1 
                : prevVote === 'notHelpful' 
                  ? review.notHelpful - 1 
                  : review.notHelpful
            };
          }
          return review;
        }));
      }
    } catch (error) {
      console.error('Error voting on review:', error);
    }
  };

  const StarRating = ({ rating, size = 'sm', interactive = false, onChange }: {
    rating: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onChange?: (rating: number) => void;
  }) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => interactive && onChange && onChange(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <FiStar
              className={`${sizes[size]} ${
                star <= rating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review }: { review: Review }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            {review.verifiedClient ? (
              <FiCheck className="w-6 h-6 text-green-600" />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {review.clientInitials}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold">{review.clientName}</p>
              {review.verifiedClient && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <FiCheck className="w-3 h-3 mr-1" />
                  Verified Client
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        
        {review.wouldRecommend && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <FiAward className="w-4 h-4 mr-1" />
            Recommends
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2">{review.title}</h3>
      <p className="text-gray-700 mb-4">{review.content}</p>

      {/* Category Ratings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 mb-1">Communication</p>
          <div className="flex items-center">
            <StarRating rating={review.categories.communication} size="sm" />
            <span className="ml-1 text-sm">{review.categories.communication}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Expertise</p>
          <div className="flex items-center">
            <StarRating rating={review.categories.expertise} size="sm" />
            <span className="ml-1 text-sm">{review.categories.expertise}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Responsiveness</p>
          <div className="flex items-center">
            <StarRating rating={review.categories.responsiveness} size="sm" />
            <span className="ml-1 text-sm">{review.categories.responsiveness}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Value</p>
          <div className="flex items-center">
            <StarRating rating={review.categories.value} size="sm" />
            <span className="ml-1 text-sm">{review.categories.value}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>Case Type: {review.caseType}</span>
        <span className={`px-2 py-1 rounded ${
          review.caseOutcome === 'positive' ? 'bg-green-100 text-green-800' :
          review.caseOutcome === 'negative' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {review.caseOutcome} outcome
        </span>
      </div>

      {/* Attorney Response */}
      {review.attorneyResponse && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm font-semibold text-blue-900 mb-2">Attorney Response</p>
          <p className="text-sm text-blue-800">{review.attorneyResponse.content}</p>
          <p className="text-xs text-blue-600 mt-2">
            {format(new Date(review.attorneyResponse.date), 'MMM d, yyyy')}
          </p>
        </div>
      )}

      {/* Helpfulness */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600">Was this review helpful?</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleVote(review.id, 'helpful')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg border ${
              userVotes[review.id] === 'helpful'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FiThumbsUp className="w-4 h-4" />
            <span className="text-sm">{review.helpful}</span>
          </button>
          <button
            onClick={() => handleVote(review.id, 'notHelpful')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg border ${
              userVotes[review.id] === 'notHelpful'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FiThumbsDown className="w-4 h-4" />
            <span className="text-sm">{review.notHelpful}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const ReviewForm = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-xl font-semibold mb-6">Write a Review</h3>
      
      {/* Overall Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating
        </label>
        <div className="flex items-center space-x-2">
          <StarRating 
            rating={reviewForm.rating} 
            size="lg" 
            interactive 
            onChange={(rating) => setReviewForm({...reviewForm, rating})}
          />
          <span className="text-lg font-medium">
            {reviewForm.rating > 0 && `${reviewForm.rating} out of 5`}
          </span>
        </div>
      </div>

      {/* Category Ratings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(reviewForm.categories).map(([category, rating]) => (
          <div key={category}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {category}
            </label>
            <StarRating
              rating={rating}
              size="md"
              interactive
              onChange={(r) => setReviewForm({
                ...reviewForm,
                categories: { ...reviewForm.categories, [category]: r }
              })}
            />
          </div>
        ))}
      </div>

      {/* Review Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Title
        </label>
        <input
          type="text"
          value={reviewForm.title}
          onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Review Content */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          value={reviewForm.content}
          onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
          rows={5}
          placeholder="Share details of your experience with this attorney..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Case Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Case Type
          </label>
          <select
            value={reviewForm.caseType}
            onChange={(e) => setReviewForm({...reviewForm, caseType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select type</option>
            <option value="Criminal">Criminal</option>
            <option value="Family">Family</option>
            <option value="Immigration">Immigration</option>
            <option value="Corporate">Corporate</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Personal Injury">Personal Injury</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Case Outcome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Case Outcome
          </label>
          <select
            value={reviewForm.caseOutcome}
            onChange={(e) => setReviewForm({...reviewForm, caseOutcome: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        {/* Would Recommend */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Would you recommend?
          </label>
          <div className="flex space-x-4 mt-3">
            <label className="flex items-center">
              <input
                type="radio"
                checked={reviewForm.wouldRecommend === true}
                onChange={() => setReviewForm({...reviewForm, wouldRecommend: true})}
                className="mr-2"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={reviewForm.wouldRecommend === false}
                onChange={() => setReviewForm({...reviewForm, wouldRecommend: false})}
                className="mr-2"
              />
              <span>No</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setShowReviewForm(false)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitReview}
          disabled={!reviewForm.rating || !reviewForm.title || !reviewForm.content}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Review
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Review Stats */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
              <StarRating rating={Math.round(stats.averageRating)} size="md" />
              <p className="text-sm text-gray-600 mt-2">
                {stats.totalReviews} reviews
              </p>
              <p className="text-sm text-green-600 mt-1">
                {Math.round(stats.recommendationRate)}% recommend
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm w-4">{rating}</span>
                  <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ 
                        width: `${(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-10 text-right">
                    {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>

            {/* Category Averages */}
            <div className="space-y-3">
              {Object.entries(stats.categoryAverages).map(([category, avg]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{category}</span>
                  <div className="flex items-center space-x-1">
                    <StarRating rating={Math.round(avg)} size="sm" />
                    <span className="text-sm font-medium">{avg.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {user && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="w-full mb-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Write a Review
        </button>
      )}

      {/* Review Form */}
      {showReviewForm && <ReviewForm />}

      {/* Filters and Sort */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={`px-3 py-1 rounded-lg ${
              filter === 'positive' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Positive
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 rounded-lg ${
              filter === 'critical' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Critical
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
    </div>
  );
};