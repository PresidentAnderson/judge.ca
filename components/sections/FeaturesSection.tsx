import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { 
  Brain, 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  Video,
  Smartphone,
  Award,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FeaturesSection = () => {
  const { t } = useTranslation('common');

  const features = [
    {
      icon: Brain,
      title: t('features.ai.title'),
      description: t('features.ai.description'),
      gradient: 'from-purple-500 to-indigo-600',
      hoverColor: 'hover:bg-purple-50'
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description'),
      gradient: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:bg-green-50'
    },
    {
      icon: Clock,
      title: t('features.speed.title'),
      description: t('features.speed.description'),
      gradient: 'from-blue-500 to-cyan-600',
      hoverColor: 'hover:bg-blue-50'
    },
    {
      icon: Users,
      title: t('features.network.title'),
      description: t('features.network.description'),
      gradient: 'from-orange-500 to-red-600',
      hoverColor: 'hover:bg-orange-50'
    },
    {
      icon: FileText,
      title: t('features.documents.title'),
      description: t('features.documents.description'),
      gradient: 'from-teal-500 to-cyan-600',
      hoverColor: 'hover:bg-teal-50'
    },
    {
      icon: Video,
      title: t('features.consultation.title'),
      description: t('features.consultation.description'),
      gradient: 'from-pink-500 to-rose-600',
      hoverColor: 'hover:bg-pink-50'
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const // easeOut cubic-bezier
      }
    }
  };

  return (
    <section className="py-24 bg-gradient-subtle">
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
            {t('features.title')}
            <span className="block bg-gradient-to-r from-gold-500 to-gold-400 bg-clip-text text-transparent">
              {t('features.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              {/* Card */}
              <div className={`
                relative bg-white rounded-2xl p-8 shadow-card transition-all duration-300
                ${feature.hoverColor} hover:shadow-card-hover hover:scale-105
                border border-slate-100 hover:border-slate-200
              `}>
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`
                    inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient}
                    shadow-lg group-hover:scale-110 transition-transform duration-300
                  `}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Decorative element */}
                  <div className={`
                    absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r ${feature.gradient} opacity-20
                    group-hover:scale-150 group-hover:opacity-30 transition-all duration-300
                  `}></div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-navy-900 group-hover:text-navy-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300">
                  <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${feature.gradient}`}></div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gold-100 rounded-lg">
                  <Smartphone className="h-6 w-6 text-gold-600" />
                </div>
                <h4 className="font-semibold text-navy-900">{t('features.mobile.title')}</h4>
                <p className="text-sm text-slate-600">{t('features.mobile.description')}</p>
              </div>
              
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-navy-100 rounded-lg">
                  <Award className="h-6 w-6 text-navy-600" />
                </div>
                <h4 className="font-semibold text-navy-900">{t('features.certified.title')}</h4>
                <p className="text-sm text-slate-600">{t('features.certified.description')}</p>
              </div>
              
              <div className="space-y-4">
                <Button variant="premium" size="lg" className="w-full">
                  {t('features.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-slate-500">{t('features.ctaSubtext')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;