import { useEffect, useState } from "react";
import { Loader2, Users, Mail, CheckSquare, Square } from "lucide-react";
import { useLocation } from "react-router-dom";

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
      
      // Make actual API call to your outreach endpoint
      const response = await fetch('http://localhost:8000/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencers: selectedData,
          campaign: {
            query: query,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Outreach failed: ${response.status}`);
      }
      
      const result = await response.json();
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
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen overflow-x-hidden">
      {/* Background Elements */}
      <div className="absolute -z-10 top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute -z-10 top-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Matched Influencers
                </h1>
                {query && (
                  <p className="text-purple-100">
                    Results for: <span className="font-semibold">"{query}"</span> • Limit: {limit}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-white">
                <Users className="h-6 w-6" />
                <span className="text-xl font-bold">{influencers.length}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-16 w-16 animate-spin text-purple-600 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  Finding matching influencers...
                </h3>
                <p className="text-gray-600 text-lg mb-4">
                  Our AI is analyzing millions of creators
                </p>
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="text-red-600 text-5xl mb-4">⚠️</div>
                  <h3 className="text-xl font-semibold text-red-800 mb-2">Oops! Something went wrong</h3>
                  <p className="text-red-700 mb-6">{error}</p>
                  <button
                    onClick={() => getMatchedInfluencers()}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {!loading && !error && (
              <>
                {influencers.length > 0 ? (
                  <>
                    {/* Selection Controls */}
                    <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-purple-200 hover:bg-purple-50 transition-all duration-200"
                        >
                          {selectedInfluencers.size === influencers.length ? (
                            <CheckSquare className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-700">
                            {selectedInfluencers.size === influencers.length ? 'Deselect All' : 'Select All'}
                          </span>
                        </button>
                        
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold text-purple-600">{selectedInfluencers.size}</span> of{' '}
                          <span className="font-semibold">{influencers.length}</span> selected
                        </div>
                      </div>

                      <button
                        onClick={handleOutreach}
                        disabled={selectedInfluencers.size === 0 || isOutreaching}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                          selectedInfluencers.size > 0 && !isOutreaching
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isOutreaching ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Mail className="h-5 w-5" />
                        )}
                        {isOutreaching ? 'Initiating Outreach...' : `Start Outreach (${selectedInfluencers.size})`}
                      </button>
                    </div>

                    {/* Influencer Cards */}
                    <div className="grid gap-6">
                      {influencers.map((influencer, index) => {
                        const isSelected = selectedInfluencers.has(influencer.id);
                        return (
                          <div
                            key={influencer.id || index}
                            className={`relative p-6 rounded-2xl border transition-all duration-300 transform hover:scale-[1.02] ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300 shadow-lg'
                                : 'bg-white/60 border-gray-200 hover:bg-white/80 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start gap-6">
                              {/* Selection Checkbox */}
                              <button
                                onClick={() => handleInfluencerSelection(influencer.id)}
                                className="flex-shrink-0 mt-2 p-1 rounded-lg hover:bg-white/50 transition-colors"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-6 w-6 text-purple-600" />
                                ) : (
                                  <Square className="h-6 w-6 text-gray-400 hover:text-purple-600" />
                                )}
                              </button>

                              {/* Profile Avatar */}
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                                  {influencer.username.charAt(0).toUpperCase()}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                      {influencer.username}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {formatFollowers(influencer.followers)} followers
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        {influencer.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <p className="text-gray-700 mb-4 leading-relaxed">
                                  {influencer.bio}
                                </p>

                                <div className="flex items-center justify-between">
                                  <a
                                    href={influencer.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium text-sm"
                                  >
                                    View Profile
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                  
                                  {isSelected && (
                                    <div className="flex items-center gap-2 text-purple-600 font-medium text-sm">
                                      <CheckSquare className="h-4 w-4" />
                                      Selected for outreach
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      No influencers found
                    </h3>
                    <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                      We couldn't find any creators matching your search criteria. 
                      Try adjusting your query or increasing the limit.
                    </p>
                    <button
                      onClick={() => window.history.back()}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Try New Search
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchedInfluencers;