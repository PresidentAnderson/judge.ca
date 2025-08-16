import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { 
  Shield, 
  Award, 
  Users, 
  Clock, 
  Star,
  CheckCircle,
  Globe,
  Lock
} from 'lucide-react';

const TrustSection = () => {
  const { t } = useTranslation('common');

  const trustMetrics = [
    {
      icon: Users,
      number: '2,500+',
      label: t('trust.metrics.attorneys'),
      description: t('trust.metrics.attorneysDesc'),
      color: 'text-blue-600'
    },
    {
      icon: Shield,
      number: '99.9%',
      label: t('trust.metrics.security'),
      description: t('trust.metrics.securityDesc'),
      color: 'text-green-600'
    },
    {
      icon: Star,
      number: '4.9/5',
      label: t('trust.metrics.rating'),
      description: t('trust.metrics.ratingDesc'),
      color: 'text-yellow-600'
    },
    {
      icon: Clock,
      number: '24/7',
      label: t('trust.metrics.support'),
      description: t('trust.metrics.supportDesc'),
      color: 'text-purple-600'
    }
  ];

  const certifications = [
    {
      icon: Award,
      title: t('trust.certifications.quebec'),
      description: t('trust.certifications.quebecDesc'),
      badge: 'Quebec Bar'
    },
    {
      icon: Lock,
      title: t('trust.certifications.security'),
      description: t('trust.certifications.securityDesc'),
      badge: 'ISO 27001'
    },
    {
      icon: Globe,
      title: t('trust.certifications.compliance'),
      description: t('trust.certifications.complianceDesc'),
      badge: 'GDPR Compliant'
    }
  ];

  const socialProof = [
    {
      logo: '/images/logos/courthouse.svg',
      name: 'Quebec Superior Court',
      type: 'Partner'
    },
    {
      logo: '/images/logos/bar-association.svg',
      name: 'Quebec Bar Association',
      type: 'Certified'
    },
    {
      logo: '/images/logos/legal-aid.svg',
      name: 'Legal Aid Quebec',
      type: 'Approved'
    },
    {
      logo: '/images/logos/chamber-commerce.svg',
      name: 'Montreal Chamber of Commerce',
      type: 'Member'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-navy-900 mb-6">
            {t('trust.title')}
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {t('trust.subtitle')}
          </p>
        </motion.div>

        {/* Trust Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {trustMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="relative mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-2xl group-hover:bg-slate-100 transition-colors">
                  <metric.icon className={`h-10 w-10 ${metric.color}`} />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-3xl font-bold text-navy-900">{metric.number}</div>
                <div className="text-lg font-semibold text-slate-700">{metric.label}</div>
                <p className="text-sm text-slate-600">{metric.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-navy-900 mb-4">
              {t('trust.certifications.title')}
            </h3>
            <p className="text-lg text-slate-600">
              {t('trust.certifications.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative bg-slate-50 rounded-xl p-8 hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm">
                      <cert.icon className="h-6 w-6 text-navy-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-navy-900 mb-2">
                      {cert.title}
                    </h4>
                    <p className="text-slate-600 mb-3">
                      {cert.description}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-gold-100 text-gold-800 text-sm font-medium rounded-full">
                      {cert.badge}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social Proof / Partnerships */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-navy-900 mb-8">
            {t('trust.partners.title')}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {socialProof.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                  {/* Placeholder for logo */}
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 rounded-lg flex items-center justify-center">
                    <Award className="h-8 w-8 text-slate-400" />
                  </div>
                  <h4 className="font-medium text-slate-700 text-sm mb-1">
                    {partner.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {partner.type}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 p-6 bg-navy-50 rounded-xl"
          >
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Shield className="h-5 w-5 text-navy-600" />
              <span className="font-semibold text-navy-900">
                {t('trust.guarantee.title')}
              </span>
            </div>
            <p className="text-navy-700">
              {t('trust.guarantee.description')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;