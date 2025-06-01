import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Define the structure of an influencer object
interface Influencer {
  id: string;
  username: string;
  email: string;
  bio: string;
  followers: number;
  link: string;
}

// Mock data for demo purposes
const mockInfluencers: Influencer[] = [
  {
    id: "1",
    username: "inulute",
    email: "rishabh@inulute.com",
    bio: "Tech enthusiast sharing honest reviews of gadgets, apps, and digital tools. Helping people make informed tech decisions.",
    followers: 245000,
    link: "https://instagram.com/inulute"
  },
  {
    id: "2", 
    username: "FitnessGuru_Sarah",
    email: "sarah@fitlife.com",
    bio: "Certified personal trainer and nutritionist. Sharing workout routines, healthy recipes, and wellness tips for a balanced lifestyle.",
    followers: 189000,
    link: "https://instagram.com/fitnessguru_sarah"
  },
  {
    id: "3",
    username: "TravelWithMike",
    email: "mike@wanderlust.com", 
    bio: "Digital nomad exploring the world one city at a time. Budget travel tips, hidden gems, and cultural experiences.",
    followers: 156000,
    link: "https://instagram.com/travelwithmike"
  },
  {
    id: "4",
    username: "FoodieEmma",
    email: "emma@tastytreats.com",
    bio: "Food blogger and recipe creator. Sharing delicious homemade meals, restaurant reviews, and cooking tutorials.",
    followers: 98000,
    link: "https://instagram.com/foodieemma"
  },
  {
    id: "5",
    username: "StyleQueen_Lisa",
    email: "lisa@fashionforward.com",
    bio: "Fashion stylist and designer. Affordable outfit ideas, style tips, and latest fashion trends for every occasion.",
    followers: 312000,
    link: "https://instagram.com/stylequeen_lisa"
  },
  {
    id: "6",
    username: "TechReviewer_Alex",
    email: "alex@techinsights.com",
    bio: "Software engineer turned tech reviewer. Deep dives into smartphones, laptops, and emerging technologies.",
    followers: 278000,
    link: "https://instagram.com/techreviewer_alex"
  },
  {
    id: "7",
    username: "HealthyLifestyle_Maya",
    email: "maya@wellness.com",
    bio: "Holistic wellness coach. Mental health awareness, meditation practices, and sustainable living tips.",
    followers: 134000,
    link: "https://instagram.com/healthylifestyle_maya"
  },
  {
    id: "8",
    username: "FashionForward_Sam",
    email: "sam@styletrends.com",
    bio: "Fashion blogger and trend forecaster. Street style, sustainable fashion, and accessibility in style.",
    followers: 167000,
    link: "https://instagram.com/fashionforward_sam"
  }
];

function MatchedInfluencers() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get campaign data from navigation state
  const campaignId = location.state?.campaignId;
  const query = location.state?.query || "tech lifestyle creators";
  const limit = location.state?.limit || 10;
  
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
  const [isOutreaching, setIsOutreaching] = useState(false);
  const [campaignInfo, setCampaignInfo] = useState<string>('');

  // Mock API call with delay to simulate real API
  const getMatchedInfluencers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Filter influencers based on query (mock filtering)
      let filteredInfluencers = mockInfluencers;
      if (query) {
        filteredInfluencers = mockInfluencers.filter(inf => 
          inf.bio.toLowerCase().includes(query.toLowerCase()) ||
          inf.username.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      return {
        influencers: filteredInfluencers.slice(0, limit),
        count: filteredInfluencers.length
      };
    } catch (error) {
      console.error("Error fetching matched influencers:", error);
      setError("An error occurred while fetching influencers");
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
      // Simulate outreach API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const selectedData = influencers.filter(inf => selectedInfluencers.has(inf.id));
      console.log("Selected Influencers for Outreach:", selectedData);
      
      alert(`✉️ Outreach emails sent successfully to ${selectedInfluencers.size} influencer(s)!\n\nDemo mode: In a real app, this would send personalized emails to each selected influencer and update the campaign status to "active".`);
      setSelectedInfluencers(new Set());
      
      // Navigate back to dashboard after successful outreach
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error("Outreach failed:", error);
      alert("Outreach failed. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl mb-6 text-center">
          <p className="font-semibold">🚀 Demo Mode - This is a working demo with mock influencer data</p>
          {campaignId && (
            <p className="text-sm mt-1 opacity-90">Continue campaign setup for: {campaignInfo}</p>
          )}
        </div>

        {/* Main Container */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[700px]">
            {/* Left Sidebar - Summary & Controls */}
            <div className="lg:col-span-1 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-8 relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-32 h-32 border border-purple-500/30 rotate-45 rounded-xl"></div>
                <div className="absolute bottom-20 right-20 w-24 h-24 border border-blue-500/30 rotate-12 rounded-lg"></div>
                <div className="absolute top-1/2 left-10 w-4 h-4 bg-green-400 rounded-full"></div>
                <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-purple-500/50 rounded-full"></div>
              </div>

              <div className="relative z-10 text-white h-full flex flex-col">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold">InfluencerFlow</span>
                </div>

                {/* Search Summary */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Search Results</h2>
                  {query && (
                    <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 mb-4">
                      <p className="text-white/70 text-sm mb-1">Query:</p>
                      <p className="font-semibold truncate">"{query}"</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <div className="text-2xl font-bold text-blue-300">{influencers.length}</div>
                      <div className="text-xs text-white/70">Found</div>
                    </div>
                    <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <div className="text-2xl font-bold text-purple-300">{selectedInfluencers.size}</div>
                      <div className="text-xs text-white/70">Selected</div>
                    </div>
                  </div>
                </div>

                {/* Selection Summary */}
                {selectedInfluencers.size > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold mb-3">Campaign Reach</h3>
                    <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-300 mb-2">
                          {formatFollowers(calculateTotalReach())}
                        </div>
                        <div className="text-sm text-white/70">Total Potential Reach</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!loading && influencers.length > 0 && (
                  <div className="mt-auto space-y-4">
                    <button
                      onClick={handleSelectAll}
                      className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-semibold transition-all duration-200 border border-white/30"
                    >
                      {selectedInfluencers.size === influencers.length ? 'Deselect All' : 'Select All'}
                    </button>

                    <button
                      onClick={handleOutreach}
                      disabled={selectedInfluencers.size === 0 || isOutreaching}
                      className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 ${
                        selectedInfluencers.size > 0 && !isOutreaching
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {isOutreaching ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Starting Outreach...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Start Outreach ({selectedInfluencers.size})
                        </>
                      )}
                    </button>

                    <button
                      onClick={goBackToDashboard}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-all duration-200 border border-white/20"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-4xl font-bold text-gray-900">
                    Matched Influencers
                  </h1>
                  {campaignId && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
                      Campaign Mode
                    </div>
                  )}
                </div>
                <p className="text-gray-600">
                  AI-powered influencer matching based on your campaign requirements.
                </p>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Finding Perfect Matches
                  </h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Our AI is analyzing millions of creators to find the best influencers for your campaign
                  </p>
                  <div className="flex items-center gap-2 mt-6">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center py-16">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                    <div className="text-red-600 text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h3>
                    <p className="text-red-700 mb-6">{error}</p>
                    <button
                      onClick={() => getMatchedInfluencers()}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Results */}
              {!loading && !error && (
                <div>
                  {influencers.length > 0 ? (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {influencers.map((influencer, index) => {
                        const isSelected = selectedInfluencers.has(influencer.id);
                        return (
                          <div
                            key={influencer.id || index}
                            className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300 shadow-lg'
                                : 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-md'
                            }`}
                            onClick={() => handleInfluencerSelection(influencer.id)}
                          >
                            <div className="flex items-start gap-4">
                              {/* Selection Indicator */}
                              <div className="flex-shrink-0 mt-1">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'border-gray-300 hover:border-blue-400'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>

                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                                  {influencer.username.charAt(0).toUpperCase()}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                      {influencer.username}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {formatFollowers(influencer.followers)} followers
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {influencer.email}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {isSelected && (
                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                      Selected
                                    </div>
                                  )}
                                </div>

                                <p className="text-gray-700 mb-4 leading-relaxed line-clamp-2">
                                  {influencer.bio}
                                </p>

                                <div className="flex items-center justify-between">
                                  <a
                                    href={influencer.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-sm"
                                  >
                                    View Profile
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>

                                  {/* Match score indicator */}
                                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                    {85 + Math.floor(Math.random() * 15)}% match
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-6">🔍</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        No influencers found
                      </h3>
                      <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                        We couldn't find any creators matching your search criteria. 
                        Try adjusting your query or creating a new campaign.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => window.location.reload()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          Try New Search
                        </button>
                        <button
                          onClick={goBackToDashboard}
                          className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200"
                        >
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchedInfluencers;