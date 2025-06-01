import React, { useState, useEffect } from 'react';

function LandingPage() {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [currentAIMessage, setCurrentAIMessage] = useState(0);

  const phrases = [
    "Influencer Marketing",
    "Creator Partnerships", 
    "Campaign Management",
    "Brand Collaborations"
  ];

  const aiMessages = [
    "🤖 Analyzing 50,000+ creators for fitness campaign...",
    "📊 Found 247 matching profiles with 95% audience match",
    "📧 Sending personalized outreach in 12 languages...", 
    "💬 Negotiating rates with top performers...",
    "📄 Generating contracts for confirmed deals...",
    "✅ 89% response rate achieved • $2.3M campaign launched"
  ];

  // Typing animation effect
  useEffect(() => {
    const typeText = () => {
      const phrase = phrases[phraseIndex];
      
      if (isDeleting) {
        setCurrentPhrase(phrase.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      } else {
        setCurrentPhrase(phrase.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      }
    };

    let timeout: ReturnType<typeof setTimeout>;
    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === phrases[phraseIndex].length) {
      typeSpeed = 2000;
      setTimeout(() => setIsDeleting(true), typeSpeed);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      typeSpeed = 500;
    } else {
      timeout = setTimeout(typeText, typeSpeed);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, phrases]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // AI message cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAIMessage(prev => (prev + 1) % aiMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [aiMessages.length]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute -z-10 top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -z-10 top-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="animate-fade-in">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Revolutionize
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
                  {currentPhrase}
                  <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} text-purple-600`}>|</span>
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your influencer campaigns with AI-powered automation. From creator discovery to payments, 
                streamline your entire workflow with intelligent agents that scale personalized interactions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-xl text-lg">
                  Start Free Trial
                </button>
                <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-2xl font-semibold hover:bg-purple-50 transition-all duration-200 text-lg">
                  Watch Demo
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">10M+</div>
                  <div className="text-gray-600">Creators</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">50K+</div>
                  <div className="text-gray-600">Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">98%</div>
                  <div className="text-gray-600">Satisfaction</div>
                </div>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* AI Agent Simulation */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-800">AI Agent Active</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="text-green-600 font-medium transition-all duration-500">
                        {aiMessages[currentAIMessage]}
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature Preview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-xl p-4 border border-white/20 hover:bg-white/80 transition-all duration-200">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="font-semibold text-gray-800">Smart Discovery</div>
                      <div className="text-sm text-gray-600">AI-powered creator matching</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 border border-white/20 hover:bg-white/80 transition-all duration-200">
                      <div className="text-2xl mb-2">💬</div>
                      <div className="font-semibold text-gray-800">Auto Outreach</div>
                      <div className="text-sm text-gray-600">Multilingual communication</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 border border-white/20 hover:bg-white/80 transition-all duration-200">
                      <div className="text-2xl mb-2">📄</div>
                      <div className="font-semibold text-gray-800">Smart Contracts</div>
                      <div className="text-sm text-gray-600">Automated agreements</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4 border border-white/20 hover:bg-white/80 transition-all duration-200">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-semibold text-gray-800">Auto Payments</div>
                      <div className="text-sm text-gray-600">Milestone-based payouts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Complete <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">AI-Powered</span> Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              End the chaos of manual influencer marketing with intelligent automation that scales your campaigns 
              while maintaining personal touch.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Cards */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Creator Discovery Engine</h3>
              <p className="text-gray-600">AI-powered search across millions of creators with audience insights and engagement metrics.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h4l3 8 4-16-16 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Outreach & Negotiation</h3>
              <p className="text-gray-600">Automated multilingual outreach with intelligent negotiation capabilities at scale.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Contract Automation</h3>
              <p className="text-gray-600">Auto-generated contracts with e-signature integration and real-time status tracking.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Payments</h3>
              <p className="text-gray-600">Milestone-based payouts with automated invoicing and global payment processing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Influencer Marketing?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of brands using AI to automate their influencer campaigns and achieve 10x better results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-xl text-lg">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all duration-200 text-lg">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;