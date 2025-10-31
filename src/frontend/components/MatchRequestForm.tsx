import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'next-i18next';

const matchRequestSchema = z.object({
  practiceAreaId: z.string().min(1, 'Practice area is required'),
  caseDescription: z.string().min(50, 'Case description must be at least 50 characters'),
  budgetType: z.enum(['hourly', 'fixed', 'contingency', 'flexible']),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  urgency: z.enum(['immediate', 'within_week', 'within_month', 'flexible']),
  preferredLanguage: z.enum(['fr', 'en']),
  additionalRequirements: z.string().optional()
});

type MatchRequestData = z.infer<typeof matchRequestSchema>;

interface MatchRequestFormProps {
  practiceAreas: Array<{
    id: string;
    nameFr: string;
    nameEn: string;
  }>;
  onSubmit: (data: MatchRequestData) => Promise<void>;
  isSubmitting: boolean;
}

export const MatchRequestForm: React.FC<MatchRequestFormProps> = ({
  practiceAreas,
  onSubmit,
  isSubmitting
}) => {
  const { t } = useTranslation('common');
  const [showBudgetFields, setShowBudgetFields] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<MatchRequestData>({
    resolver: zodResolver(matchRequestSchema),
    defaultValues: {
      budgetType: 'flexible',
      urgency: 'flexible',
      preferredLanguage: 'fr'
    }
  });

  const budgetType = watch('budgetType');

  React.useEffect(() => {
    setShowBudgetFields(budgetType === 'hourly');
  }, [budgetType]);

  const handleFormSubmit = async (data: MatchRequestData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting match request:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('matchRequest.title')}
        </h2>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Practice Area */}
          <div>
            <label htmlFor="practiceAreaId" className="block text-sm font-medium text-gray-700 mb-2">
              {t('matchRequest.practiceArea')} *
            </label>
            <select
              {...register('practiceAreaId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('matchRequest.selectPracticeArea')}</option>
              {practiceAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nameFr}
                </option>
              ))}
            </select>
            {errors.practiceAreaId && (
              <p className="mt-1 text-sm text-red-600">{errors.practiceAreaId.message}</p>
            )}
          </div>

          {/* Case Description */}
          <div>
            <label htmlFor="caseDescription" className="block text-sm font-medium text-gray-700 mb-2">
              {t('matchRequest.caseDescription')} *
            </label>
            <textarea
              {...register('caseDescription')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('matchRequest.caseDescriptionPlaceholder')}
            />
            {errors.caseDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.caseDescription.message}</p>
            )}
          </div>

          {/* Budget Type */}
          <div>
            <label htmlFor="budgetType" className="block text-sm font-medium text-gray-700 mb-2">
              {t('matchRequest.budgetType')} *
            </label>
            <select
              {...register('budgetType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="flexible">{t('matchRequest.budgetFlexible')}</option>
              <option value="hourly">{t('matchRequest.budgetHourly')}</option>
              <option value="fixed">{t('matchRequest.budgetFixed')}</option>
              <option value="contingency">{t('matchRequest.budgetContingency')}</option>
            </select>
          </div>

          {/* Budget Range (for hourly) */}
          {showBudgetFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('matchRequest.budgetMin')} ($/h)
                </label>
                <input
                  type="number"
                  {...register('budgetMin', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="150"
                />
              </div>
              <div>
                <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('matchRequest.budgetMax')} ($/h)
                </label>
                <input
                  type="number"
                  {...register('budgetMax', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="300"
                />
              </div>
            </div>
          )}

          {/* Urgency */}
          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
              {t('matchRequest.urgency')} *
            </label>
            <select
              {...register('urgency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="flexible">{t('matchRequest.urgencyFlexible')}</option>
              <option value="within_month">{t('matchRequest.urgencyMonth')}</option>
              <option value="within_week">{t('matchRequest.urgencyWeek')}</option>
              <option value="immediate">{t('matchRequest.urgencyImmediate')}</option>
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              {t('matchRequest.preferredLanguage')} *
            </label>
            <select
              {...register('preferredLanguage')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fr">{t('language.french')}</option>
              <option value="en">{t('language.english')}</option>
            </select>
          </div>

          {/* Additional Requirements */}
          <div>
            <label htmlFor="additionalRequirements" className="block text-sm font-medium text-gray-700 mb-2">
              {t('matchRequest.additionalRequirements')}
            </label>
            <textarea
              {...register('additionalRequirements')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('matchRequest.additionalRequirementsPlaceholder')}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('matchRequest.submitting')}
                </div>
              ) : (
                t('matchRequest.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};