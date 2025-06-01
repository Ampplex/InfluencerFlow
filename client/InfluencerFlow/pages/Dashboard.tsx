import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7 days');

  // Influencer Marketing specific data
  const stats = {
    activeCampaigns: 12,
    totalReach: '2.4M',
    engagementRate: '8.2%',
    roi: '+156%',
    pendingCollabs: 8,
    completedCampaigns: 24
  };

  const campaignOverview = {
    totalSpent: '$45,230',
    avgCampaignCost: '$3,769',
    topPerformingNiche: 'Beauty & Lifestyle',
    monthlyGrowth: '+23.5%'
  };

  const activeCampaigns = [
    {
      id: 1,
      name: 'Summer Beauty Collection',
      brand: 'GlowUp Cosmetics',
      status: 'active' as CampaignStatus,
      influencers: 8,
      reach: '485K',
      engagement: '9.2%',
      budget: '$8,500',
      spent: '$6,200',
      progress: 73,
      deadline: '12 days left'
    },
    {
      id: 2,
      name: 'Fitness App Launch',
      brand: 'FitTracker Pro',
      status: 'review' as CampaignStatus,
      influencers: 5,
      reach: '320K',
      engagement: '7.8%',
      budget: '$5,200',
      spent: '$4,800',
      progress: 92,
      deadline: '3 days left'
    },
    {
      id: 3,
      name: 'Tech Product Review',
      brand: 'GadgetHub',
      status: 'planning' as CampaignStatus,
      influencers: 0,
      reach: '0',
      engagement: '0%',
      budget: '$12,000',
      spent: '$0',
      progress: 15,
      deadline: '30 days left'
    }
  ];

  const topInfluencers = [
    {
      id: 1,
      name: 'Sarah Beauty',
      handle: '@sarah_beauty',
      avatar: '👩‍🦰',
      followers: '485K',
      engagement: '9.2%',
      niche: 'Beauty',
      campaigns: 3,
      totalReach: '1.2M',
      performance: 'excellent'
    },
    {
      id: 2,
      name: 'Mike Fitness',
      handle: '@mike_fitness',
      avatar: '👨‍💪',
      followers: '320K',
      engagement: '7.8%',
      niche: 'Fitness',
      campaigns: 2,
      totalReach: '890K',
      performance: 'good'
    },
    {
      id: 3,
      name: 'Emma Lifestyle',
      handle: '@emma_lifestyle',
      avatar: '👱‍♀️',
      followers: '280K',
      engagement: '8.5%',
      niche: 'Lifestyle',
      campaigns: 4,
      totalReach: '1.5M',
      performance: 'excellent'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'campaign_completed',
      message: 'Summer Beauty Collection campaign completed successfully',
      time: '2 hours ago',
      icon: '✅',
      details: '+485K reach'
    },
    {
      id: 2,
      type: 'influencer_applied',
      message: '@tech_reviewer applied to Tech Product Review campaign',
      time: '4 hours ago',
      icon: '📝',
      details: '125K followers'
    },
    {
      id: 3,
      type: 'content_posted',
      message: '@sarah_beauty posted sponsored content',
      time: '6 hours ago',
      icon: '📸',
      details: '12.3K likes'
    },
    {
      id: 4,
      type: 'payment_processed',
      message: 'Payment of $2,500 sent to @mike_fitness',
      time: '1 day ago',
      icon: '💰',
      details: 'Campaign completed'
    }
  ];

  type CampaignStatus = 'active' | 'review' | 'planning' | 'completed';

  const getStatusColor = (status: CampaignStatus): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  type Performance = 'excellent' | 'good' | 'average' | string;

  const getPerformanceColor = (performance: Performance) => {
    switch (performance) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Dashboard</h1>
            <p className="text-gray-600">Manage your influencer marketing campaigns and track performance</p>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={() => navigate('/match_influencers')}
              className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:shadow-md transition-all duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Influencers
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/create-campaign')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Campaign
            </motion.button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            { 
              title: 'Active Campaigns', 
              value: stats.activeCampaigns, 
              icon: '🚀', 
              color: 'from-blue-500 to-blue-600',
              subtitle: `${stats.pendingCollabs} pending collaborations`
            },
            { 
              title: 'Total Reach', 
              value: stats.totalReach, 
              icon: '👥', 
              color: 'from-purple-500 to-purple-600',
              subtitle: 'Across all campaigns'
            },
            { 
              title: 'Avg. Engagement', 
              value: stats.engagementRate, 
              icon: '📊', 
              color: 'from-green-500 to-green-600',
              subtitle: 'Above industry avg (6.2%)'
            },
            { 
              title: 'Campaign ROI', 
              value: stats.roi, 
              icon: '💰', 
              color: 'from-orange-500 to-orange-600',
              subtitle: 'This quarter'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <h3 className="text-gray-600 font-medium mb-1">{stat.title}</h3>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Campaigns */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Active Campaigns</h2>
                <div className="flex gap-2">
                  {['7 days', '30 days', '90 days'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedTimeframe(period)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedTimeframe === period
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                {activeCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.brand}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <span className="text-xs text-gray-500">{campaign.deadline}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Influencers</p>
                        <p className="font-semibold">{campaign.influencers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reach</p>
                        <p className="font-semibold">{campaign.reach}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Engagement</p>
                        <p className="font-semibold">{campaign.engagement}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Spent / Budget</p>
                        <p className="font-semibold">{campaign.spent} / {campaign.budget}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${campaign.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">{campaign.progress}% complete</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Top Performing Influencers */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performers</h2>
                
                <div className="space-y-4">
                  {topInfluencers.map((influencer) => (
                    <div key={influencer.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
                        {influencer.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">{influencer.name}</h3>
                        <p className="text-xs text-gray-600">{influencer.handle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{influencer.followers}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{influencer.engagement}</span>
                          <span className={`text-xs font-medium ${getPerformanceColor(influencer.performance)}`}>
                            {influencer.performance}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => navigate('/match_influencers')}
                  className="w-full mt-4 bg-blue-50 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                >
                  Discover More Influencers
                </button>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{activity.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 mb-1">{activity.message}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{activity.time}</p>
                          <span className="text-xs text-blue-600 font-medium">{activity.details}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 text-gray-600 text-sm hover:text-gray-800 transition-colors">
                  View All Activity
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Campaign Performance Overview */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Campaign Performance Overview</h2>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Campaign Spend</p>
                  <p className="text-2xl font-bold text-gray-900">{campaignOverview.totalSpent}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Avg. Cost per Campaign</p>
                  <p className="text-2xl font-bold text-gray-900">{campaignOverview.avgCampaignCost}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Monthly Growth</p>
                  <p className="text-2xl font-bold text-green-600">{campaignOverview.monthlyGrowth}</p>
                </div>
              </div>
            </div>
            
            {/* Performance Chart Placeholder */}
            <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 font-medium">Campaign performance analytics</p>
                <p className="text-sm text-gray-400 mt-1">ROI, reach, and engagement trends over time</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;