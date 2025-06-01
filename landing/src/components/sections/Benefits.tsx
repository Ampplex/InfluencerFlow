import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Rocket, BarChart, Globe, Zap, Target, TrendingUp, Users } from 'lucide-react'
import { CyberCard } from '@/components/ui/card'
import { FloatingElements } from '@/components/effects/FloatingElementsProps'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { Benefit } from '@/types'

export const Benefits: React.FC = () => {
  const sectionRef = useScrollReveal()

  const benefits: Benefit[] = [
    {
      id: 'time-saved',
      title: '90% Time Saved',
      description: 'Automate manual tasks and focus on strategy',
      icon: 'Clock',
      stat: '90%',
      delay: 0
    },
    {
      id: 'faster-campaigns',
      title: '10x Faster Campaigns',
      description: 'Launch campaigns in hours, not weeks',
      icon: 'Rocket',
      stat: '10x',
      delay: 0.2
    },
    {
      id: 'better-roi',
      title: '5x Better ROI',
      description: 'Data-driven decisions and optimized targeting',
      icon: 'BarChart',
      stat: '5x',
      delay: 0.4
    },
    {
      id: 'global-scale',
      title: 'Global Scale',
      description: 'Multilingual support for worldwide campaigns',
      icon: 'Globe',
      stat: '50+',
      delay: 0.6
    }
  ]

  const additionalBenefits = [
    {
      icon: Zap,
      title: 'Instant AI Responses',
      description: 'AI agents respond to creators within minutes, not days',
      color: 'from-neon-green to-cyber-400'
    },
    {
      icon: Target,
      title: 'Precision Targeting',
      description: 'Advanced algorithms match brands with perfect creator audiences',
      color: 'from-neon-blue to-cyber-500'
    },
    {
      icon: TrendingUp,
      title: 'Performance Optimization',
      description: 'Real-time analytics help optimize campaigns for maximum impact',
      color: 'from-cyber-500 to-neon-purple'
    },
    {
      icon: Users,
      title: 'Scalable Operations',
      description: 'Handle thousands of creators and campaigns simultaneously',
      color: 'from-neon-purple to-cyber-600'
    }
  ]

  const iconMap = {
    Clock,
    Rocket,
    BarChart,
    Globe
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
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

  const statVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        duration: 0.8
      }
    }
  }

  return (
    <section id="benefits" className="py-20 bg-gradient-to-br from-white via-gray-50 to-cyber-50/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-cyber-400/20 to-neon-blue/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-neon-green/20 to-cyber-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

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
              Measurable Results
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gray-900">Why Choose</span>
            <br />
            <span className="gradient-text">InfluencerFlow?</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your influencer marketing with measurable results that speak for themselves. 
            Join the AI revolution and see the difference automation makes.
          </motion.p>
        </motion.div>

        {/* Main Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {benefits.map((benefit, _index) => {
            const IconComponent = iconMap[benefit.icon as keyof typeof iconMap]
            
            return (
              <motion.div
                key={benefit.id}
                variants={itemVariants}
                className="text-center group"
              >
                <FloatingElements intensity="light" direction="up" className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyber-500 to-cyber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-cyber-400/50 transition-all duration-300 group-hover:scale-110">
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                </FloatingElements>
                
                <motion.div
                  variants={statVariants}
                  className="text-4xl md:text-5xl font-bold gradient-text mb-3"
                >
                  {benefit.stat}
                </motion.div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-cyber-600 transition-colors">
                  {benefit.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Additional Benefits */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {additionalBenefits.map((benefit, index) => (
            <motion.div key={index} variants={itemVariants}>
              <CyberCard className="p-8 h-full group hover:shadow-xl hover:shadow-cyber-400/20 transition-all duration-300 bg-gradient-to-br from-white to-cyber-50/50 border border-cyber-200/50 hover:border-cyber-400/50">
                <div className="flex items-start space-x-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyber-700 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </CyberCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action Card */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-gradient-to-br from-cyber-900 via-gray-900 to-cyber-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/20 to-transparent" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-neon-blue/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-neon-green/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 bg-gradient-to-br from-neon-green to-neon-blue rounded-2xl flex items-center justify-center mx-auto mb-8"
            >
              <Zap className="w-12 h-12 text-white" />
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to <span className="text-neon-green">10x</span> Your Marketing?
            </h3>
            
            <p className="text-xl text-cyan-200 mb-8 max-w-2xl mx-auto">
              Join thousands of brands already using AI to automate their influencer campaigns. 
              Start your free trial today and see the difference in your first week.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://app.influencerflow.com', '_blank')}
                className="bg-gradient-to-r from-neon-green to-neon-blue text-black px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-neon-green/50 transition-all duration-300"
              >
                Start Free Trial
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Schedule Demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}