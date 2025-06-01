import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Zap, Globe, Clock, TrendingUp } from 'lucide-react'
import { CyberCard } from '@/components/ui/card'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export const About: React.FC = () => {
  const sectionRef = useScrollReveal()

  const problems = [
    {
      icon: AlertTriangle,
      title: "Manual & Inefficient Processes",
      description: "Brands struggle with spreadsheets, emails, and WhatsApp for campaign management",
      color: "text-red-500"
    },
    {
      icon: AlertTriangle,
      title: "Fragmented Communication",
      description: "No unified platform for discovery, outreach, and performance tracking",
      color: "text-orange-500"
    },
    {
      icon: AlertTriangle,
      title: "Poor Creator Experience",
      description: "Delayed payments, language barriers, and unclear expectations",
      color: "text-yellow-500"
    }
  ]

  const solutions = [
    {
      icon: CheckCircle,
      title: "AI-Powered Automation",
      description: "End-to-end workflow automation from discovery to payment",
      color: "text-cyber-500"
    },
    {
      icon: CheckCircle,
      title: "Unified Platform",
      description: "All tools in one place with multilingual communication support",
      color: "text-neon-blue"
    },
    {
      icon: CheckCircle,
      title: "Scalable & Fair",
      description: "Human-like AI agents that scale personalized interactions",
      color: "text-neon-green"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-white via-cyber-50/30 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      <div className="absolute top-1/2 left-10 w-40 h-40 bg-gradient-to-r from-cyber-400/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-60 h-60 bg-gradient-to-r from-neon-blue/10 to-transparent rounded-full blur-3xl" />

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
              Revolutionizing the Industry
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gray-900">The Future of</span>
            <br />
            <span className="gradient-text">Influencer Marketing</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're solving the manual, inefficient, and fragmented process of influencer marketing 
            with AI-powered automation that scales personalized interactions globally.
          </motion.p>
        </motion.div>

        {/* Problem vs Solution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Problems */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.h3 variants={itemVariants} className="text-3xl font-bold text-gray-900 mb-8">
              The Problems We Solve
            </motion.h3>
            
            {problems.map((problem, index) => (
              <motion.div key={index} variants={itemVariants}>
                <CyberCard className="p-6 border-l-4 border-red-400 bg-gradient-to-r from-red-50 to-white hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 ${problem.color.replace('text-', 'bg-').replace('-500', '-100')} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <problem.icon className={`w-5 h-5 ${problem.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{problem.title}</h4>
                      <p className="text-gray-600 text-sm">{problem.description}</p>
                    </div>
                  </div>
                </CyberCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Solutions */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.h3 variants={itemVariants} className="text-3xl font-bold text-gray-900 mb-8">
              Our AI-Powered Solution
            </motion.h3>
            
            {solutions.map((solution, index) => (
              <motion.div key={index} variants={itemVariants}>
                <CyberCard className="p-6 border-l-4 border-cyber-400 bg-gradient-to-r from-cyber-50 to-white hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 ${solution.color.replace('text-', 'bg-').replace('-500', '-100')} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <solution.icon className={`w-5 h-5 ${solution.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{solution.title}</h4>
                      <p className="text-gray-600 text-sm">{solution.description}</p>
                    </div>
                  </div>
                </CyberCard>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Key Metrics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-gradient-to-br from-cyber-900 to-gray-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/10 to-transparent" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-neon-blue/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Transforming the Industry
              </h3>
              <p className="text-cyan-200 text-lg">
                Join thousands of brands already using AI to revolutionize their marketing
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: Clock, stat: "90%", label: "Time Reduction", color: "text-neon-green" },
                { icon: TrendingUp, stat: "10x", label: "Faster Campaigns", color: "text-neon-blue" },
                { icon: Globe, stat: "50+", label: "Languages Supported", color: "text-cyber-400" },
                { icon: Zap, stat: "1M+", label: "Creator Database", color: "text-neon-green" }
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center group"
                >
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-all duration-300">
                    <metric.icon className={`w-8 h-8 ${metric.color}`} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{metric.stat}</div>
                  <div className="text-cyan-200 text-sm">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}