import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { 
  ArrowRight, 
  Shield, 
  Clock, 
  Users,
  CheckCircle,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  const { t } = useTranslation('common');

  const benefits = [
    t('cta.benefits.free'),
    t('cta.benefits.fast'),
    t('cta.benefits.verified'),
    t('cta.benefits.support'),
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: t('cta.contact.phone.title'),
      value: '+1 (514) 123-4567',
      description: t('cta.contact.phone.description'),
      action: 'tel:+15141234567'
    },
    {
      icon: Mail,
      title: t('cta.contact.email.title'),
      value: 'contact@judge.ca',
      description: t('cta.contact.email.description'),
      action: 'mailto:contact@judge.ca'
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-premium overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-navy-400/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Main Content */}
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                {t('cta.title')}
                <span className="block bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">
                  {t('cta.titleHighlight')}
                </span>
              </h2>
              
              <p className="text-xl text-slate-200 leading-relaxed">
                {t('cta.subtitle')}
              </p>

              {/* Benefits */}
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-gold-400 flex-shrink-0" />
                    <span className="text-slate-200">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="xl" 
                className="group bg-gold-500 hover:bg-gold-400 text-navy-900 shadow-glow hover:shadow-glow-lg"
                asChild
              >
                <Link href="/match-request">
                  {t('cta.primary')}
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
                  {t('cta.secondary')}
                </Link>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center space-x-6 pt-6 border-t border-white/20"
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-gold-400" />
                <span className="text-sm text-slate-300">{t('cta.trust.secure')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gold-400" />
                <span className="text-sm text-slate-300">{t('cta.trust.fast')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gold-400" />
                <span className="text-sm text-slate-300">{t('cta.trust.verified')}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-premium-2xl">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t('cta.contact.title')}
                  </h3>
                  <p className="text-slate-300">
                    {t('cta.contact.subtitle')}
                  </p>
                </div>

                {/* Contact Methods */}
                <div className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <motion.a
                      key={method.title}
                      href={method.action}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors group"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gold-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <method.icon className="h-6 w-6 text-navy-900" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{method.title}</h4>
                        <p className="text-gold-300 font-medium">{method.value}</p>
                        <p className="text-sm text-slate-300">{method.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-gold-300 group-hover:translate-x-1 transition-all" />
                    </motion.a>
                  ))}
                </div>

                {/* Emergency Notice */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="bg-red-500/20 border border-red-400/30 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-red-300 mb-1">
                        {t('cta.emergency.title')}
                      </h5>
                      <p className="text-sm text-red-200">
                        {t('cta.emergency.description')}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Response Time */}
                <div className="text-center pt-4 border-t border-white/20">
                  <p className="text-sm text-slate-300">
                    {t('cta.responseTime')}
                  </p>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-3 -right-3 bg-gold-400 text-navy-900 rounded-full p-3 shadow-lg"
              >
                <Shield className="h-6 w-6" />
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 -left-3 bg-white text-navy-900 rounded-full p-3 shadow-lg"
              >
                <Clock className="h-6 w-6" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gold-400">15 min</div>
              <div className="text-slate-300">{t('cta.stats.responseTime')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gold-400">24/7</div>
              <div className="text-slate-300">{t('cta.stats.availability')}</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gold-400">100%</div>
              <div className="text-slate-300">{t('cta.stats.satisfaction')}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;