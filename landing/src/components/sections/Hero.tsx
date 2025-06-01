import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, Zap, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CyberCard } from '@/components/ui/card'
import { FloatingElements, FloatingGrid } from '@/components/effects/FloatingElementsProps'
import { openExternalLink } from '@/lib/utils'

export const Hero: React.FC = () => {
  const handleGetStarted = () => {
    openExternalLink('https://app.influencerflow.com')
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
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const floatingCardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: 1
      }
    }
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <FloatingGrid />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyber-400/20 to-cyber-300/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-neon-blue/20 to-cyber-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
          <motion.div variants={itemVariants} className="mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyber-100 to-cyber-50 border border-cyber-200 text-cyber-700 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Next Gen AI Platform
            </span>
          </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold leading-tight"
            >
              <span className="text-gray-900">STEP INTO</span>
              <br />
              <span className="gradient-text">THE FUTURE</span>
              <br />
              <span className="text-gray-900">OF INFLUENCER</span>
              <br />
              <span className="gradient-text">MARKETING</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-600 leading-relaxed max-w-lg"
            >
              AI-powered platform that automates the entire influencer marketing workflow. From creator discovery to performance tracking - all in one futuristic ecosystem.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
              variant="cyber"
              size="xl"
              onClick={handleGetStarted}
              className="group relative overflow-hidden"
              >
              <span className="relative z-10 flex items-center">
                Launch Platform
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-neon-blue to-cyber-400"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              </Button>
              
              <Button
              variant="glass"
              size="xl"
              className="border border-cyber-400/30 hover:border-cyber-400/60 text-cyber-400 hover:text-cyber-400 transition-colors"
              >
              Watch Demo
              <motion.div
                className="ml-2 w-2 h-2 bg-neon-green rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-3 gap-6 pt-8"
            >
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">10x</div>
                <div className="text-sm text-gray-600">Faster Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">90%</div>
                <div className="text-sm text-gray-600">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">5x</div>
                <div className="text-sm text-gray-600">Better ROI</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - 3D Card */}
          <motion.div
            variants={floatingCardVariants}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            <FloatingElements intensity="medium" direction="circular">
              <CyberCard className="relative p-8 bg-gradient-to-br from-white via-cyber-50 to-white shadow-2xl border border-cyber-300/50">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/10 to-transparent rounded-xl" />
                
                {/* Content */}
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">AI Control Center</h3>
                    <div className="w-12 h-12 bg-gradient-to-br from-cyber-500 to-cyber-400 rounded-xl flex items-center justify-center shadow-lg">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-cyber-200/50"
                    >
                      <Zap className="w-8 h-8 text-cyber-500 mb-2" />
                      <div className="text-sm font-semibold text-gray-800">Auto Discovery</div>
                      <div className="text-xs text-gray-600">1M+ Creators</div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-cyber-200/50"
                    >
                      <Target className="w-8 h-8 text-neon-blue mb-2" />
                      <div className="text-sm font-semibold text-gray-800">Smart Targeting</div>
                      <div className="text-xs text-gray-600">AI Precision</div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-cyber-200/50"
                    >
                      <TrendingUp className="w-8 h-8 text-neon-green mb-2" />
                      <div className="text-sm font-semibold text-gray-800">Real-time Analytics</div>
                      <div className="text-xs text-gray-600">Live Tracking</div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-cyber-200/50"
                    >
                      <Bot className="w-8 h-8 text-cyber-600 mb-2" />
                      <div className="text-sm font-semibold text-gray-800">AI Negotiation</div>
                      <div className="text-xs text-gray-600">Automated</div>
                    </motion.div>
                  </div>

                  {/* Performance Indicator */}
                  <div className="bg-gradient-to-r from-neon-green/20 to-neon-blue/20 rounded-lg p-4 border border-neon-green/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">System Performance</span>
                      <span className="text-sm text-neon-green font-bold">99.9%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-neon-green to-neon-blue h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '99.9%' }}
                        transition={{ duration: 2, delay: 1.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-neon-blue rounded-full animate-pulse" />
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-neon-green rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </CyberCard>
            </FloatingElements>
          </motion.div>
        </div>
      </div>
    </section>
  )
}