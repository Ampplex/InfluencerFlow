import React from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Bot, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings,
  Users,
  MessageSquare,
  Signature,
  Wallet,
  LineChart,
  Shield,
  Zap
} from 'lucide-react'
import { CyberCard } from '@/components/ui/card'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { Feature } from '@/types'

export const Features: React.FC = () => {
  const sectionRef = useScrollReveal()

  const features: Feature[] = [
    {
      id: 'discovery',
      title: 'Creator Discovery Engine',
      description: 'AI-powered search across platforms with audience insights and engagement metrics.',
      icon: 'Search',
      benefits: ['Searchable creator database', 'AI prompt search', 'Detailed creator profiles'],
      color: 'from-cyber-500 to-cyber-400'
    },
    {
      id: 'outreach',
      title: 'AI Outreach & Negotiation',
      description: 'Automated multilingual outreach with AI agents handling negotiations.',
      icon: 'Bot',
      benefits: ['Email & voice outreach', 'AI negotiation agents', 'CRM-style interface'],
      color: 'from-neon-blue to-cyber-400'
    },
    {
      id: 'contracts',
      title: 'Contract Automation',
      description: 'Auto-generated contracts with e-signature integration and status tracking.',
      icon: 'FileText',
      benefits: ['Smart contract generation', 'E-signature integration', 'Contract management'],
      color: 'from-neon-green to-cyber-500'
    },
    {
      id: 'payments',
      title: 'Smart Payments',
      description: 'Automated invoicing with milestone-based payouts and payment tracking.',
      icon: 'CreditCard',
      benefits: ['Smart invoicing', 'Milestone payments', 'Payment dashboards'],
      color: 'from-neon-purple to-cyber-600'
    },
    {
      id: 'tracking',
      title: 'Performance Tracking',
      description: 'Real-time content tracking with automated performance reports and ROI analysis.',
      icon: 'BarChart3',
      benefits: ['Real-time tracking', 'Auto-generated reports', 'ROI analysis'],
      color: 'from-cyber-600 to-neon-blue'
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'Comprehensive management tools with role-based access for all stakeholders.',
      icon: 'Settings',
      benefits: ['User management', 'Campaign oversight', 'Role-based access'],
      color: 'from-gray-600 to-cyber-500'
    }
  ]

  const iconMap = {
    Search,
    Bot,
    FileText,
    CreditCard,
    BarChart3,
    Settings,
    Users,
    MessageSquare,
    Signature,
    Wallet,
    LineChart,
    Shield
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-cyber-50/50 via-white to-cyber-100/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-cyber-400/10 to-neon-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-gradient-to-r from-neon-green/10 to-cyber-500/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" ref={sectionRef}>
        {/* Section Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants} className="mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyber-100 to-cyber-50 border border-cyber-200 text-cyber-700 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gray-900">Everything You Need to</span>
            <br />
            <span className="gradient-text">Scale Your Campaigns</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto">
            From AI-powered discovery to automated payments, our platform handles every aspect 
            of influencer marketing with cutting-edge technology.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap]
            
            return (
              <motion.div
                key={feature.id}
                variants={itemVariants}
                whileHover="hover"
                initial="rest"
                className="group"
              >
                <motion.div variants={cardHoverVariants}>
                  <CyberCard className="h-full p-8 bg-gradient-to-br from-white to-cyber-50/50 border border-cyber-200/50 hover:border-cyber-400/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-cyber-400/20">
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-cyber-700 transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Benefits List */}
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <motion.li
                          key={benefitIndex}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + benefitIndex * 0.1 }}
                          className="flex items-center text-sm text-gray-600"
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-cyber-400 to-cyber-300 rounded-full mr-3 flex-shrink-0" />
                          {benefit}
                        </motion.li>
                      ))}
                    </ul>

                    {/* Hover Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-cyber-400/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />
                  </CyberCard>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants}>
            <CyberCard className="p-8 text-center bg-gradient-to-br from-neon-green/10 to-cyber-50 border border-neon-green/30">
              <Users className="w-12 h-12 text-neon-green mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">1M+ Creators</h4>
              <p className="text-gray-600">Access to verified influencers across all platforms</p>
            </CyberCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <CyberCard className="p-8 text-center bg-gradient-to-br from-neon-blue/10 to-cyber-50 border border-neon-blue/30">
              <MessageSquare className="w-12 h-12 text-neon-blue mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">50+ Languages</h4>
              <p className="text-gray-600">Multilingual AI communication for global reach</p>
            </CyberCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <CyberCard className="p-8 text-center bg-gradient-to-br from-cyber-400/10 to-cyber-50 border border-cyber-400/30">
              <Shield className="w-12 h-12 text-cyber-500 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">99.9% Uptime</h4>
              <p className="text-gray-600">Enterprise-grade reliability and security</p>
            </CyberCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}