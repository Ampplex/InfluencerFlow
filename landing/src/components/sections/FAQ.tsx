import React from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, MessageSquare, Zap } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CyberCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { openExternalLink } from '@/lib/utils'
import type { FAQ as FAQType } from '@/types'

export const FAQ: React.FC = () => {
  const sectionRef = useScrollReveal()

  const faqs: FAQType[] = [
    {
      id: 'ai-outreach',
      question: 'How does the AI outreach system work?',
      answer: 'Our AI agents analyze creator profiles, engagement patterns, and communication preferences to craft personalized outreach messages in multiple languages. The system learns from successful interactions to continuously improve response rates and uses advanced natural language processing to maintain authentic, human-like conversations.'
    },
    {
      id: 'integrations',
      question: 'Can I integrate InfluencerFlow with my existing tools?',
      answer: 'Yes! We offer comprehensive API integrations with popular CRM systems, email platforms, social media management tools, and analytics platforms. Our enterprise plans include custom integrations tailored to your specific workflow, plus dedicated support for seamless implementation.'
    },
    {
      id: 'accuracy',
      question: 'How accurate is the creator discovery engine?',
      answer: 'Our AI-powered discovery engine analyzes over 50 million creators across platforms with 95% accuracy in audience demographics and engagement metrics. We continuously update our database in real-time using advanced machine learning algorithms and maintain partnerships with major social platforms for verified data.'
    },
    {
      id: 'payments',
      question: 'What payment methods do you support?',
      answer: 'We support all major payment methods including Stripe, PayPal, Razorpay, and bank transfers. Creators can receive payments in their local currency with automatic tax handling, milestone-based payouts, and real-time payment tracking. We also support cryptocurrency payments for select regions.'
    },
    {
      id: 'trial',
      question: 'Is there a free trial available?',
      answer: 'Yes! We offer a comprehensive 14-day free trial with full access to all features, including AI outreach, creator discovery, and analytics. No credit card required to get started. You can explore the platform, run test campaigns, and see how it fits your needs completely risk-free.'
    },
    {
      id: 'security',
      question: 'How secure is my data on InfluencerFlow?',
      answer: 'We take security seriously with enterprise-grade encryption, SOC 2 compliance, and GDPR adherence. All data is encrypted in transit and at rest, with regular security audits and penetration testing. We also offer custom security configurations for enterprise clients.'
    },
    {
      id: 'support',
      question: 'What kind of support do you provide?',
      answer: 'We offer 24/7 support for all paid plans, including live chat, email, and phone support. Enterprise customers get dedicated account managers, priority support queues, and custom training sessions. Our support team includes AI specialists who can help optimize your campaigns.'
    },
    {
      id: 'scaling',
      question: 'Can InfluencerFlow handle large-scale campaigns?',
      answer: 'Absolutely! Our platform is built to scale and can handle thousands of creators and simultaneous campaigns. We use cloud infrastructure that automatically scales based on demand, ensuring consistent performance whether you\'re managing 10 or 10,000 influencer relationships.'
    }
  ]

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

  const handleContactSupport = () => {
    openExternalLink('mailto:support@influencerflow.com')
  }

  return (
    <section id="faq" className="py-20 bg-gradient-to-br from-white via-gray-50 to-cyber-50/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyber-400/10 to-neon-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-neon-green/10 to-cyber-500/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" ref={sectionRef}>
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
              Get Answers
            </span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gray-900">Frequently Asked</span>
            <br />
            <span className="gradient-text">Questions</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get answers to common questions about InfluencerFlow. Can't find what you're looking for? 
            Our support team is here to help 24/7.
          </motion.p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12"
        >
          <CyberCard className="p-8 bg-gradient-to-br from-white to-cyber-50/30 border border-cyber-200/50">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, _index) => (
                <motion.div key={faq.id} variants={itemVariants}>
                  <AccordionItem 
                    value={faq.id} 
                    className="border border-cyber-200/30 rounded-lg px-6 hover:border-cyber-400/50 transition-colors duration-300 bg-white/50 backdrop-blur-sm"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-6 text-lg font-semibold text-gray-900 hover:text-cyber-600 transition-colors duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyber-400 to-cyber-300 rounded-lg flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-4 h-4 text-white" />
                        </div>
                        <span>{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 text-gray-600 leading-relaxed pl-11">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </CyberCard>
        </motion.div>

        {/* Additional Help Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Support Card */}
          <motion.div variants={itemVariants}>
            <CyberCard className="p-8 text-center bg-gradient-to-br from-cyber-50 to-white border border-cyber-200/50 hover:border-cyber-400/50 transition-all duration-300 group hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-cyber-500 to-cyber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Need More Help?</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our support team is available 24/7 to help you get the most out of InfluencerFlow. 
                Get personalized assistance from our AI specialists.
              </p>
              <Button
                variant="cyber"
                onClick={handleContactSupport}
                className="w-full"
              >
                Contact Support
              </Button>
            </CyberCard>
          </motion.div>

          {/* Demo Card */}
          <motion.div variants={itemVariants}>
            <CyberCard className="p-8 text-center bg-gradient-to-br from-neon-blue/10 to-white border border-neon-blue/30 hover:border-neon-blue/50 transition-all duration-300 group hover:shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-cyber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">See It In Action</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Schedule a personalized demo to see how InfluencerFlow can transform your 
                influencer marketing campaigns with AI automation.
              </p>
              <Button
                variant="neon"
                onClick={() => openExternalLink('https://calendly.com/influencerflow')}
                className="w-full"
              >
                Schedule Demo
              </Button>
            </CyberCard>
          </motion.div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <CyberCard className="inline-block p-6 bg-gradient-to-r from-gray-50 to-cyber-50/50 border border-gray-200">
            <p className="text-gray-600 mb-4">
              Still have questions? We're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => openExternalLink('https://docs.influencerflow.com')}
              >
                View Documentation
              </Button>
              <Button
                variant="cyber"
                onClick={() => openExternalLink('https://app.influencerflow.com')}
              >
                Start Free Trial
              </Button>
            </div>
          </CyberCard>
        </motion.div>
      </div>
    </section>

  )
}