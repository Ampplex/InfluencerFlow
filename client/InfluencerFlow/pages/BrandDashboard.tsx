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

      if (brandError && brandError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw brandError;
      }

      if (brandData) {
        setCurrentBrand(brandData);
        await fetchCampaigns(brandData.id);
        await fetchContracts(brandData.id);
        await fetchOutreachRecords(brandData.id);
      } else {
        // No brand found, might be a new user
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
      // Don't set error here as contracts might not exist yet
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
        // Don't throw error as outreach table might not exist yet
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

  const handleCampaignAction = (campaign: Campaign) => {
    switch (campaign.status.toLowerCase()) {
      case 'draft':
        // Continue campaign setup by finding influencers
        navigate('/matched-influencers', {
          state: {
            campaignId: campaign.id,
            query: campaign.campaign_name + ' ' + campaign.description,
            limit: 10,
          },
        });
        break;
      case 'in_review':
        // Show outreach with agreed price that can be converted to contracts
        const campaignOutreach = getCampaignOutreach(campaign.id);
        const agreedOutreach = campaignOutreach.filter(o => o.status === 'replied' && o.agreed_price);
        
        if (agreedOutreach.length > 0) {
          // We have agreed prices, allow contract generation
          setSelectedCampaign(campaign);
          setShowAgreementsModal(true);
        } else {
          alert(`No agreements with agreed prices found for campaign "${campaign.campaign_name}".`);
        }
        break;
      case 'active':
        // View campaign details/analytics
        navigate(`/campaign/${campaign.id}`);
        break;
      case 'completed':
        // View campaign report
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
      .select('transcripts, content') // Select both columns
      .eq('campaign_id', campaign.id);

    if (influencerId) {
      query = query.eq('influencer_id', influencerId);
      const { data, error } = await query.single();
      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          setReportLogs([]);
        } else {
          throw error;
        }
      } else {
        // Check if transcripts column exists and is not null
        if (data?.transcripts && Array.isArray(data.transcripts)) {
          // New format: map transcripts to match the expected reportLogs structure
          const formattedLogs = data.transcripts.map((entry: { role: string; message: string }, index: number) => ({
            type: entry.role === 'user' ? 'user' : 'agent',
            content: entry.message,
            timestamp: null, // Timestamps not provided in new format; use null or generate if needed
            id: `${campaign.id}-${influencerId}-${index}` // Generate a unique ID for rendering
          }));
          setReportLogs(formattedLogs);
        } else if (data?.content && Array.isArray(data.content)) {
          // Old format: use content directly
          setReportLogs(data.content);
        } else {
          setReportLogs([]);
        }
      }
    } else {
      // General campaign report: fetch all CRM logs for the campaign
      const { data, error } = await query;
      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          setReportLogs([]);
        } else {
          throw error;
        }
      } else {
        let allLogs: any[] = [];
        if (data) {
          data.forEach((logEntry: any) => {
            if (logEntry.transcripts && Array.isArray(logEntry.transcripts)) {
              // New format: map transcripts
              const formattedLogs = logEntry.transcripts.map((entry: { role: string; message: string }, index: number) => ({
                type: entry.role === 'user' ? 'user' : 'agent',
                content: entry.message,
                timestamp: null, // Timestamps not provided in new format
                id: `${logEntry.campaign_id}-${logEntry.influencer_id || 'general'}-${index}`
              }));
              allLogs = allLogs.concat(formattedLogs);
            } else if (logEntry.content && Array.isArray(logEntry.content)) {
              // Old format: use content directly
              allLogs = allLogs.concat(logEntry.content);
            }
          });
        }
        // Sort logs by timestamp if available, or by index for new format
        allLogs.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          }
          return a.id.localeCompare(b.id); // Fallback to ID sorting for new format
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
    
    // Calculate total outreach
    const totalOutreach = outreachRecords.length;
    const pendingReplies = outreachRecords.filter(r => r.status === 'sent').length;
    const repliedOutreach = outreachRecords.filter(r => r.status === 'replied').length;
    
    // Calculate total reach from matched_creators and outreach
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

    // Calculate total budget
    const totalBudget = campaigns.reduce((total, campaign) => total + (campaign.budget || 0), 0);
    
    // Calculate response rate
    const responseRate = totalOutreach > 0 ? ((repliedOutreach / totalOutreach) * 100).toFixed(1) : '0.0';

    // Calculate ROI (simplified calculation)
    const estimatedRevenue = totalBudget * 1.5; // Assuming 50% ROI
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
        return 'border-green-200 bg-green-50 text-green-800';
      case 'draft':
        return 'border-gray-200 bg-gray-50 text-gray-800';
      case 'completed':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'in_review':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  // Get outreach status color
  const getOutreachStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get action button configuration based on campaign status
  const getActionButton = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          text: 'Continue Setup',
          icon: '🔍',
          color: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'active':
        return {
          text: 'View Details',
          icon: '📊',
          color: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'completed':
        return {
          text: 'View Report',
          icon: '📋',
          color: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
      case 'in_review':
        return {
          text: 'Review Offer',
          icon: '📝',
          color: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      default:
        return {
          text: 'View Details',
          icon: '👁️',
          color: 'bg-gray-600 hover:bg-gray-700 text-white'
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
    
    // Add outreach activities (most recent first)
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
    
    // Add campaign activities
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

    // Add contract activities
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

    // Sort by date and return top 6
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  };

  // Handler to update campaign status (accept/deny offer)
  const handleReviewAction = async (campaignId: number, action: 'accept' | 'deny', outreach?: OutreachRecord) => {
    const newStatus = action === 'accept' ? 'completed' : 'declined';
    
    if (outreach) {
      // Update the outreach record
      const { error: outreachUpdateError } = await supabase
        .from('outreach')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', outreach.id);

      if (outreachUpdateError) {
        console.error('Error updating outreach record:', outreachUpdateError);
      } else {
        console.log(`Outreach record ${outreach.id} updated to status: ${newStatus}`);
      }

      // If accepting the offer, update the campaign's final_price and status
      // AND generate a contract
      if (action === 'accept' && outreach.agreed_price) {
        try {
          // 1. Fetch the campaign details to get necessary contract data
          const { data: campaignDetails, error: campaignDetailsError } = await supabase
            .from('campaign')
            .select('*')
            .eq('id', campaignId)
            .single();
            
          if (campaignDetailsError) throw campaignDetailsError;

          // 2. Get influencer name from outreach record
          const influencerName = outreach.influencer_username;
          
          // 3. Prepare contract template data
          const contractTemplateData: ContractTemplate = {
            influencer_name: influencerName,
            brand_name: currentBrand?.brand_name || campaignDetails.brand_name,
            rate: Number(outreach.agreed_price),
            timeline: `${campaignDetails.start_date} to ${campaignDetails.end_date}`,
            deliverables: campaignDetails.description || 'As per campaign requirements',
            payment_terms: 'Net 30 days after content approval',
            special_requirements: `Platform: ${campaignDetails.platforms || 'All platforms'}`
          };
          
          // 4. Generate the contract
          const contractData = {
            ...contractTemplateData,
            influencer_id: outreach.influencer_id, 
            brand_id: outreach.brand_id
          };
          
          console.log('Generating contract with data:', contractData);
          const contract = await contractService.generateContract(contractData);
          console.log('Contract generated:', contract);

          // 5. Update the campaign with the contract ID
          const { error: campaignUpdateError } = await supabase
            .from('campaign')
            .update({ 
              final_price: outreach.agreed_price,
              status: 'completed', // Explicitly set campaign status to completed
              updated_at: new Date().toISOString(),
              contract_id: contract.id // Link the contract to the campaign
            })
            .eq('id', campaignId);

          if (campaignUpdateError) {
            console.error('Error updating campaign with contract:', campaignUpdateError);
          } else {
            console.log(`Campaign ${campaignId} updated with contract ID: ${contract.id}`);
            
            // 6. Show success message with option to view contract
            const viewContract = confirm(`Contract generated successfully! Would you like to view the contract now?`);
            if (viewContract) {
              navigate(`/contracts`);
            }
            
            // 7. Refresh contracts list
            await fetchContracts(currentBrand?.id || '');
          }
        } catch (error: any) {
          console.error('Error generating contract:', error);
          
          // Still update the campaign status even if contract generation fails
          const { error: campaignUpdateError } = await supabase
            .from('campaign')
            .update({ 
              final_price: outreach.agreed_price,
              status: 'completed', 
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId);
            
          if (campaignUpdateError) {
            console.error('Error updating campaign final_price or status:', campaignUpdateError);
          }
          
          // Show detailed error message
          const errorMsg = error.message || 'Unknown error';
          alert(`Deal accepted, but there was an error generating the contract: ${errorMsg}. You can try creating the contract manually later.`);
        }
      }
    } else {
      // Fallback: update campaign status (this path is for general campaign status updates, not individual outreach acceptance)
      const { error: campaignFallbackError } = await supabase
        .from('campaign')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
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
      
      // Close the modal and refresh data
      setShowAgreementsModal(false);
      
      // Refresh data by calling the individual fetch methods
      if (currentBrand?.id) {
        await fetchCampaigns(currentBrand.id);
        await fetchContracts(currentBrand.id);
        await fetchOutreachRecords(currentBrand.id);
      }
      
      // Show success message
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Fetching your campaign data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentBrand ? `${currentBrand.brand_name} Dashboard` : 'Campaign Dashboard'}
            </h1>
            <p className="text-gray-600">
              {currentBrand 
                ? `Manage your influencer marketing campaigns for ${currentBrand.brand_name}`
                : 'Manage your influencer marketing campaigns and track performance'
              }
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={() => navigate('/matched-influencers')}
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
              title: 'Total Active Campaigns', 
              value: stats.activeCampaigns, 
              icon: '🚀', 
              color: 'from-blue-500 to-blue-600',
              subtitle: `${stats.totalOutreach} total outreach sent`
            },
            { 
              title: 'Total Potential Reach', 
              value: stats.totalReach, 
              icon: '👥', 
              color: 'from-purple-500 to-purple-600',
              subtitle: 'Across all campaigns'
            },
            { 
              title: 'Response Rate', 
              value: stats.responseRate, 
              icon: '💬', 
              color: 'from-green-500 to-green-600',
              subtitle: `${stats.repliedOutreach} of ${stats.totalOutreach} replied`
            },
            { 
              title: 'Campaign Budget', 
              value: stats.totalBudget, 
              icon: '💰', 
              color: 'from-orange-500 to-orange-600',
              subtitle: 'Total allocated budget'
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
                <h2 className="text-xl font-bold text-gray-900">Your Campaigns</h2>
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
              
              {campaigns.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
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
                    <div key={campaign.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer" onClick={() => handleCampaignAction(campaign)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                            <p className="text-sm text-gray-600">{campaign.brand_name}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                            <span className="text-xs text-gray-500">{timeRemaining}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Outreach</p>
                            <p className="font-semibold">{campaignOutreach.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Reach</p>
                            <p className="font-semibold">{formatNumber(totalReach)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Platforms</p>
                            <p className="font-semibold">{campaign.platforms || 'All'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="font-semibold">{formatCurrency(campaign.budget)}</p>
                          </div>
                        </div>

                        {/* Outreach Status Summary */}
                        {campaignOutreach.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Outreach Status:</p>
                            <div className="flex flex-wrap gap-1">
                              {campaignOutreach.slice(0, 3).map((outreach) => (
                                <span
                                  key={outreach.id}
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getOutreachStatusColor(outreach.status)}`}
                                >
                                  {outreach.influencer_username} • {outreach.status}
                                </span>
                              ))}
                              {campaignOutreach.length > 3 && (
                                <span className="px-2 py-1 text-xs text-gray-500">
                                  +{campaignOutreach.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {campaign.status !== 'draft' && (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{progress}% complete</p>
                          </>
                        )}

                        <div className="flex justify-between items-center">
                          {campaign.status === 'completed' ? (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowReport(campaign);
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span>📋</span>
                              View Report
                            </motion.button>
                          ) : campaign.status === 'draft' ? (
                            <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                              Setup Required
                            </div>
                          ) : campaign.status === 'in_review' ? (
                            hasAnyCompletedDealForCampaign ? (
                              <div className="flex items-center justify-center bg-green-50 rounded-lg p-3 text-sm font-semibold text-green-800">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Deal Accepted for Campaign!
                              </div>
                            ) : (
                              <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Agreements to Review:</p>
                                {campaignOutreachRecords.filter((o: OutreachRecord) => o.status === 'replied' && o.agreed_price != null).length === 0 ? (
                                  <div className="text-sm text-gray-500">No agreements to review yet.</div>
                                ) : (
                                  campaignOutreachRecords.filter((o: OutreachRecord) => o.status === 'replied' && o.agreed_price != null).map((outreach: OutreachRecord) => (
                                    <div key={outreach.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-2">
                                      <div>
                                        <span className="font-semibold">{outreach.influencer_username}</span>
                                        <span className="ml-2 text-blue-700 font-medium">Agreed Price: {formatCurrency(Number(outreach.agreed_price))}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReviewAction(campaign.id, 'accept', outreach);
                                          }}
                                          className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReviewAction(campaign.id, 'deny', outreach);
                                          }}
                                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                                        >
                                          Deny
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleShowReport(campaign, outreach.influencer_id);
                                          }}
                                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                                        >
                                          View Chat
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
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${actionButton.color}`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span>{actionButton.icon}</span>
                              {actionButton.text}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                  <p className="text-gray-600 mb-4">Create your first campaign to get started</p>
                  <button
                    onClick={() => navigate('/create-campaign')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Create Campaign
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                
                {recentActivity.length > 0 ? (
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
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No recent activity</p>
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Campaign Summary</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Campaigns</span>
                    <span className="font-bold text-lg">{stats.totalCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active</span>
                    <span className="font-bold text-lg text-green-600">{stats.activeCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Outreach</span>
                    <span className="font-bold text-lg text-blue-600">{stats.totalOutreach}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Replies</span>
                    <span className="font-bold text-lg text-orange-600">{stats.pendingReplies}</span>
                  </div>
                </div>

                {stats.pendingReplies > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600">📧</span>
                      <span className="text-sm font-semibold text-blue-800">Outreach Update</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      You have {stats.pendingReplies} outreach emails awaiting responses.
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => navigate('/matched-influencers')}
                  className="w-full mt-6 bg-blue-50 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                >
                  Discover More Influencers
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-fadeIn">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">Campaign Report</h2>
            <div className="mb-2 text-center text-gray-600 font-medium">
              {reportCampaign?.campaign_name}
            </div>
            {reportLoading ? (
              <div className="text-center py-8 text-lg text-gray-500">Loading report...</div>
            ) : reportError ? (
              <div className="text-center py-8 text-red-600">{reportError}</div>
            ) : reportLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No chat history found for this campaign.</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto px-2">
                {reportLogs.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md px-5 py-3 rounded-2xl shadow ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      <div className="font-semibold mb-1">{msg.type === 'user' ? 'You' : 'AI Agent'}</div>
                      <div className="whitespace-pre-wrap text-base">{msg.content}</div>
                      <div className="text-xs mt-2 opacity-70 text-right">{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Agreements Modal */}
      {showAgreementsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Review Agreements</h2>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAgreementsModal(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="mb-4 text-gray-600">
              The following influencers have agreed to work on your campaign. Review the agreed prices and generate contracts.
            </p>

            <div className="mb-6 border rounded-lg divide-y">
              {getCampaignOutreach(selectedCampaign.id)
                .filter(o => o.status === 'replied' && o.agreed_price)
                .map(outreach => (
                  <div key={outreach.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{outreach.influencer_username}</div>
                      <div className="text-sm text-gray-600">{outreach.influencer_email}</div>
                      <div className="mt-1 font-bold text-green-700">
                        Agreed Price: {formatCurrency(Number(outreach.agreed_price))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContractPreview(outreach.id);
                        }}
                        disabled={isGeneratingContract}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Preview Contract
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateContract(outreach.id);
                        }}
                        disabled={isGeneratingContract}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Generate Contract
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
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contract Preview Modal */}
      {showContractPreview && contractPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Contract Preview</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContractPreview(false);
                  URL.revokeObjectURL(contractPreviewUrl);
                  setContractPreviewUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 p-4">
              <iframe
                src={contractPreviewUrl}
                className="w-full h-full rounded border border-gray-200"
                title="Contract Preview"
              />
            </div>

            <div className="p-4 border-t flex justify-end gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContractPreview(false);
                  URL.revokeObjectURL(contractPreviewUrl);
                  setContractPreviewUrl(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandDashboard;