import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { 
  Scale, 
  Menu, 
  X, 
  Shield, 
  Users, 
  BookOpen, 
  Phone,
  ChevronDown,
  ArrowRight,
  Gavel
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const Header = () => {
  const { t } = useTranslation('common');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      title: t('navigation.services'),
      href: '/services',
      description: 'Comprehensive legal services',
      items: [
        { title: 'Attorney Matching', href: '/match-request', icon: Users },
        { title: 'Legal Consultation', href: '/consultation', icon: Scale },
        { title: 'Document Review', href: '/document-review', icon: BookOpen },
        { title: 'Case Management', href: '/case-management', icon: Shield },
      ]
    },
    {
      title: t('navigation.attorneys'),
      href: '/attorneys',
      description: 'For legal professionals',
      items: [
        { title: 'Join Our Network', href: '/attorneys/register', icon: Users },
        { title: 'Attorney Dashboard', href: '/attorneys/dashboard', icon: Scale },
        { title: 'Practice Management', href: '/attorneys/practice', icon: Gavel },
        { title: 'Resources', href: '/attorneys/resources', icon: BookOpen },
      ]
    },
    {
      title: t('navigation.resources'),
      href: '/resources',
      description: 'Legal education and guides',
      items: [
        { title: 'Legal Guides', href: '/education', icon: BookOpen },
        { title: 'FAQ', href: '/faq', icon: Shield },
        { title: 'Blog', href: '/blog', icon: BookOpen },
        { title: 'Legal Dictionary', href: '/dictionary', icon: Scale },
      ]
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative">
                <Scale className="h-8 w-8 text-navy-900" />
                <div className="absolute inset-0 animate-pulse-glow"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-navy-900 to-navy-700 bg-clip-text text-transparent">
                Judge.ca
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationItems.map((item, index) => (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger className="text-slate-700 hover:text-navy-900 font-medium">
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-6">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-navy-900 mb-2">
                            {item.title}
                          </h4>
                          <p className="text-sm text-slate-600 mb-4">
                            {item.description}
                          </p>
                        </div>
                        <div className="grid gap-3">
                          {item.items.map((subItem) => (
                            <NavigationMenuLink key={subItem.title} asChild>
                              <Link
                                href={subItem.href}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                              >
                                <subItem.icon className="h-5 w-5 text-navy-600 group-hover:text-navy-900" />
                                <div>
                                  <div className="font-medium text-slate-900 group-hover:text-navy-900">
                                    {subItem.title}
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-navy-600 ml-auto" />
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
                
                <NavigationMenuItem>
                  <Link href="/contact" className="text-slate-700 hover:text-navy-900 font-medium px-4 py-2">
                    {t('navigation.contact')}
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">
                {t('auth.login')}
              </Link>
            </Button>
            <Button variant="premium" asChild>
              <Link href="/match-request">
                {t('cta.findAttorney')}
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-slate-200"
          >
            <div className="px-4 py-6 space-y-6">
              {navigationItems.map((item) => (
                <div key={item.title} className="space-y-3">
                  <h3 className="font-semibold text-navy-900">{item.title}</h3>
                  <div className="pl-4 space-y-2">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <subItem.icon className="h-4 w-4 text-navy-600" />
                        <span className="text-slate-700">{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('auth.login')}
                  </Link>
                </Button>
                <Button variant="premium" className="w-full" asChild>
                  <Link href="/match-request" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('cta.findAttorney')}
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;