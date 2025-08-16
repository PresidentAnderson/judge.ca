import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { 
  Scale, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Shield,
  Award,
  Clock,
  Globe
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  const { t } = useTranslation('common');

  const footerSections = [
    {
      title: t('footer.services.title'),
      links: [
        { name: t('footer.services.matching'), href: '/match-request' },
        { name: t('footer.services.consultation'), href: '/consultation' },
        { name: t('footer.services.documents'), href: '/document-review' },
        { name: t('footer.services.case'), href: '/case-management' },
      ]
    },
    {
      title: t('footer.attorneys.title'),
      links: [
        { name: t('footer.attorneys.join'), href: '/attorneys/register' },
        { name: t('footer.attorneys.dashboard'), href: '/attorneys/dashboard' },
        { name: t('footer.attorneys.resources'), href: '/attorneys/resources' },
        { name: t('footer.attorneys.verification'), href: '/attorneys/verification' },
      ]
    },
    {
      title: t('footer.resources.title'),
      links: [
        { name: t('footer.resources.guides'), href: '/education' },
        { name: t('footer.resources.faq'), href: '/faq' },
        { name: t('footer.resources.blog'), href: '/blog' },
        { name: t('footer.resources.dictionary'), href: '/dictionary' },
      ]
    },
    {
      title: t('footer.company.title'),
      links: [
        { name: t('footer.company.about'), href: '/about' },
        { name: t('footer.company.contact'), href: '/contact' },
        { name: t('footer.company.careers'), href: '/careers' },
        { name: t('footer.company.press'), href: '/press' },
      ]
    }
  ];

  const trustIndicators = [
    {
      icon: Shield,
      title: t('footer.trust.security'),
      description: t('footer.trust.securityDesc')
    },
    {
      icon: Award,
      title: t('footer.trust.verified'),
      description: t('footer.trust.verifiedDesc')
    },
    {
      icon: Clock,
      title: t('footer.trust.support'),
      description: t('footer.trust.supportDesc')
    },
    {
      icon: Globe,
      title: t('footer.trust.quebec'),
      description: t('footer.trust.quebecDesc')
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' },
  ];

  return (
    <footer className="bg-navy-950 text-white">
      {/* Trust Indicators */}
      <div className="border-b border-navy-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gold-500/10 rounded-full mb-4 group-hover:bg-gold-500/20 transition-colors">
                  <indicator.icon className="h-6 w-6 text-gold-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {indicator.title}
                </h3>
                <p className="text-sm text-slate-400">
                  {indicator.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/" className="flex items-center space-x-2 mb-6">
                <Scale className="h-8 w-8 text-gold-400" />
                <span className="text-2xl font-bold">Judge.ca</span>
              </Link>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {t('footer.description')}
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gold-400" />
                  <span className="text-sm text-slate-300">+1 (514) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gold-400" />
                  <span className="text-sm text-slate-300">contact@judge.ca</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gold-400" />
                  <span className="text-sm text-slate-300">Montreal, Quebec, Canada</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4 mt-6">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="p-2 bg-navy-800 rounded-lg hover:bg-gold-500 transition-colors group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4 text-slate-300 group-hover:text-navy-900" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-300 hover:text-gold-400 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-navy-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-sm text-slate-400">
                © 2024 Judge.ca. {t('footer.rights')}
              </p>
              <div className="flex items-center space-x-6">
                <Link
                  href="/privacy"
                  className="text-sm text-slate-400 hover:text-gold-400 transition-colors"
                >
                  {t('footer.privacy')}
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-slate-400 hover:text-gold-400 transition-colors"
                >
                  {t('footer.terms')}
                </Link>
                <Link
                  href="/cookies"
                  className="text-sm text-slate-400 hover:text-gold-400 transition-colors"
                >
                  {t('footer.cookies')}
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">{t('footer.language')}:</span>
              <div className="flex space-x-2">
                <button className="text-sm text-slate-300 hover:text-gold-400 transition-colors">
                  FR
                </button>
                <Separator orientation="vertical" className="h-4" />
                <button className="text-sm text-slate-300 hover:text-gold-400 transition-colors">
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;