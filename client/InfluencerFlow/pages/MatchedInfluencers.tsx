import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from '../utils/supabase';
import { motion } from 'framer-motion';
import { 
  Users, 
  Mail, 
  ExternalLink, 
  Check, 
  Target, 
  ArrowLeft, 
  Search, 
  Zap,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define the structure of an influencer object
interface Influencer {
  id: string;
  username: string;
  email: string;
  bio: string;
  followers: number;
  link: string;
}

// Define the API response structure
interface ApiResponse {
  influencers: Influencer[];
  count: number;
}

// Outreach record structure
interface OutreachRecord {
  id?: string;
  campaign_id: number;
  influencer_id: string;
  influencer_username: string;
  influencer_email: string;
  influencer_followers: number;
  brand_id: string;
  email_subject: string;
  email_body: string;
  status: 'sent' | 'pending' | 'replied' | 'declined';
  sent_at: string;
  created_at?: string;
  updated_at?: string;
}

function MatchedInfluencers() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get campaign data from navigation state
  const campaignId = location.state?.campaignId;
  const query = location.state?.query;
  const limit = location.state?.limit || 10;
  const campaign_description = location.state.campaign_description;
  
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
  const [isOutreaching, setIsOutreaching] = useState(false);
  const [campaignInfo, setCampaignInfo] = useState<string>('');

  // Generate profile photo URL for influencer
  const getProfilePhoto = (influencer: Influencer) => {
    // Use a combination of username and ID to get consistent photos for same influencer
    const seed = influencer.username + influencer.id;
    return `https://i.pravatar.cc/150?img=${Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 70}`;
  };

  // Real API call to fetch matched influencers
  const getMatchedInfluencers = async () => {
    const url = `https://influencerflow-ai-services-964513157102.asia-south1.run.app/influencers/query`;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          k: limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log("Matched Influencers Data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching matched influencers:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching influencers"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleInfluencerSelection = (influencerId: string) => {
    setSelectedInfluencers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(influencerId)) {
        newSet.delete(influencerId);
      } else {
        newSet.add(influencerId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedInfluencers.size === influencers.length) {
      setSelectedInfluencers(new Set());
    } else {
      setSelectedInfluencers(new Set(influencers.map(inf => inf.id)));
    }
  };

  const handleOutreach = async () => {
    if (selectedInfluencers.size === 0) {
      alert("Please select at least one influencer for outreach.");
      return;
    }

    setIsOutreaching(true);
    
    try {
      // Get current user for brand_id
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated user found');
      }
      
      // Get selected influencer data
      const selectedData = influencers.filter(inf => selectedInfluencers.has(inf.id));
      console.log("Selected Influencers for Outreach:", selectedData);
      
      if (selectedData.length === 0) {
        alert("No influencers selected for outreach.");
        return;
      }
      
      const brand_name = localStorage.getItem('brand_name') || "Your Brand Name";
      const brand_description = localStorage.getItem('brand_description') || "Your Brand Description";
      console.log(`Brand Name: ${brand_name} and Brand Description: ${brand_description}`);
      
      // Make actual API call to your outreach endpoint
      const response = await fetch('https://influencerflow-ai-services-964513157102.asia-south1.run.app/influencers/outreachEmailGenerator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencers_data: selectedData,
          brand_name: brand_name,
          brand_description: brand_description,
          campaign_id: campaignId.toString(),
          campaign_description: campaign_description
        })
      });
      
      if (!response.ok) {
        throw new Error(`Outreach failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Outreach result:", result);

      // Save outreach records to database
      await saveOutreachRecords(selectedData, result.emails || [], session.user.id);

      alert(`Outreach initiated successfully for ${selectedInfluencers.size} influencer(s)! Dashboard will be updated with the outreach status.`);
      setSelectedInfluencers(new Set());
      
      // Navigate back to dashboard after successful outreach
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error("Outreach failed:", error);
      alert(`Outreach failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsOutreaching(false);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const calculateTotalReach = () => {
    return influencers
      .filter(inf => selectedInfluencers.has(inf.id))
      .reduce((total, inf) => total + inf.followers, 0);
  };

  const goBackToDashboard = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    // Set campaign info for display
    if (campaignId) {
      setCampaignInfo(`Campaign ID: ${campaignId}`);
    }
    console.log("MatchedInfluencers - Received state:", { campaignId, query, limit });
    getMatchedInfluencers()
      .then((data) => {
        if (data && data.influencers && data.influencers.length > 0) {
          setInfluencers(data.influencers);
        } else {
          console.log("No influencers matched the query.");
          setInfluencers([]);
        }
      })
      .catch((error) => {
        console.error("Error in useEffect:", error);
        setError("Failed to load influencers");
      });
  }, [campaignId, query, limit]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8"
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
              <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                InfluencerFlow.in
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
              AI-Matched Creators
            </h1>
            <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
              // {query ? `Results for: "${query}"` : 'AI-powered creator discovery'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {campaignId && (
              <Badge variant="outline" className="font-mono">
                Campaign {campaignId}
              </Badge>
            )}
            
            <HoverBorderGradient
              containerClassName="rounded-lg"
              as="button"
              className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center px-4 py-2 text-sm font-mono transition-colors border border-slate-200 dark:border-slate-700"
              onClick={goBackToDashboard}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              back_to_dashboard()
            </HoverBorderGradient>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Analytics & Controls */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 sticky top-6">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                campaign_metrics() {"{"}
              </div>
              
              <div className="space-y-6 pl-4">
                {/* Search Results */}
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Search Results</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {influencers.length}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">found</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedInfluencers.size}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">selected</div>
                    </div>
                  </div>
                </div>

                {/* Campaign Reach */}
                {selectedInfluencers.size > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Total Reach</h3>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {formatFollowers(calculateTotalReach())}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                        potential impressions
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!loading && influencers.length > 0 && (
                  <div className="space-y-3">
                    <HoverBorderGradient
                      containerClassName="rounded-lg w-full"
                      as="button"
                      className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center justify-center px-4 py-3 text-sm font-medium border border-slate-200 dark:border-slate-700"
                      onClick={handleSelectAll}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {selectedInfluencers.size === influencers.length ? 'deselect_all()' : 'select_all()'}
                    </HoverBorderGradient>

                    <HoverBorderGradient
                      containerClassName="rounded-lg w-full"
                      as="button"
                      className={`w-full font-mono flex items-center justify-center px-4 py-3 text-sm font-medium ${
                        selectedInfluencers.size > 0 && !isOutreaching
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                      onClick={selectedInfluencers.size > 0 && !isOutreaching ? handleOutreach : undefined}
                    >
                      {isOutreaching ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          sending_outreach...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          start_outreach({selectedInfluencers.size})
                        </>
                      )}
                    </HoverBorderGradient>
                  </div>
                )}
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mt-4">
                {"}"}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {loading && (
              <motion.div
                className="flex flex-col items-center justify-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                  <Zap className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  AI Discovery in Progress
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-mono text-sm text-center max-w-md">
                  // Analyzing millions of creators to find perfect matches for your campaign
                </p>
              </motion.div>
            )}

            {/* Error State */}
            {error && !loading && (
              <motion.div
                className="flex justify-center py-16"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Alert className="max-w-md border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Results */}
            {!loading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {influencers.length > 0 ? (
                  <div className="space-y-4">
                    {influencers.map((influencer, index) => {
                      const isSelected = selectedInfluencers.has(influencer.id);
                      const matchScore = 85 + Math.floor(Math.random() * 15);
                      
                      return (
                        <HoverBorderGradient
                          key={influencer.id || index}
                          containerClassName="rounded-2xl"
                          as="div"
                          className={`bg-white dark:bg-slate-800 p-6 cursor-pointer transition-all duration-300 ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                          onClick={() => handleInfluencerSelection(influencer.id)}
                        >
                          <div className="flex items-start gap-6">
                            {/* Selection Checkbox */}
                            <div className="flex-shrink-0 mt-2">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                              }`}>
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                            </div>

                            {/* Profile Photo */}
                            <div className="flex-shrink-0">
                              <div className="relative">
                                <img
                                  src={getProfilePhoto(influencer)}
                                  alt={influencer.username}
                                  className="w-16 h-16 rounded-2xl object-cover"
                                  onError={(e) => {
                                    // Fallback to gradient avatar if image fails
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling!.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl items-center justify-center text-white text-xl font-bold">
                                  {influencer.username.charAt(0).toUpperCase()}
                                </div>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    {influencer.username}
                                  </h3>
                                  <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span className="font-mono">{formatFollowers(influencer.followers)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-4 h-4" />
                                      <span className="font-mono">{influencer.email}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={matchScore >= 90 ? 'default' : 'secondary'}
                                    className="font-mono text-xs"
                                  >
                                    {matchScore}% match
                                  </Badge>
                                  {isSelected && (
                                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900/10">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                                {influencer.bio}
                              </p>

                              {/* Stats Row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span className="font-mono">{(influencer.followers * 0.05).toFixed(0)} avg views</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    <span className="font-mono">{((influencer.followers * 0.05) * 0.08).toFixed(0)} avg likes</span>
                                  </div>
                                </div>

                                <a 
                                  href={influencer.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  <HoverBorderGradient
                                    containerClassName="rounded-lg"
                                    className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center px-3 py-2 text-sm font-mono transition-colors"
                                  >
                                    view_profile()
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                  </HoverBorderGradient>
                                </a>
                              </div>
                            </div>
                          </div>
                        </HoverBorderGradient>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-6xl mb-6">🔍</div>
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      No Creators Found
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-sm mb-8 max-w-md mx-auto">
                      // No creators match your search criteria. Try adjusting your query parameters.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <HoverBorderGradient
                        containerClassName="rounded-lg"
                        as="button"
                        className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center px-6 py-3 text-sm font-medium"
                        onClick={() => window.location.reload()}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        retry_search()
                      </HoverBorderGradient>
                      <HoverBorderGradient
                        containerClassName="rounded-lg"
                        as="button"
                        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center px-6 py-3 text-sm font-medium border border-slate-200 dark:border-slate-700"
                        onClick={goBackToDashboard}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        back_to_dashboard()
                      </HoverBorderGradient>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchedInfluencers;

function saveOutreachRecords(selectedData: Influencer[], arg1: any, id: string) {
  throw new Error("Function not implemented.");
}
