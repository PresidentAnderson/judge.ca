import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Scale, 
  Shield, 
  Users, 
  Clock, 
  Award, 
  Briefcase,
  Globe,
  CheckCircle,
  Star,
  ArrowRight,
  Phone,
  MessageSquare,
  Calendar,
  TrendingUp,
  Lock,
  Zap,
  BarChart3,
  FileText,
  Video,
  MapPin
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function HomePage() {
  const { t } = useTranslation('common');
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const stats = [
    { number: "10,000+", label: "Clients Served", icon: Users },
    { number: "500+", label: "Verified Attorneys", icon: Shield },
    { number: "98%", label: "Success Rate", icon: TrendingUp },
    { number: "24/7", label: "Support Available", icon: Clock }
  ];

  const features = [
    {
      icon: Scale,
      title: "AI-Powered Matching",
      description: "Our advanced algorithm matches you with the perfect attorney for your specific legal needs in seconds.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Shield,
      title: "Verified Professionals",
      description: "Every attorney is verified by the Barreau du Québec with validated credentials and track records.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Lock,
      title: "Secure & Confidential",
      description: "Bank-level encryption and strict confidentiality protocols protect your sensitive information.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Zap,
      title: "Instant Consultations",
      description: "Connect with attorneys immediately through video calls, chat, or schedule in-person meetings.",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Globe,
      title: "Bilingual Services",
      description: "Full support in both English and French to serve all Quebec residents effectively.",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: Award,
      title: "Transparent Pricing",
      description: "Clear, upfront pricing with no hidden fees. Know exactly what you'll pay before you commit.",
      color: "from-amber-500 to-yellow-600"
    }
  ];

  const testimonials = [
    {
      name: "Marie-Claude Tremblay",
      role: "Business Owner",
      content: "Judge.ca helped me find the perfect corporate lawyer in minutes. The platform is intuitive and the attorney matching was spot-on.",
      rating: 5,
      image: "/testimonials/client1.jpg"
    },
    {
      name: "James Mitchell",
      role: "Real Estate Developer",
      content: "Outstanding service! The attorney I found through Judge.ca handled my complex real estate transaction flawlessly.",
      rating: 5,
      image: "/testimonials/client2.jpg"
    },
    {
      name: "Sophie Bergeron",
      role: "Tech Entrepreneur",
      content: "The convenience of scheduling consultations and the quality of attorneys on this platform is unmatched in Quebec.",
      rating: 5,
      image: "/testimonials/client3.jpg"
    }
  ];

  const practiceAreas = [
    { name: "Corporate Law", icon: Briefcase, cases: "2,341" },
    { name: "Family Law", icon: Users, cases: "1,892" },
    { name: "Real Estate", icon: MapPin, cases: "3,127" },
    { name: "Immigration", icon: Globe, cases: "1,456" },
    { name: "Criminal Defense", icon: Shield, cases: "987" },
    { name: "Personal Injury", icon: FileText, cases: "2,103" }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Premium Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with Parallax */}
        <motion.div 
          style={{ y: heroParallax }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </motion.div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Hero Content */}
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center"
        >
          {/* Logo and Branding */}
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={scaleIn}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 blur-2xl opacity-50 animate-pulse" />
                <Scale className="relative w-20 h-20 text-amber-400 drop-shadow-2xl" />
              </div>
              <span className="ml-4 text-5xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Judge.ca
              </span>
            </div>
            <p className="mt-2 text-amber-200 text-sm font-medium tracking-widest uppercase">
              Quebec's Premier Legal Network
            </p>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
          >
            Connect with Quebec's
            <span className="block bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Top Legal Minds
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            AI-powered attorney matching. Verified credentials. Instant consultations.
            Your legal solution starts here.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <Link
              href="/match-request"
              className="group relative inline-flex items-center px-8 py-4 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold text-lg shadow-2xl transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Find Your Attorney
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/attorneys/register"
              className="group inline-flex items-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold text-lg transition-all hover:bg-white/20 hover:scale-105"
            >
              Join as Attorney
              <Briefcase className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg mb-3">
                  <stat.icon className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Premium Features Section */}
      <section className="py-32 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="absolute inset-0 bg-[url('/pattern-bg.svg')] opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              Why Choose Judge.ca
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Revolutionary Legal Services Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of legal services with cutting-edge technology and 
              unparalleled professional expertise.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                {/* Content */}
                <div className="relative p-8">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg mb-6`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                    Learn more
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Practice Areas Section */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Legal Expertise Across All Areas
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Connect with specialized attorneys in every field of law
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {practiceAreas.map((area, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600 hover:border-amber-500 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-500/20 rounded-lg mr-4">
                      <area.icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {area.name}
                    </h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="text-2xl font-bold text-amber-400 mr-2">{area.cases}</span>
                  <span className="text-sm">Cases Handled</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
              Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Legal Solution in 4 Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From consultation request to resolution - we make legal services simple
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 transform -translate-y-1/2" />
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
            >
              {[
                { step: 1, title: "Describe Your Case", description: "Tell us about your legal needs in a secure, confidential form", icon: FileText },
                { step: 2, title: "AI Matching", description: "Our algorithm instantly matches you with the best attorneys", icon: Zap },
                { step: 3, title: "Choose & Connect", description: "Review profiles and connect with your chosen attorney", icon: Users },
                { step: 4, title: "Get Resolution", description: "Work with your attorney to achieve the best outcome", icon: CheckCircle }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="relative text-center"
                >
                  <div className="relative z-10 bg-white rounded-2xl p-8 shadow-xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white font-bold text-2xl mb-6">
                      {item.step}
                    </div>
                    <item.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern-bg.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trusted by Thousands Across Quebec
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join the growing community of satisfied clients who found their perfect legal match
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-white mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mr-4" />
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-blue-200 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern-bg.svg')] opacity-20" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Ready to Find Your Legal Champion?
          </h2>
          <p className="text-xl md:text-2xl text-slate-800 mb-10">
            Join thousands who've successfully resolved their legal matters through Judge.ca
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/match-request"
              className="group inline-flex items-center px-10 py-5 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-2xl transition-all hover:bg-slate-800 hover:scale-105"
            >
              Start Your Free Consultation
              <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-10 py-5 bg-white/90 backdrop-blur-sm text-slate-900 rounded-xl font-bold text-lg shadow-xl transition-all hover:bg-white hover:scale-105"
            >
              <Phone className="mr-3 w-6 h-6" />
              1-800-JUSTICE
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center space-x-8 text-slate-800">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              <span className="font-semibold">No Hidden Fees</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              <span className="font-semibold">100% Confidential</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-6 h-6 mr-2" />
              <span className="font-semibold">24/7 Support</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust Bar */}
      <section className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            <div className="text-white text-sm font-medium">Certified by:</div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-white" />
              <span className="text-white font-semibold">Barreau du Québec</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-white" />
              <span className="text-white font-semibold">Quebec Law Society</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-6 h-6 text-white" />
              <span className="text-white font-semibold">256-bit SSL Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-white" />
              <span className="text-white font-semibold">GDPR Compliant</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'fr', ['common'])),
    },
  };
};