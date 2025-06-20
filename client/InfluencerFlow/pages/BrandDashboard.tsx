import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import { contractService } from '../services/contractService';
import { ContractTemplate } from '../types/contract';
import { contractIntegrationService } from '../services/contractIntegrationService';

interface Activity {
  id: string;
  type: string;
  message: string;
  time: string;
  icon: string;
  details: string;
}

interface Campaign {
  id: number;
  created_at: string;
  brand_id: string;
  campaign_name: string;
  description: string;
  platforms: string;
  preferred_languages: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: string;
  report_id: string;
  voice_enabled: boolean;
  matched_creators: any[];
  brand_name: string;
}

interface Brand {
  id: string;
  created_at: string;
  brand_name: string;
  brand_description: string;
  location: string;
}

interface Contract {
  id: string;
  template_id: string;
  influencer_id: string;
  brand_id: string;
  status: string;
  contract_data: any;
  signed_by: string;
  signed_at: string;
  signature_url: string;
  contract_url: string;
  created_at: string;
  updated_at: string;
}

interface OutreachRecord {
  id: string;
  campaign_id: number;
  influencer_id: string;
  influencer_username: string;
  influencer_email: string;
  influencer_followers: number;
  brand_id: string;
  email_subject: string;
  email_body: string;
  status: 'sent' | 'pending' | 'replied' | 'declined' | 'completed';
  sent_at: string;
  created_at: string;
  updated_at: string;
  agreed_price?: string;
}

const BrandDashboard = () => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7 days');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLogs, setReportLogs] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportCampaign, setReportCampaign] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showAgreementsModal, setShowAgreementsModal] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [contractPreviewUrl, setContractPreviewUrl] = useState<string | null>(null);
  const [showContractPreview, setShowContractPreview] = useState(false);

  // Get current user and brand data
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchBrandData(session.user.id);
        }
      } catch (err) {
        console.error('Error getting current user:', err);
        setError('Failed to load user data');
      }
    };

    getCurrentUser();
  }, []);

  // Fetch brand data
  const fetchBrandData = async (userId: string) => {
    try {
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', userId)
        .single();

      if (brandError && brandError.code !== 'PGRST116') {
        throw brandError;
      }

      if (brandData) {
        setCurrentBrand(brandData);
        await fetchCampaigns(brandData.id);
        await fetchContracts(brandData.id);
        await fetchOutreachRecords(brandData.id);
      } else {
        await fetchCampaigns(userId);
        await fetchContracts(userId);
        await fetchOutreachRecords(userId);
      }
    } catch (err) {
      console.error('Error fetching brand data:', err);
      setError('Failed to load brand data');
    }
  };

  // Fetch campaigns
  const fetchCampaigns = async (brandId: string) => {
    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaign')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (campaignError) {
        throw campaignError;
      }

      setCampaigns(campaignData || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    }
  };

  // Fetch contracts
  const fetchContracts = async (brandId: string) => {
    try {
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (contractError) {
        throw contractError;
      }

      setContracts(contractData || []);
    } catch (err) {
      console.error('Error fetching contracts:', err);
    }
  };

  // Fetch outreach records
  const fetchOutreachRecords = async (brandId: string) => {
    try {
      const { data: outreachData, error: outreachError } = await supabase
        .from('outreach')
        .select('*')
        .eq('brand_id', brandId)
        .order('sent_at', { ascending: false });

      if (outreachError) {
        console.error('Error fetching outreach records:', outreachError);
        setOutreachRecords([]);
      } else {
        console.log('Fetched outreach records:', outreachData);
        setOutreachRecords(outreachData || []);
      }
    } catch (err) {
      console.error('Error fetching outreach records:', err);
      setOutreachRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Get outreach records for a specific campaign
  const getCampaignOutreach = (campaignId: number) => {
    return outreachRecords.filter(record => record.campaign_id === campaignId);
  };

  // Handle campaign action based on status
  const handleCampaignAction = (campaign: Campaign) => {
    switch (campaign.status.toLowerCase()) {
      case 'draft':
        navigate('/matched-influencers', {
          state: {
            campaignId: campaign.id,
            query: campaign.campaign_name + ' ' + campaign.description,
            limit: 10,
          },
        });
        break;
      case 'in_review':
        const campaignOutreach = getCampaignOutreach(campaign.id);
        const agreedOutreach = campaignOutreach.filter(o => o.status === 'replied' && o.agreed_price);
        
        if (agreedOutreach.length > 0) {
          setSelectedCampaign(campaign);
          setShowAgreementsModal(true);
        } else {
          alert(`No agreements with agreed prices found for campaign "${campaign.campaign_name}".`);
        }
        break;
      case 'active':
        navigate(`/campaign/${campaign.id}`);
        break;
      case 'completed':
        handleShowReport(campaign);
        break;
      default:
        navigate(`/campaign/${campaign.id}`);
    }
  };

  // Fetch CRM logs for a campaign
  const handleShowReport = async (campaign: Campaign, influencerId?: string) => {
    setShowReportModal(true);
    setReportCampaign(campaign);
    setReportLoading(true);
    setReportError(null);
    setReportLogs([]);

    try {
      let query = supabase
        .from('CRM_logs')
        .select('transcripts, content')
        .eq('campaign_id', campaign.id);

      if (influencerId) {
        query = query.eq('influencer_id', influencerId);
        const { data, error } = await query.single();
        if (error) {
          if (error.code === 'PGRST116') {
            setReportLogs([]);
          } else {
            throw error;
          }
        } else {
          if (data?.transcripts && Array.isArray(data.transcripts)) {
            const formattedLogs = data.transcripts.map((entry: { role: string; message: string }, index: number) => ({
              type: entry.role === 'user' ? 'user' : 'agent',
              content: entry.message,
              timestamp: null,
              id: `${campaign.id}-${influencerId}-${index}`
            }));
            setReportLogs(formattedLogs);
          } else if (data?.content && Array.isArray(data.content)) {
            setReportLogs(data.content);
          } else {
            setReportLogs([]);
          }
        }
      } else {
        const { data, error } = await query;
        if (error) {
          if (error.code === 'PGRST116') {
            setReportLogs([]);
          } else {
            throw error;
          }
        } else {
          let allLogs: any[] = [];
          if (data) {
            data.forEach((logEntry: any) => {
              if (logEntry.transcripts && Array.isArray(logEntry.transcripts)) {
                const formattedLogs = logEntry.transcripts.map((entry: { role: string; message: string }, index: number) => ({
                  type: entry.role === 'user' ? 'user' : 'agent',
                  content: entry.message,
                  timestamp: null,
                  id: `${logEntry.campaign_id}-${logEntry.influencer_id || 'general'}-${index}`
                }));
                allLogs = allLogs.concat(formattedLogs);
              } else if (logEntry.content && Array.isArray(logEntry.content)) {
                allLogs = allLogs.concat(logEntry.content);
              }
            });
          }
          allLogs.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            }
            return a.id.localeCompare(b.id);
          });
          setReportLogs(allLogs);
        }
      }
    } catch (err: any) {
      setReportError(err.message || 'Failed to fetch report logs.');
    } finally {
      setReportLoading(false);
    }
  };

  // Calculate real statistics from data
  const calculateStats = () => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalCampaigns = campaigns.length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
    
    const totalOutreach = outreachRecords.length;
    const pendingReplies = outreachRecords.filter(r => r.status === 'sent').length;
    const repliedOutreach = outreachRecords.filter(r => r.status === 'replied').length;
    
    const campaignReach = campaigns.reduce((total, campaign) => {
      if (campaign.matched_creators && Array.isArray(campaign.matched_creators)) {
        return total + campaign.matched_creators.reduce((sum, creator) => {
          return sum + (creator.followers || 0);
        }, 0);
      }
      return total;
    }, 0);

    const outreachReach = outreachRecords.reduce((total, record) => {
      return total + (record.influencer_followers || 0);
    }, 0);

    const totalReach = Math.max(campaignReach, outreachReach);
    const totalBudget = campaigns.reduce((total, campaign) => total + (campaign.budget || 0), 0);
    const responseRate = totalOutreach > 0 ? ((repliedOutreach / totalOutreach) * 100).toFixed(1) : '0.0';
    const estimatedRevenue = totalBudget * 1.5;
    const roi = totalBudget > 0 ? (((estimatedRevenue - totalBudget) / totalBudget) * 100).toFixed(0) : '0';

    return {
      activeCampaigns,
      totalCampaigns,
      completedCampaigns,
      draftCampaigns,
      totalReach: formatNumber(totalReach),
      responseRate: `${responseRate}%`,
      roi: `+${roi}%`,
      totalBudget: formatCurrency(totalBudget),
      totalOutreach,
      pendingReplies,
      repliedOutreach,
      pendingCollabs: contracts.filter(c => c.status === 'pending').length
    };
  };

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate campaign progress
  const calculateCampaignProgress = (campaign: Campaign) => {
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    const currentDate = new Date();
    
    if (currentDate < startDate) return 0;
    if (currentDate > endDate) return 100;
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();
    
    return Math.floor((elapsed / totalDuration) * 100);
  };

  // Get status color based on campaign status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'draft':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Get outreach status color
  const getOutreachStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'replied': return 'bg-green-50 text-green-700 border-green-200';
      case 'declined': return 'bg-red-50 text-red-700 border-red-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Get action button configuration based on campaign status
  const getActionButton = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          text: 'Continue Setup',
          icon: '🚀',
          color: 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg'
        };
      case 'active':
        return {
          text: 'View Details',
          icon: '📊',
          color: 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
        };
      case 'completed':
        return {
          text: 'View Report',
          icon: '📋',
          color: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
        };
      case 'in_review':
        return {
          text: 'Review Offers',
          icon: '⏳',
          color: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg'
        };
      default:
        return {
          text: 'View Details',
          icon: '👁️',
          color: 'bg-slate-600 hover:bg-slate-700 text-white shadow-lg'
        };
    }
  };

  // Get time remaining for campaign
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Completed';
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  };

  // Recent activity based on real data including outreach
  const generateRecentActivity = (): Activity[] => {
    const activities: Activity[] = [];
    
    outreachRecords.slice(0, 4).forEach(outreach => {
      activities.push({
        id: `outreach-${outreach.id}`,
        type: 'outreach_sent',
        message: `Outreach sent to ${outreach.influencer_username}`,
        time: new Date(outreach.sent_at).toLocaleDateString(),
        icon: outreach.status === 'replied' ? '💬' : outreach.status === 'declined' ? '❌' : '📧',
        details: `${formatNumber(outreach.influencer_followers)} followers • ${outreach.status}`
      });
    });
    
    campaigns.slice(0, 3).forEach(campaign => {
      activities.push({
        id: `campaign-${campaign.id}`,
        type: 'campaign_created',
        message: `Campaign "${campaign.campaign_name}" was ${campaign.status}`,
        time: new Date(campaign.created_at).toLocaleDateString(),
        icon: campaign.status === 'active' ? '🚀' : campaign.status === 'completed' ? '✅' : '📝',
        details: formatCurrency(campaign.budget)
      });
    });

    contracts.slice(0, 2).forEach(contract => {
      activities.push({
        id: `contract-${contract.id}`,
        type: 'contract_status',
        message: `Contract with influencer ${contract.influencer_id} is ${contract.status}`,
        time: new Date(contract.updated_at).toLocaleDateString(),
        icon: contract.status === 'signed' ? '✍️' : '📋',
        details: contract.status
      });
    });

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  };

  // Handler to update campaign status (accept/deny offer)
  const handleReviewAction = async (campaignId: number, action: 'accept' | 'deny', outreach?: OutreachRecord) => {
    const newStatus = action === 'accept' ? 'completed' : 'declined';
    
    if (outreach) {
      const { error: outreachUpdateError } = await supabase
        .from('outreach')
        .update({ status: newStatus })
        .eq('id', outreach.id);

      if (outreachUpdateError) {
        console.error('Error updating outreach record:', outreachUpdateError);
      } else {
        console.log(`Outreach record ${outreach.id} updated to status: ${newStatus}`);
      }

      if (action === 'accept' && outreach.agreed_price) {
        try {
          const { data: campaignDetails, error: campaignDetailsError } = await supabase
            .from('campaign')
            .select('*')
            .eq('id', campaignId)
            .single();
            
          if (campaignDetailsError) throw campaignDetailsError;

          const influencerName = outreach.influencer_username;
          
          const contractTemplateData: ContractTemplate = {
            influencer_name: influencerName,
            brand_name: currentBrand?.brand_name || campaignDetails.brand_name,
            rate: Number(outreach.agreed_price),
            timeline: `${campaignDetails.start_date} to ${campaignDetails.end_date}`,
            deliverables: campaignDetails.description || 'As per campaign requirements',
            payment_terms: 'Net 30 days after content approval',
            special_requirements: `Platform: ${campaignDetails.platforms || 'All platforms'}`
          };
          
          const contractData = {
            ...contractTemplateData,
            influencer_id: outreach.influencer_id, 
            brand_id: outreach.brand_id
          };
          
          console.log('Generating contract with data:', contractData);
          const contract = await contractService.generateContract(contractData);
          console.log('Contract generated:', contract);

          const { error: campaignUpdateError } = await supabase
            .from('campaign')
            .update({ 
              final_price: outreach.agreed_price,
              status: 'completed',
              contract_id: contract.id
            })
            .eq('id', campaignId);

          if (campaignUpdateError) {
            console.error('Error updating campaign with contract:', campaignUpdateError);
          } else {
            console.log(`Campaign ${campaignId} updated with contract ID: ${contract.id}`);
            
            const viewContract = confirm(`Contract generated successfully! Would you like to view the contract now?`);
            if (viewContract) {
              navigate(`/contracts`);
            }
            
            await fetchContracts(currentBrand?.id || '');
          }
        } catch (error: any) {
          console.error('Error generating contract:', error);
          
          const { error: campaignUpdateError } = await supabase
            .from('campaign')
            .update({ 
              final_price: outreach.agreed_price,
              status: 'completed', 
            })
            .eq('id', campaignId);
            
          if (campaignUpdateError) {
            console.error('Error updating campaign final_price or status:', campaignUpdateError);
          }
          
          const errorMsg = error.message || 'Unknown error';
          alert(`Deal accepted, but there was an error generating the contract: ${errorMsg}. You can try creating the contract manually later.`);
        }
      }
    } else {
      const { error: campaignFallbackError } = await supabase
        .from('campaign')
        .update({ status: newStatus })
        .eq('id', campaignId);
      
      if (campaignFallbackError) {
        console.error('Error updating campaign status (fallback):', campaignFallbackError);
      } else {
        console.log(`Campaign ${campaignId} status updated to: ${newStatus} (fallback)`);
      }
    }
    
    await fetchCampaigns(currentBrand?.id || '');
    await fetchOutreachRecords(currentBrand?.id || '');
  };

  // Handle contract preview
  const handleContractPreview = async (outreachId: string) => {
    try {
      setIsGeneratingContract(true);
      
      const pdfBlob = await contractIntegrationService.generateContractPreview(outreachId);
      
      const url = URL.createObjectURL(pdfBlob);
      setContractPreviewUrl(url);
      setShowContractPreview(true);
    } catch (error: any) {
      alert(`Failed to preview contract: ${error.message}`);
    } finally {
      setIsGeneratingContract(false);
    }
  };

  // Handle contract generation
  const handleGenerateContract = async (outreachId: string) => {
    try {
      setIsGeneratingContract(true);
      
      await contractIntegrationService.generateContract(outreachId);
      
      setShowAgreementsModal(false);
      
      if (currentBrand?.id) {
        await fetchCampaigns(currentBrand.id);
        await fetchContracts(currentBrand.id);
        await fetchOutreachRecords(currentBrand.id);
      }
      
      alert(`Contract successfully generated! You can view it in the Contracts section.`);
    } catch (error: any) {
      alert(`Failed to generate contract: ${error.message}`);
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const stats = calculateStats();
  const recentActivity = generateRecentActivity();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 mr-3">
              <img 
                src="https://assets.influencerflow.in/logos/png/if-bg-w.png" 
                alt="InfluencerFlow Logo" 
                className="w-full h-full object-contain animate-pulse" 
              />
            </div>
            <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
              InfluencerFlow
            </span>
          </div>
          <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md mx-auto text-center">
          <div className="text-red-600 dark:text-red-400 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 dark:text-red-200 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 mr-3">
                <img 
                  src="https://assets.influencerflow.in/logos/png/if-bg-w.png" 
                  alt="InfluencerFlow Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                InfluencerFlow.in
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {currentBrand ? `${currentBrand.brand_name} Dashboard` : 'Campaign Dashboard'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-mono text-sm">
              // {currentBrand 
                ? `Manage campaigns for ${currentBrand.brand_name}`
                : 'Manage your influencer marketing campaigns'
              }
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={() => navigate('/matched-influencers')}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg font-mono font-medium hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              find_influencers()
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/create-campaign')}
              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-lg font-mono font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              new_campaign()
            </motion.button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            { 
              title: 'Active Campaigns', 
              value: stats.activeCampaigns, 
              icon: '🚀', 
              subtitle: `${stats.totalOutreach} total outreach sent`,
              color: 'from-blue-500 to-blue-600',
              onClick: undefined
            },
            { 
              title: 'Potential Reach', 
              value: stats.totalReach, 
              icon: '👥', 
              subtitle: 'Across all campaigns',
              color: 'from-purple-500 to-purple-600',
              onClick: undefined
            },
            { 
              title: 'Response Rate', 
              value: stats.responseRate, 
              icon: '💬', 
              subtitle: `${stats.repliedOutreach} of ${stats.totalOutreach} replied`,
              color: 'from-green-500 to-green-600',
              onClick: undefined
            },
            { 
              title: 'Total Budget', 
              value: stats.totalBudget, 
              icon: '💰', 
              subtitle: 'Allocated across campaigns',
              color: 'from-orange-500 to-orange-600',
              onClick: undefined
            },
            {
              title: 'My Contracts',
              value: contracts.length,
              icon: '📄',
              subtitle: 'All your contracts',
              color: 'from-slate-500 to-slate-700',
              onClick: () => navigate('/contracts')
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 ${stat.onClick ? 'cursor-pointer' : ''}`}
              whileHover={stat.onClick ? { y: -2, scale: 1.03 } : { y: -2 }}
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">{stat.value}</span>
              </div>
              <h3 className="text-slate-700 dark:text-slate-300 font-medium mb-1">{stat.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{stat.subtitle}</p>
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
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">your_campaigns()</h2>
                <div className="flex gap-2">
                  {['7 days', '30 days', '90 days'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedTimeframe(period)}
                      className={`px-3 py-1 rounded-lg text-sm font-mono font-medium transition-colors ${
                        selectedTimeframe === period
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              {campaigns.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {campaigns.map((campaign) => {
                    const progress = calculateCampaignProgress(campaign);
                    const timeRemaining = getTimeRemaining(campaign.end_date);
                    const campaignOutreach = getCampaignOutreach(campaign.id);
                    const totalReach = campaign.matched_creators 
                      ? campaign.matched_creators.reduce((sum, creator) => sum + (creator.followers || 0), 0)
                      : campaignOutreach.reduce((sum, record) => sum + (record.influencer_followers || 0), 0);
                    const actionButton = getActionButton(campaign.status);
                    const campaignOutreachRecords = getCampaignOutreach(campaign.id);
                    const hasAnyCompletedDealForCampaign = campaignOutreachRecords.some(o => o.status === 'completed');

                    return (
                      <motion.div 
                        key={campaign.id} 
                        className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer bg-white dark:bg-slate-800" 
                        onClick={() => handleCampaignAction(campaign)}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{campaign.campaign_name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{campaign.brand_name}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-mono font-medium border ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{timeRemaining}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">outreach</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{campaignOutreach.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">reach</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{formatNumber(totalReach)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">platforms</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{campaign.platforms || 'All'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">budget</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(campaign.budget)}</p>
                          </div>
                        </div>

                        {/* Outreach Status Summary */}
                        {campaignOutreach.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2">// outreach_status:</p>
                            <div className="flex flex-wrap gap-2">
                              {campaignOutreach.slice(0, 3).map((outreach) => (
                                <span
                                  key={outreach.id}
                                  className={`px-2 py-1 rounded-lg text-xs font-mono font-medium border ${getOutreachStatusColor(outreach.status)}`}
                                >
                                  {outreach.influencer_username} • {outreach.status}
                                </span>
                              ))}
                              {campaignOutreach.length > 3 && (
                                <span className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                  +{campaignOutreach.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {campaign.status !== 'draft' && (
                          <>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
                              <div 
                                className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-4">{progress}% complete</p>
                          </>
                        )}

                        <div className="flex justify-between items-center">
                          {campaign.status === 'completed' ? (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowReport(campaign);
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-200 flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:shadow-lg"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span>📋</span>
                              view_report()
                            </motion.button>
                          ) : campaign.status === 'draft' ? (
                            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-lg text-xs font-mono font-medium border border-amber-200 dark:border-amber-800">
                              setup_required()
                            </div>
                          ) : campaign.status === 'in_review' ? (
                            hasAnyCompletedDealForCampaign ? (
                              <div className="flex items-center justify-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm font-mono font-semibold text-green-800 dark:text-green-200">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                deal_accepted()
                              </div>
                            ) : (
                              <div className="w-full">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2">// agreements_to_review:</p>
                                {campaignOutreachRecords.filter((o: OutreachRecord) => o.status === 'replied' && o.agreed_price != null).length === 0 ? (
                                  <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">no_agreements_yet()</div>
                                ) : (
                                  campaignOutreachRecords.filter((o: OutreachRecord) => o.status === 'replied' && o.agreed_price != null).map((outreach: OutreachRecord) => (
                                    <div key={outreach.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 mb-2">
                                      <div>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{outreach.influencer_username}</span>
                                        <span className="ml-2 text-green-700 dark:text-green-300 font-mono font-medium">
                                          agreed: {formatCurrency(Number(outreach.agreed_price))}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReviewAction(campaign.id, 'accept', outreach);
                                          }}
                                          className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-mono font-medium transition-colors"
                                        >
                                          accept()
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReviewAction(campaign.id, 'deny', outreach);
                                          }}
                                          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-medium transition-colors"
                                        >
                                          deny()
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleShowReport(campaign, outreach.influencer_id);
                                          }}
                                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-medium transition-colors"
                                        >
                                          view_chat()
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )
                          ) : (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCampaignAction(campaign);
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-200 flex items-center gap-2 ${actionButton.color}`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span>{actionButton.icon}</span>
                              {actionButton.text.toLowerCase().replace(/ /g, '_')}()
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 font-mono">no_campaigns_yet()</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 font-mono text-sm">// Create your first campaign to get started</p>
                  <button
                    onClick={() => navigate('/create-campaign')}
                    className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-lg font-mono font-medium hover:shadow-lg transition-all duration-200"
                  >
                    create_campaign()
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-mono">recent_activity()</h2>
                
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">{activity.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900 dark:text-slate-100 mb-1 font-medium">{activity.message}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{activity.time}</p>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-medium">{activity.details}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400 font-mono">no_recent_activity()</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-mono">campaign_summary()</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">total_campaigns</span>
                    <span className="font-bold text-lg text-slate-900 dark:text-slate-100 font-mono">{stats.totalCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">active</span>
                    <span className="font-bold text-lg text-green-600 dark:text-green-400 font-mono">{stats.activeCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">total_outreach</span>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400 font-mono">{stats.totalOutreach}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">pending_replies</span>
                    <span className="font-bold text-lg text-amber-600 dark:text-amber-400 font-mono">{stats.pendingReplies}</span>
                  </div>
                </div>

                {stats.pendingReplies > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600 dark:text-blue-400">📧</span>
                      <span className="text-sm font-mono font-semibold text-blue-800 dark:text-blue-200">outreach_update()</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-mono">
                      // You have {stats.pendingReplies} outreach emails awaiting responses
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => navigate('/matched-influencers')}
                  className="w-full mt-6 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-3 rounded-lg font-mono font-medium transition-colors border border-slate-200 dark:border-slate-600"
                >
                  discover_more_influencers()
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-8 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-slate-900 dark:text-slate-100 font-mono">campaign_report()</h2>
            <div className="mb-2 text-center text-slate-600 dark:text-slate-400 font-mono font-medium">
              {reportCampaign?.campaign_name}
            </div>
            {reportLoading ? (
              <div className="text-center py-8 text-lg text-slate-500 dark:text-slate-400 font-mono">loading_report()...</div>
            ) : reportError ? (
              <div className="text-center py-8 text-red-600 dark:text-red-400 font-mono">{reportError}</div>
            ) : reportLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 font-mono">no_chat_history_found()</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto px-2">
                {reportLogs.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md px-5 py-3 rounded-xl shadow-lg border ${msg.type === 'user' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600'}`}>
                      <div className="font-mono font-semibold mb-1">{msg.type === 'user' ? 'user()' : 'ai_agent()'}</div>
                      <div className="whitespace-pre-wrap text-base">{msg.content}</div>
                      <div className="text-xs mt-2 opacity-70 text-right font-mono">{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Agreements Modal */}
      {showAgreementsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">review_agreements()</h2>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAgreementsModal(false);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="mb-4 text-slate-600 dark:text-slate-400 font-mono text-sm">
              // The following influencers have agreed to work on your campaign
            </p>

            <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-200 dark:divide-slate-700">
              {getCampaignOutreach(selectedCampaign.id)
                .filter(o => o.status === 'replied' && o.agreed_price)
                .map(outreach => (
                  <div key={outreach.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{outreach.influencer_username}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">{outreach.influencer_email}</div>
                      <div className="mt-1 font-bold text-green-700 dark:text-green-300 font-mono">
                        agreed_price: {formatCurrency(Number(outreach.agreed_price))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContractPreview(outreach.id);
                        }}
                        disabled={isGeneratingContract}
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-mono hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                      >
                        preview_contract()
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateContract(outreach.id);
                        }}
                        disabled={isGeneratingContract}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-mono transition-colors disabled:opacity-50"
                      >
                        generate_contract()
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAgreementsModal(false);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-mono"
              >
                close()
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Contract Preview Modal */}
      {showContractPreview && contractPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">contract_preview()</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContractPreview(false);
                  URL.revokeObjectURL(contractPreviewUrl);
                  setContractPreviewUrl(null);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 p-4">
              <iframe
                src={contractPreviewUrl}
                className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-700"
                title="Contract Preview"
              />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContractPreview(false);
                  URL.revokeObjectURL(contractPreviewUrl);
                  setContractPreviewUrl(null);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-mono"
              >
                close()
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BrandDashboard;