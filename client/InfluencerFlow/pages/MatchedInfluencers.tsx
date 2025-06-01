import React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// Define the API response structure
interface ApiResponse {
  influencers: Influencer[];
  count: number;
}

function MatchedInfluencers() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = location.state?.query || "";
  const limit = location.state?.limit || 10;
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
  const [isOutreaching, setIsOutreaching] = useState(false);

  console.log("Query:", query);
  console.log("Limit:", limit);

  const getMatchedInfluencers = async () => {
    const url = `http://localhost:8000/influencers/query`;
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
      // Get selected influencer data
      const selectedData = influencers.filter(inf => selectedInfluencers.has(inf.id));
      console.log("Selected Influencers for Outreach:", selectedData);
        if (selectedData.length === 0) {
            alert("No influencers selected for outreach.");
        }
      const brand_name = localStorage.getItem('brand_name') || "Your Brand Name";
      const brand_description = localStorage.getItem('brand_description') || "Your Brand Description";
      console.log(`Brand Name: ${brand_name} and Brand Description: ${brand_description}`);
      // Make actual API call to your outreach endpoint
      const response = await fetch('http://localhost:8000/influencers/outreachEmailGenerator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencers_data: selectedData,
          brand_name: brand_name, // Replace with actual brand name
          brand_description: brand_description, // Replace with actual brand description
        })
      });
      
      if (!response.ok) {
        throw new Error(`Outreach failed: ${response.status}`);
      }
      
      const result = await response.json();
      // Send emails to each
      /*
      response format list of: 
              {
            "emails": [
                {
                    "subject": "FashionDekho x makeuptutorialsx0x - Potential Partnership",
                    "body": "Hey makeuptutorialsx0x,\n\nWe at FashionDekho love your content on Beauty & Fashion and your insightful product reviews! \n\nWe're building a platform to connect top-tier influencers like yourself with amazing brands and vendors.\n\nWould you be open to exploring a potential partnership?\n\nBest,\nFashionDekho Team"
                }
            ]
        }
      */
  
      console.log("Outreach result:", result);

      alert(`Outreach initiated successfully for ${selectedInfluencers.size} influencer(s)!`);
      setSelectedInfluencers(new Set());
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

  useEffect(() => {
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
  }, [query, limit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Container */}
        <motion.div 
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
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
                    <motion.button
                      onClick={handleSelectAll}
                      className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-semibold transition-all duration-200 border border-white/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {selectedInfluencers.size === influencers.length ? 'Deselect All' : 'Select All'}
                    </motion.button>

                    <motion.button
                      onClick={handleOutreach}
                      disabled={selectedInfluencers.size === 0 || isOutreaching}
                      className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 ${
                        selectedInfluencers.size > 0 && !isOutreaching
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      }`}
                      whileHover={{ scale: selectedInfluencers.size > 0 && !isOutreaching ? 1.02 : 1 }}
                      whileTap={{ scale: selectedInfluencers.size > 0 && !isOutreaching ? 0.98 : 1 }}
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
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  Matched Influencers
                </h1>
                <p className="text-gray-600">
                  AI-powered influencer matching based on your campaign requirements.
                </p>
              </div>

              {/* Loading State */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error State */}
              <AnimatePresence>
                {error && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-16"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <AnimatePresence>
                {!loading && !error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {influencers.length > 0 ? (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {influencers.map((influencer, index) => {
                          const isSelected = selectedInfluencers.has(influencer.id);
                          return (
                            <motion.div
                              key={influencer.id || index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                      >
                        <div className="text-6xl mb-6">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          No influencers found
                        </h3>
                        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                          We couldn't find any creators matching your search criteria. 
                          Try adjusting your query or creating a new campaign.
                        </p>
                        <button
                          onClick={() => navigate('/create-campaign')}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          Create New Campaign
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default MatchedInfluencers;