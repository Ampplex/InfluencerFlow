import React from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone,
  MapPin,
  ArrowRight,
  Heart
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { scrollToSection, openExternalLink } from '@/lib/utils'
import type { SocialLink, NavItem } from '@/types'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  const productLinks: NavItem[] = [
    { label: 'Features', href: 'features' },
    { label: 'Pricing', href: 'pricing' },
    { label: 'API Documentation', href: 'https://docs.influencerflow.com' },
    { label: 'Integrations', href: 'https://integrations.influencerflow.com' },
    { label: 'Changelog', href: 'https://changelog.influencerflow.com' }
  ]

  const companyLinks: NavItem[] = [
    { label: 'About Us', href: 'about' },
    { label: 'Blog', href: 'https://blog.influencerflow.com' },
    { label: 'Careers', href: 'https://careers.influencerflow.com' },
    { label: 'Press Kit', href: 'https://press.influencerflow.com' },
    { label: 'Contact', href: 'mailto:hello@influencerflow.com' }
  ]

  const supportLinks: NavItem[] = [
    { label: 'Help Center', href: 'https://help.influencerflow.com' },
    { label: 'Community', href: 'https://community.influencerflow.com' },
    { label: 'Status', href: 'https://status.influencerflow.com' },
    { label: 'System Requirements', href: 'https://help.influencerflow.com/requirements' },
    { label: 'Security', href: 'https://security.influencerflow.com' }
  ]

  const legalLinks: NavItem[] = [
    { label: 'Privacy Policy', href: 'https://influencerflow.com/privacy' },
    { label: 'Terms of Service', href: 'https://influencerflow.com/terms' },
    { label: 'Cookie Policy', href: 'https://influencerflow.com/cookies' },
    { label: 'GDPR', href: 'https://influencerflow.com/gdpr' }
  ]

  const socialLinks: SocialLink[] = [
    { platform: 'Twitter', url: 'https://twitter.com/influencerflow', icon: 'Twitter' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/company/influencerflow', icon: 'Linkedin' },
    { platform: 'Instagram', url: 'https://instagram.com/influencerflow', icon: 'Instagram' },
    { platform: 'YouTube', url: 'https://youtube.com/@influencerflow', icon: 'Youtube' }
  ]

  const iconMap = {
    Twitter,
    Linkedin,
    Instagram,
    Youtube
  }

  const handleLinkClick = (href: string) => {
    if (href.startsWith('http') || href.startsWith('mailto:')) {
      openExternalLink(href)
    } else {
      scrollToSection(href)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-cyber-900 to-gray-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cyber-500/10 to-neon-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-neon-green/10 to-cyber-400/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Newsletter Section */}
        <div className="border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div variants={itemVariants} className="mb-4">
                <Badge variant="neon" className="text-sm">
                  🚀 Stay Updated
                </Badge>
              </motion.div>
              
              <motion.h3 variants={itemVariants} className="text-3xl md:text-4xl font-bold mb-4">
                Get the Latest AI Marketing Insights
              </motion.h3>
              
              <motion.p variants={itemVariants} className="text-xl text-gray-300 mb-8">
                Join 50,000+ marketers getting weekly tips on AI-powered influencer marketing, 
                platform updates, and industry trends.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-transparent"
                />
                <Button
                  variant="neon"
                  className="group"
                  onClick={() => openExternalLink('https://newsletter.influencerflow.com')}
                >
                  Subscribe
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8"
          >
            {/* Company Info */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-cyber-500 to-cyber-400 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">InfluencerFlow</span>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                The future of influencer marketing is here. Our AI-powered platform automates 
                every aspect of creator campaigns, from discovery to payment, helping brands 
                scale their marketing efforts effortlessly.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="w-5 h-5 text-cyber-400" />
                  <span>hello@influencerflow.com</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone className="w-5 h-5 text-cyber-400" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-cyber-400" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </motion.div>

            {/* Product Links */}
            <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold mb-6 text-cyber-300">Product</h4>
              <ul className="space-y-3">
                {productLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-gray-400 hover:text-cyber-300 transition-colors duration-200 text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company Links */}
            <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold mb-6 text-cyber-300">Company</h4>
              <ul className="space-y-3">
                {companyLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-gray-400 hover:text-cyber-300 transition-colors duration-200 text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Support Links */}
            <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold mb-6 text-cyber-300">Support</h4>
              <ul className="space-y-3">
                {supportLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-gray-400 hover:text-cyber-300 transition-colors duration-200 text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold mb-6 text-cyber-300">Legal</h4>
              <ul className="space-y-3">
                {legalLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-gray-400 hover:text-cyber-300 transition-colors duration-200 text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
            >
              <motion.div variants={itemVariants} className="flex items-center space-x-2 text-gray-400">
                <span>© {currentYear} InfluencerFlow. All rights reserved.</span>
                <span className="flex items-center space-x-1">
                  <span>Made with</span>
                  <Heart className="w-4 h-4 text-red-400" />
                  <span>for creators</span>
                </span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center space-x-6">
                {/* Social Links */}
                <div className="flex space-x-4">
                  {socialLinks.map((social, _index) => {
                    const IconComponent = iconMap[social.icon as keyof typeof iconMap]
                    return (
                      <motion.button
                        key={social.platform}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openExternalLink(social.url)}
                        className="w-10 h-10 bg-gray-800 hover:bg-cyber-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                      >
                        <IconComponent className="w-5 h-5" />
                      </motion.button>
                    )
                  })}
                </div>

                {/* Status Indicator */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                  <span className="text-gray-400">All systems operational</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  )
}