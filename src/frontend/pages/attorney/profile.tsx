import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';

interface AttorneyProfile {
  firstName: string;
  lastName: string;
  firmName?: string;
  email: string;
  phone: string;
  barNumber: string;
  yearsExperience: number;
  languages: string[];
  bioFr: string;
  bioEn?: string;
  profilePhotoUrl?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  hourlyRateMin: number;
  hourlyRateMax: number;
  fixedFeeAvailable: boolean;
  contingencyAvailable: boolean;
  freeConsultation: boolean;
  consultationFee?: number;
  practiceAreas: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
    yearsExperience: number;
  }>;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
}

const AttorneyProfileEdit: React.FC = () => {
  const { t } = useTranslation(['profile', 'common']);
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('basic');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery<AttorneyProfile>('attorneyProfile', async () => {
    const response = await fetch('/api/attorneys/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<AttorneyProfile>();

  useEffect(() => {
    if (profile) {
      Object.entries(profile).forEach(([key, value]) => {
        setValue(key as keyof AttorneyProfile, value);
      });
      if (profile.profilePhotoUrl) {
        setPhotoPreview(profile.profilePhotoUrl);
      }
    }
  }, [profile, setValue]);

  const updateProfile = useMutation(
    async (data: Partial<AttorneyProfile>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      const response = await fetch('/api/attorneys/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        alert(t('profileUpdated'));
      }
    }
  );

  const onSubmit = (data: AttorneyProfile) => {
    updateProfile.mutate(data);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sections = [
    { id: 'basic', label: t('sections.basic'), icon: '👤' },
    { id: 'professional', label: t('sections.professional'), icon: '💼' },
    { id: 'rates', label: t('sections.rates'), icon: '💰' },
    { id: 'bio', label: t('sections.bio'), icon: '📝' },
    { id: 'contact', label: t('sections.contact'), icon: '📍' }
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{t('editProfile')}</h1>

          <div className="flex flex-wrap gap-2 mb-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-lg shadow-lg p-8">
              {activeSection === 'basic' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4">{t('sections.basic')}</h2>
                  
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{t('photoGuidelines')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('firstName')} *
                      </label>
                      <input
                        {...register('firstName', { required: true })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('lastName')} *
                      </label>
                      <input
                        {...register('lastName', { required: true })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
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
                        {t('barNumber')} *
                      </label>
                      <input
                        {...register('barNumber', { required: true })}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('availabilityStatus')}
                    </label>
                    <select
                      {...register('availabilityStatus')}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="available">{t('status.available')}</option>
                      <option value="busy">{t('status.busy')}</option>
                      <option value="unavailable">{t('status.unavailable')}</option>
                    </select>
                  </div>
                </div>
              )}

              {activeSection === 'professional' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4">{t('sections.professional')}</h2>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('yearsExperience')} *
                    </label>
                    <input
                      type="number"
                      {...register('yearsExperience', { required: true, min: 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
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
                          {...register('languages')}
                          className="mr-2"
                        />
                        Français
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="en"
                          {...register('languages')}
                          className="mr-2"
                        />
                        English
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      {t('practiceAreas')}
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-3">
                        {t('practiceAreasHelp')}
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/attorney/practice-areas')}
                        className="btn-secondary"
                      >
                        {t('managePracticeAreas')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'rates' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4">{t('sections.rates')}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('hourlyRateMin')} *
                      </label>
                      <input
                        type="number"
                        {...register('hourlyRateMin', { required: true, min: 0 })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('hourlyRateMax')} *
                      </label>
                      <input
                        type="number"
                        {...register('hourlyRateMax', { required: true, min: 0 })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                          {...register('consultationFee', { min: 0 })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'bio' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4">{t('sections.bio')}</h2>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('bioFrench')} *
                    </label>
                    <textarea
                      {...register('bioFr', { required: true, minLength: 100 })}
                      rows={6}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('bioPlaceholder')}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {watch('bioFr')?.length || 0} / 100 {t('characters')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('bioEnglish')}
                    </label>
                    <textarea
                      {...register('bioEn')}
                      rows={6}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {activeSection === 'contact' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4">{t('sections.contact')}</h2>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('email')} *
                      </label>
                      <input
                        type="email"
                        {...register('email', { required: true })}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('phone')} *
                      </label>
                      <input
                        {...register('phone', { required: true })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('addressLine1')} *
                      </label>
                      <input
                        {...register('addressLine1', { required: true })}
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
                          {...register('city', { required: true })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {t('postalCode')} *
                        </label>
                        <input
                          {...register('postalCode', { 
                            required: true,
                            pattern: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/
                          })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="H1A 1A1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => router.push('/attorney/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updateProfile.isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateProfile.isLoading ? t('common:saving') : t('common:save')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['profile', 'common'])),
    },
  };
};

export default AttorneyProfileEdit;