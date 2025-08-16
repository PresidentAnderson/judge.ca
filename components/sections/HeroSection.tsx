import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Clock,
  Star,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const { t } = useTranslation('common');

  const stats = [
    { number: '2500+', label: t('hero.stats.attorneys'), icon: Users },
    { number: '98%', label: t('hero.stats.satisfaction'), icon: Star },
    { number: '24/7', label: t('hero.stats.support'), icon: Clock },
    { number: '100%', label: t('hero.stats.verified'), icon: Shield },
  ];

  const features = [
    t('hero.features.ai'),
    t('hero.features.secure'),
    t('hero.features.quebec'),
    t('hero.features.support'),
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-navy-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2"
              >
                <Shield className="h-4 w-4 text-gold-400" />
                <span className="text-sm font-medium text-white">
                  {t('hero.badge')}
                </span>
              </motion.div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {t('hero.title')}
                <span className="block bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-slate-200 leading-relaxed max-w-2xl">
                {t('hero.subtitle')}
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-gold-400 flex-shrink-0" />
                    <span className="text-slate-200">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="xl" 
                variant="premium"
                className="group shadow-glow hover:shadow-glow-lg"
                asChild
              >
                <Link href="/match-request">
                  {t('hero.cta.primary')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                size="xl" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white hover:text-navy-900"
                asChild
              >
                <Link href="/attorneys/register">
                  {t('hero.cta.secondary')}
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-white/20"
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center space-y-2">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="h-6 w-6 text-gold-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.number}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-premium-2xl">
              {/* Mock Interface */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {t('hero.interface.title')}
                  </h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gold-400 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-navy-900" />
                      </div>
                      <div>
                        <div className="h-3 bg-white/40 rounded w-24 mb-1"></div>
                        <div className="h-2 bg-white/20 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/30 rounded w-full"></div>
                      <div className="h-2 bg-white/20 rounded w-3/4"></div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-navy-900" />
                      </div>
                      <div>
                        <div className="h-3 bg-white/40 rounded w-20 mb-1"></div>
                        <div className="h-2 bg-white/20 rounded w-12"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/30 rounded w-full"></div>
                      <div className="h-2 bg-white/20 rounded w-2/3"></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gold-500 to-gold-400 rounded-lg p-4 text-navy-900">
                    <div className="text-sm font-medium mb-2">
                      {t('hero.interface.match')}
                    </div>
                    <div className="text-xs opacity-75">
                      {t('hero.interface.confidence')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-gold-400 text-navy-900 rounded-lg p-3 shadow-lg"
              >
                <Star className="h-6 w-6" />
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-white text-navy-900 rounded-lg p-3 shadow-lg"
              >
                <Shield className="h-6 w-6" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;