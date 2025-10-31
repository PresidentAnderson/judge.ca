import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const onboardingSchema = z.object({
  barNumber: z.string().min(1, 'Bar number is required'),
  firmName: z.string().optional(),
  yearsExperience: z.number().min(0).max(50),
  hourlyRateMin: z.number().min(0),
  hourlyRateMax: z.number().min(0),
  fixedFeeAvailable: z.boolean(),
  contingencyAvailable: z.boolean(),
  freeConsultation: z.boolean(),
  consultationFee: z.number().optional(),
  languages: z.array(z.string()).min(1),
  practiceAreas: z.array(z.string()).min(1),
  bioFr: z.string().min(100, 'Bio must be at least 100 characters'),
  bioEn: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().regex(/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/),
  phone: z.string().min(10),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms')
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const AttorneyOnboarding: React.FC = () => {
  const { t } = useTranslation(['onboarding', 'common']);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      languages: ['fr'],
      fixedFeeAvailable: false,
      contingencyAvailable: false,
      freeConsultation: false,
      practiceAreas: []
    }
  });

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      const response = await fetch('/api/attorneys/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        router.push('/attorney/dashboard');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('professionalInfo')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('barNumber')} *
                </label>
                <input
                  {...register('barNumber')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123456"
                />
                {errors.barNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.barNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('firmName')}
                </label>
                <input
                  {...register('firmName')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('yearsExperience')} *
                </label>
                <input
                  type="number"
                  {...register('yearsExperience', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.yearsExperience && (
                  <p className="text-red-500 text-sm mt-1">{errors.yearsExperience.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('profilePhoto')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('languages')} *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="fr"
                    defaultChecked
                    onChange={(e) => {
                      const current = watch('languages') || [];
                      if (e.target.checked) {
                        setValue('languages', [...current, 'fr']);
                      } else {
                        setValue('languages', current.filter(l => l !== 'fr'));
                      }
                    }}
                    className="mr-2"
                  />
                  Français
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="en"
                    onChange={(e) => {
                      const current = watch('languages') || [];
                      if (e.target.checked) {
                        setValue('languages', [...current, 'en']);
                      } else {
                        setValue('languages', current.filter(l => l !== 'en'));
                      }
                    }}
                    className="mr-2"
                  />
                  English
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('practiceAreasAndRates')}</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('practiceAreas')} *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['family', 'criminal', 'civil', 'corporate', 'immigration', 'real-estate'].map(area => (
                  <label key={area} className="flex items-center">
                    <input
                      type="checkbox"
                      value={area}
                      onChange={(e) => {
                        const current = watch('practiceAreas') || [];
                        if (e.target.checked) {
                          setValue('practiceAreas', [...current, area]);
                        } else {
                          setValue('practiceAreas', current.filter(a => a !== area));
                        }
                      }}
                      className="mr-2"
                    />
                    {t(`practiceArea.${area}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('hourlyRateMin')} *
                </label>
                <input
                  type="number"
                  {...register('hourlyRateMin', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('hourlyRateMax')} *
                </label>
                <input
                  type="number"
                  {...register('hourlyRateMax', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('fixedFeeAvailable')}
                  className="mr-2"
                />
                {t('offerFixedFees')}
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('contingencyAvailable')}
                  className="mr-2"
                />
                {t('offerContingency')}
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('freeConsultation')}
                  className="mr-2"
                />
                {t('offerFreeConsultation')}
              </label>

              {!watch('freeConsultation') && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('consultationFee')}
                  </label>
                  <input
                    type="number"
                    {...register('consultationFee', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('profileAndBio')}</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('bioFrench')} * (min 100 characters)
              </label>
              <textarea
                {...register('bioFr')}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={t('bioPlaceholder')}
              />
              {errors.bioFr && (
                <p className="text-red-500 text-sm mt-1">{errors.bioFr.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('bioEnglish')} (optional)
              </label>
              <textarea
                {...register('bioEn')}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('contactInfo')}</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('addressLine1')} *
                </label>
                <input
                  {...register('addressLine1')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('addressLine2')}
                </label>
                <input
                  {...register('addressLine2')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('city')} *
                  </label>
                  <input
                    {...register('city')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('postalCode')} *
                  </label>
                  <input
                    {...register('postalCode')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="H1A 1A1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('phone')} *
                </label>
                <input
                  {...register('phone')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="514-555-0123"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="mr-2 mt-1"
                />
                <span className="text-sm">
                  {t('acceptTerms')} <a href="/terms" className="text-blue-600 hover:underline">{t('termsOfService')}</a>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-red-500 text-sm mt-1">{errors.acceptTerms.message}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-4">
              {t('attorneyOnboarding')}
            </h1>
            
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
                  {t('common:complete')}
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

export default AttorneyOnboarding;