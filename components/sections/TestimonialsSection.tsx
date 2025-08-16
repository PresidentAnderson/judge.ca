import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { 
  Star, 
  Quote,
  ArrowLeft,
  ArrowRight,
  Shield,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TestimonialsSection = () => {
  const { t } = useTranslation('common');

  const testimonials = [
    {
      id: 1,
      name: 'Marie Dubois',
      role: t('testimonials.client1.role'),
      location: 'Montreal, QC',
      avatar: '/images/avatars/marie.jpg',
      rating: 5,
      content: t('testimonials.client1.content'),
      highlight: t('testimonials.client1.highlight'),
      caseType: 'Family Law',
      duration: '2 weeks'
    },
    {
      id: 2,
      name: 'Jean-Pierre Larson',
      role: t('testimonials.client2.role'),
      location: 'Quebec City, QC',
      avatar: '/images/avatars/jean.jpg',
      rating: 5,
      content: t('testimonials.client2.content'),
      highlight: t('testimonials.client2.highlight'),
      caseType: 'Corporate Law',
      duration: '1 month'
    },
    {
      id: 3,
      name: 'Sophie Chen',
      role: t('testimonials.client3.role'),
      location: 'Laval, QC',
      avatar: '/images/avatars/sophie.jpg',
      rating: 5,
      content: t('testimonials.client3.content'),
      highlight: t('testimonials.client3.highlight'),
      caseType: 'Immigration Law',
      duration: '3 weeks'
    }
  ];

  const attorneyTestimonials = [
    {
      name: 'Me. Alexandre Rousseau',
      firm: 'Rousseau & Associates',
      years: '15 years experience',
      avatar: '/images/avatars/alexandre.jpg',
      content: t('testimonials.attorney1.content'),
      specialization: 'Criminal Law'
    },
    {
      name: 'Me. Isabelle Moreau',
      firm: 'Moreau Law Group',
      years: '12 years experience',
      avatar: '/images/avatars/isabelle.jpg',
      content: t('testimonials.attorney2.content'),
      specialization: 'Real Estate Law'
    }
  ];

  const stats = [
    { number: '98%', label: t('testimonials.stats.satisfaction') },
    { number: '4.9/5', label: t('testimonials.stats.rating') },
    { number: '2,400+', label: t('testimonials.stats.reviews') },
  ];

  return (
    <section className="py-24 bg-navy-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {t('testimonials.title')}
            <span className="block bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">
              {t('testimonials.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-3 gap-8 mb-16 p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-gold-400 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-slate-300">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Client Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-20"
        >
          <h3 className="text-2xl lg:text-3xl font-bold text-white text-center mb-12">
            {t('testimonials.clients.title')}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 h-full">
                  {/* Quote Icon */}
                  <div className="absolute -top-4 left-6">
                    <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                      <Quote className="h-4 w-4 text-navy-900" />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-4 mt-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-gold-400 fill-current" />
                    ))}
                  </div>

                  {/* Highlight */}
                  <div className="text-gold-300 font-semibold mb-4 text-lg">
                    "{testimonial.highlight}"
                  </div>

                  {/* Content */}
                  <p className="text-slate-300 mb-6 leading-relaxed">
                    {testimonial.content}
                  </p>

                  {/* Case Details */}
                  <div className="flex items-center space-x-4 mb-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gold-400" />
                      <span className="text-slate-300">{testimonial.caseType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gold-400" />
                      <span className="text-slate-300">{testimonial.duration}</span>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center space-x-4 pt-6 border-t border-white/20">
                    <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center">
                      <span className="font-medium text-navy-900">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-slate-300">{testimonial.role}</div>
                      <div className="text-xs text-slate-400">{testimonial.location}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Attorney Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h3 className="text-2xl lg:text-3xl font-bold text-white text-center mb-12">
            {t('testimonials.attorneys.title')}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {attorneyTestimonials.map((attorney, index) => (
              <motion.div
                key={attorney.name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-gold-500/20 to-gold-400/10 border border-gold-400/30 rounded-2xl p-8">
                  {/* Badge */}
                  <div className="absolute -top-3 left-6">
                    <div className="bg-gold-400 text-navy-900 px-3 py-1 rounded-full text-xs font-semibold">
                      {attorney.specialization}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-4">
                    <p className="text-slate-200 text-lg leading-relaxed mb-6">
                      "{attorney.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gold-400 rounded-full flex items-center justify-center">
                        <span className="font-bold text-navy-900">
                          {attorney.name.split(' ')[1]?.[0] || attorney.name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-white">{attorney.name}</div>
                        <div className="text-sm text-gold-300">{attorney.firm}</div>
                        <div className="text-xs text-slate-400">{attorney.years}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <h4 className="text-2xl font-bold text-white mb-4">
              {t('testimonials.cta.title')}
            </h4>
            <p className="text-slate-300 mb-6">
              {t('testimonials.cta.subtitle')}
            </p>
            <Button variant="premium" size="lg" className="shadow-glow">
              {t('testimonials.cta.button')}
              <ThumbsUp className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;