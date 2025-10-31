import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const userOnboardingSchema = z.object({
  legalNeed: z.string().min(1, 'Please select your legal need'),
  caseDescription: z.string().min(50, 'Please provide more details (min 50 characters)'),
  budgetType: z.enum(['hourly', 'fixed', 'contingency', 'flexible']),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  urgency: z.enum(['immediate', 'within_week', 'within_month', 'flexible']),
  preferredLanguage: z.enum(['fr', 'en']),
  location: z.string().min(1, 'Please enter your location'),
  hasTriedBefore: z.boolean(),
  previousExperience: z.string().optional(),
  specificRequirements: z.string().optional()
});

type UserOnboardingFormData = z.infer<typeof userOnboardingSchema>;

const UserOnboarding: React.FC = () => {
  const { t } = useTranslation(['onboarding', 'common']);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showEducation, setShowEducation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<UserOnboardingFormData>({
    resolver: zodResolver(userOnboardingSchema),
    defaultValues: {
      preferredLanguage: 'fr',
      hasTriedBefore: false,
      budgetType: 'flexible'
    }
  });

  const watchHasTriedBefore = watch('hasTriedBefore');
  const watchBudgetType = watch('budgetType');

  const onSubmit = async (data: UserOnboardingFormData) => {
    try {
      const response = await fetch('/api/matches/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        router.push('/user/matches');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    }
  };

  const legalNeeds = [
    { value: 'family', label: t('legalNeed.family') },
    { value: 'criminal', label: t('legalNeed.criminal') },
    { value: 'civil', label: t('legalNeed.civil') },
    { value: 'corporate', label: t('legalNeed.corporate') },
    { value: 'immigration', label: t('legalNeed.immigration') },
    { value: 'real-estate', label: t('legalNeed.realEstate') },
    { value: 'other', label: t('legalNeed.other') }
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">{t('user.welcome')}</h2>
              <p className="text-gray-600">{t('user.letsMatch')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                {t('user.whatLegalHelp')} *
              </label>
              <div className="space-y-3">
                {legalNeeds.map((need) => (
                  <label
                    key={need.value}
                    className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      value={need.value}
                      {...register('legalNeed')}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{need.label}</div>
                      {need.value === 'family' && (
                        <div className="text-sm text-gray-500">{t('user.familyDesc')}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {errors.legalNeed && (
                <p className="text-red-500 text-sm mt-2">{errors.legalNeed.message}</p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <button
                type="button"
                onClick={() => setShowEducation(true)}
                className="text-blue-600 hover:underline text-sm"
              >
                {t('user.notSureWhichCategory')}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('user.tellUsMore')}</h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('user.describeYourSituation')} *
              </label>
              <p className="text-sm text-gray-500 mb-2">
                {t('user.descriptionHelp')}
              </p>
              <textarea
                {...register('caseDescription')}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={t('user.descriptionPlaceholder')}
              />
              {errors.caseDescription && (
                <p className="text-red-500 text-sm mt-1">{errors.caseDescription.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('user.urgency')} *
              </label>
              <select
                {...register('urgency')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="immediate">{t('urgency.immediate')}</option>
                <option value="within_week">{t('urgency.withinWeek')}</option>
                <option value="within_month">{t('urgency.withinMonth')}</option>
                <option value="flexible">{t('urgency.flexible')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('user.location')} *
              </label>
              <input
                {...register('location')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Montreal, QC"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('hasTriedBefore')}
                  className="mr-2"
                />
                {t('user.hasTriedAttorneyBefore')}
              </label>
            </div>

            {watchHasTriedBefore && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('user.previousExperience')}
                </label>
                <textarea
                  {...register('previousExperience')}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t('user.previousExperiencePlaceholder')}
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('user.budgetPreferences')}</h2>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                {t('user.budgetDisclaimer')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                {t('user.preferredBillingType')} *
              </label>
              <div className="space-y-3">
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="hourly"
                    {...register('budgetType')}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="font-medium">{t('billing.hourly')}</div>
                    <div className="text-sm text-gray-500">{t('billing.hourlyDesc')}</div>
                  </div>
                </label>

                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="fixed"
                    {...register('budgetType')}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="font-medium">{t('billing.fixed')}</div>
                    <div className="text-sm text-gray-500">{t('billing.fixedDesc')}</div>
                  </div>
                </label>

                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="contingency"
                    {...register('budgetType')}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="font-medium">{t('billing.contingency')}</div>
                    <div className="text-sm text-gray-500">{t('billing.contingencyDesc')}</div>
                  </div>
                </label>

                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="flexible"
                    {...register('budgetType')}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="font-medium">{t('billing.flexible')}</div>
                    <div className="text-sm text-gray-500">{t('billing.flexibleDesc')}</div>
                  </div>
                </label>
              </div>
            </div>

            {(watchBudgetType === 'hourly' || watchBudgetType === 'fixed') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('user.budgetMin')}
                  </label>
                  <input
                    type="number"
                    {...register('budgetMin', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('user.budgetMax')}
                  </label>
                  <input
                    type="number"
                    {...register('budgetMax', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('user.finalDetails')}</h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('user.preferredLanguage')} *
              </label>
              <select
                {...register('preferredLanguage')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('user.specificRequirements')}
              </label>
              <p className="text-sm text-gray-500 mb-2">
                {t('user.specificRequirementsHelp')}
              </p>
              <textarea
                {...register('specificRequirements')}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={t('user.specificRequirementsPlaceholder')}
              />
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">{t('user.readyToMatch')}</h3>
              <p className="text-sm text-gray-700 mb-4">
                {t('user.matchingProcess')}
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('user.benefit1')}
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('user.benefit2')}
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('user.benefit3')}
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showEducation) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={() => setShowEducation(false)}
              className="mb-4 text-blue-600 hover:underline"
            >
              ← {t('common:back')}
            </button>
            <h2 className="text-2xl font-bold mb-6">{t('education.choosingRightCategory')}</h2>
            <div className="prose max-w-none">
              <p>{t('education.categoryGuide')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 mx-1 rounded ${
                    s <= step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common:previous')}
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('common:next')}
                </button>
              ) : (
                <button
                  type="submit"
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t('user.findMatches')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['onboarding', 'common'])),
    },
  };
}

export default UserOnboarding;