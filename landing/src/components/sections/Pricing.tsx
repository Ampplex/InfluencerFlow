import React from 'react'
import { motion } from 'framer-motion'
import { Check, Star, Zap, Crown, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CyberCard } from '@/components/ui/card'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { openExternalLink } from '@/lib/utils'
import type { PricingPlan } from '@/types'

export const Pricing: React.FC = () => {
  const sectionRef = useScrollReveal()

  const plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$99',
      description: 'Perfect for small businesses and startups',
      features: [
        'Up to 50 creators',
        'AI outreach & negotiation',
        'Basic analytics dashboard',
        'Email support',
        'Standard templates',
        '5 active campaigns'
      ],
      buttonText: 'Start Free Trial',
      buttonAction: () => openExternalLink('https://app.influencerflow.com')
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$299',
      description: 'Ideal for growing agencies and brands',
      features: [
        'Up to 500 creators',
        'Advanced AI features',
        'Advanced analytics & reports',
        'Priority support',
        'Custom integrations',
        'Unlimited campaigns',
        'A/B testing tools',
        'Performance optimization'
      ],
      isPopular: true,
      buttonText: 'Start Free Trial',
      buttonAction: () => openExternalLink('https://app.influencerflow.com')
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with specific needs',
      features: [
        'Unlimited creators',
        'White-label solution',
        'Custom AI training',
        'Dedicated account manager',
        'SLA guarantee',
        'Custom integrations',
        'Advanced security',
        'Training & onboarding'
      ],
      buttonText: 'Contact Sales',
      buttonAction: () => openExternalLink('mailto:sales@influencerflow.com')
    }
  ]

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

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.03, 
      y: -8,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return Rocket
      case 'professional': return Star
      case 'enterprise': return Crown
      default: return Zap
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter': return 'from-cyber-500 to-cyber-400'
      case 'professional': return 'from-neon-blue to-cyber-500'
      case 'enterprise': return 'from-neon-purple to-cyber-600'
      default: return 'from-cyber-500 to-cyber-400'
    }
  }

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-cyber-50/50 via-white to-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyber-400/10 to-neon-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-neon-green/10 to-cyber-500/10 rounded-full blur-3xl" />

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
              Simple Pricing
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gray-900">Choose Your</span>
            <br />
            <span className="gradient-text">AI-Powered Plan</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transparent pricing that scales with your business. Start free and upgrade as you grow. 
            No hidden fees, no long-term contracts.
          </motion.p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {plans.map((plan, index) => {
            const PlanIcon = getPlanIcon(plan.id)
            const isPopular = plan.isPopular
            
            return (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                whileHover="hover"
                initial="rest"
                className={`relative group ${isPopular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                              <motion.div variants={itemVariants} className="mb-4">
                                <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyber-100 to-cyber-50 border border-cyber-200 text-cyber-700 text-sm font-medium">
                                  <Zap className="w-4 h-4 mr-2" />
                                  Most Popular
                                </span>
                              </motion.div>
                  </div>
                )}

                <motion.div variants={cardHoverVariants}>
                  <CyberCard className={`h-full p-8 relative overflow-hidden ${
                    isPopular 
                      ? 'bg-gradient-to-br from-cyber-900 to-gray-900 text-white border-2 border-cyber-400 shadow-xl shadow-cyber-400/20' 
                      : 'bg-gradient-to-br from-white to-cyber-50/30 border border-cyber-200/50 hover:border-cyber-400/50'
                  } transition-all duration-300`}>
                    
                    {/* Background Effects for Popular Plan */}
                    {isPopular && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/10 to-transparent" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/20 rounded-full blur-2xl" />
                      </>
                    )}

                    <div className="relative z-10">
                      {/* Plan Icon */}
                      <div className={`w-16 h-16 bg-gradient-to-br ${getPlanColor(plan.id)} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <PlanIcon className="w-8 h-8 text-white" />
                      </div>

                      {/* Plan Header */}
                      <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                      
                      <div className="mb-4">
                        <span className={`text-4xl font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                          {plan.price}
                        </span>
                        {plan.price !== 'Custom' && (
                          <span className={`text-lg ${isPopular ? 'text-gray-300' : 'text-gray-500'}`}>
                            /month
                          </span>
                        )}
                      </div>
                      
                      <p className={`mb-8 ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                        {plan.description}
                      </p>

                      {/* Features List */}
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature, featureIndex) => (
                          <motion.li
                            key={featureIndex}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                            className="flex items-center"
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                              isPopular ? 'bg-neon-green' : 'bg-cyber-400'
                            }`}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className={`text-sm ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Button
                        onClick={plan.buttonAction}
                        variant={isPopular ? "neon" : "cyber"}
                        size="lg"
                        className="w-full group relative overflow-hidden"
                      >
                        <span className="relative z-10">{plan.buttonText}</span>
                        {isPopular && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-neon-green to-neon-blue"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </Button>
                    </div>
                  </CyberCard>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div variants={itemVariants}>
            <CyberCard className="inline-block p-6 bg-gradient-to-r from-cyber-50 to-white border border-cyber-200/50">
              <div className="flex items-center space-x-4">
                <Zap className="w-8 h-8 text-cyber-500" />
                <div className="text-left">
                  <h4 className="font-bold text-gray-900">14-Day Free Trial</h4>
                  <p className="text-sm text-gray-600">No credit card required • Cancel anytime</p>
                </div>
              </div>
            </CyberCard>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-neon-green to-cyber-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">No Setup Fees</h4>
              <p className="text-sm text-gray-600">Get started immediately with zero upfront costs</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-neon-blue to-cyber-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Activation</h4>
              <p className="text-sm text-gray-600">Your AI agents are ready to work in minutes</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-cyber-500 to-neon-purple rounded-xl flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Enterprise Support</h4>
              <p className="text-sm text-gray-600">24/7 support for all paid plans</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}