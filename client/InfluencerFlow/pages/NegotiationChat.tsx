import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, DollarSign, Clock, MessageSquare, CheckCircle, XCircle, RefreshCw, Play, Users, TrendingUp } from 'lucide-react';
import { useParams } from 'react-router-dom';
import supabase from '../utils/supabase';
import ElevenLabsWidget from '../components/ElevenLabsWidget';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  options?: string[];
  isStreaming?: boolean;
}

interface NegotiationState {
  budget: number;
  campaign_type: string;
  duration: string;
  negotiation_phase: string;
  negotiation_rounds: number;
  agreed_price?: number;
  brand_offer?: number;
  influencer_offer?: number;
}

interface SessionInfo {
  session_id: string;
  created_at: string;
  budget: number;
  status: string;
  last_activity: string;
  rounds: number;
}

// Outreach status types
type OutreachStatus = 'sent' | 'pending' | 'replied' | 'declined';

const NegotiationChat: React.FC = () => {
  const { campaign_id, email } = useParams<{ campaign_id: string, email: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [negotiationState, setNegotiationState] = useState<NegotiationState | null>(null);
  const [isNegotiationComplete, setIsNegotiationComplete] = useState(false);
  const [showStartForm, setShowStartForm] = useState(true);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [influencer_id, setInfluencerID] = useState(null);

  // Form state
  const [budget, setBudget] = useState<number>(5000);
  const [campaignType, setCampaignType] = useState('social_media');
  const [duration, setDuration] = useState('2_weeks');
  const [campaign, setCampaign] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use localhost for development - change this to your actual backend URL in production
  const API_BASE_URL = 'https://influencerflow-ai-services-1.onrender.com';

  const [outreachStatus, setOutreachStatus] = useState<OutreachStatus>('pending');
  const [influencerId, _setInfluencerId] = useState<string>('test_influencer'); // TODO: Replace with actual influencer id logic

  const scrollToBottom = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  useEffect(() => {
    try {
      const fetchCampaign = async () => {
        if (!campaign_id) return;
        const { data, error } = await supabase
          .from('campaign')
          .select('*')
          .eq('id', campaign_id)
          .single();
        if (error) {
          console.error('Error fetching campaign:', error);
        } else {
          setCampaign(data);
          // Optionally set budget, campaignType, duration from campaign
          if (data) {
            setBudget(data.budget || 5000);
            setCampaignType(data.platforms?.split(',')[0] || 'social_media');
            // setDuration('2_weeks'); // You may map campaign duration fields if available
          }
        }
      };
      fetchCampaign();
    } catch (error) {
      console.error('Error fetching campaign:', error);
      // Display Error Message
      
    }
  }, [campaign_id]);

  const loadActiveSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.active_sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const startNegotiation = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/start-negotiation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, campaign_type: campaignType }),
      });
      if (!response.ok) throw new Error('Failed to start negotiation');
      const data = await response.json();
      setSessionId(data.session_id);
      setNegotiationState(data.state);
      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: data.content,
        timestamp: new Date(),
        options: data.options,
      };
      setMessages([botMessage]);
      setShowStartForm(false);
      console.log('Here: ',data)
      setIsNegotiationComplete(data.is_complete);
      loadActiveSessions();
    } catch (error) {
      setGlobalError('Failed to start negotiation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInfluencerUsingEmail = async (email: string | undefined) => {
    if (!campaign_id || !email) {
      console.warn("Campaign ID or email is missing for getInfluencerUsingEmail.");
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('outreach')
        .select('influencer_id')
        .eq('campaign_id', Number(campaign_id))
        .eq('influencer_email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows found'
        console.error('Error fetching influencer ID:', error);
        return null;
      }
      console.log('Look here: ',data?.influencer_id);
      setInfluencerID(data ? data.influencer_id : null)
      return data ? data.influencer_id : null;
    } catch (err) {
      console.error('Unexpected error in getInfluencerUsingEmail:', err);
      return null;
    }
  };

  useEffect(() => {
    getInfluencerUsingEmail(email);
  }, []);

  // Helper to log CRM message as JSON array in content column
  const logCRMMessage = async (content: string, type: 'user' | 'bot') => {
    if (!campaign_id || !influencer_id) {
      console.warn("Campaign ID or Influencer ID is missing for logCRMMessage.");
      return;
    }
    const messageObj = {
      content,
      type,
      timestamp: new Date().toISOString(),
    };
    try {
      // Try to fetch existing CRM_logs row for this campaign and influencer
      const { data, error } = await supabase
        .from('CRM_logs')
        .select('id, content')
        .eq('campaign_id', Number(campaign_id))
        .eq('influencer_id', influencer_id)
        .single();
      if (error && error.code !== 'PGRST116') {
        // Not a 'no rows found' error
        console.error('Error fetching CRM_logs:', error);
        alert('Failed to fetch CRM log: ' + error.message);
        return;
      }
      if (data) {
        // Row exists, append to content array
        const currentContent = Array.isArray(data.content) ? data.content : [];
        const newContent = [...currentContent, messageObj];
        const { error: updateError } = await supabase
          .from('CRM_logs')
          .update({ content: newContent })
          .eq('id', data.id);
        if (updateError) {
          console.error('Error updating CRM log:', updateError);
          alert('Failed to update CRM log: ' + updateError.message);
        }
      } else {
        // No row exists, insert new
        console.log('DEBUG influencer_id', influencer_id)
        const { error: insertError } = await supabase
          .from('CRM_logs')
          .insert([
            {
              campaign_id: Number(campaign_id),
              content: [messageObj],
              influencer_id: influencer_id,
            },
          ]);
        if (insertError) {
          console.error('Error inserting CRM log:', insertError);
          alert('Failed to insert CRM log: ' + insertError.message);
        }
      }
    } catch (err) {
      console.error('Unexpected error logging CRM message:', err);
      alert('Unexpected error logging CRM message.');
    }
  };

  // Fetch outreach status on campaign load
  useEffect(() => {
    const fetchOutreachStatus = async () => {
      if (!campaign_id) return;
      const { data, error } = await supabase
        .from('outreach')
        .select('status')
        .match({ campaign_id: Number(campaign_id) })
        .single();
      if (!error && data) {
        setOutreachStatus(data.status);
      }
    };
    fetchOutreachStatus();
  }, [campaign_id]);

  // Function to update campaign status in the campaign table
  const updateCampaignStatus = async (newStatus: string) => {
    if (!campaign_id) return;
    await supabase
      .from('campaign')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', campaign_id);
  };

  // Function to update outreach status
  const updateOutreachStatus = async (newStatus: OutreachStatus, agreedPrice?: number) => {
    if (!campaign_id || !influencerId) return;
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'replied') {
      updateData.replied_at = new Date().toISOString();
      if (agreedPrice !== undefined && agreedPrice !== null) {
        updateData.agreed_price = agreedPrice;
      }
    }
    const { error } = await supabase
      .from('outreach')
      .update(updateData)
      .match({ campaign_id: Number(campaign_id), influencer_email: email});
    if (!error) setOutreachStatus(newStatus);

    // Update campaign table status as well
    if (newStatus === 'replied') {
      await updateCampaignStatus('active');
    } else if (newStatus === 'declined') {
      await updateCampaignStatus('declined');
    } else if (newStatus === 'pending') {
      await updateCampaignStatus('pending');
    } else if (newStatus === 'sent') {
      await updateCampaignStatus('draft');
    }
  };

  // Helper to detect status from message
  const detectStatusFromMessage = (message: string): OutreachStatus | null => {
    const lower = message.toLowerCase();
    if (lower.includes('accept') || lower.includes('agreed')) return 'replied';
    if (lower.includes('decline') || lower.includes('not interested')) return 'declined';
    if (lower.includes('pending') || lower.includes('consider')) return 'pending';
    return null;
  };

  // Wrap setMessages to log to CRM_logs and update outreach status
  const addMessage = async (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    await logCRMMessage(msg.content, msg.type);
    // Only update outreach status for user messages, except 'replied'
    if (msg.type === 'user') {
      const detected = detectStatusFromMessage(msg.content);
      if (detected && detected !== 'replied') {
        await updateOutreachStatus(detected);
      }
    }
  };

  // Retry wrapper for async operations
  const retryOperation = async (operation: () => Promise<any>, maxRetries = 2, delay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) await new Promise(res => setTimeout(res, delay));
      }
    }
    throw lastError;
  };

  // Improved sendMessage with retry and error UI
  const sendMessage = async (message: string) => {
    if (!sessionId || isStreaming) return;
    setLastUserMessage(message);
    setIsStreaming(true);
    setGlobalError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    console.log('Review here: ',userMessage)
    await addMessage(userMessage);
    setInputValue('');
    // Placeholder bot message
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, botMessage]);
    try {
      await retryOperation(async () => {
        const response = await fetch(`${API_BASE_URL}/respond-stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, message }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let streamedContent = '';
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (jsonStr.trim()) {
                  try {
                    const data = JSON.parse(jsonStr);
                    if (data.type === 'stream') {
                      streamedContent += data.content;
                      setMessages(prev => prev.map(msg =>
                        msg.id === botMessageId
                          ? { ...msg, content: streamedContent }
                          : msg
                      ));
                    } else if (data.type === 'complete') {
                      setMessages(prev => prev.map(msg =>
                        msg.id === botMessageId
                          ? {
                            ...msg,
                            content: streamedContent,
                            options: data.options,
                            isStreaming: false
                          }
                          : msg
                      ));
                      setNegotiationState(data.state);
                      setIsNegotiationComplete(data.is_complete);
                      loadActiveSessions();
                      await logCRMMessage(streamedContent, 'bot');
                      if (data.is_complete && data.state.agreed_price) {
                        await updateOutreachStatus('replied', data.state.agreed_price);
                      }
                      if (data.is_complete && data.state.agreed_price) {
                        await updateCampaignStatus('in_review');
                      }
                    } else if (data.type === 'error') {
                      throw new Error(data.content);
                    }
                  } catch (e) {
                    throw new Error('Error parsing server response.');
                  }
                }
              }
            }
          }
        }
      });
    } catch (error: any) {
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, content: `Error: ${error.message || 'Failed to get response. Please try again.'}`, isStreaming: false }
          : msg
      ));
      setGlobalError(error.message || 'Failed to get response. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleOptionClick = (option: string) => {
    sendMessage(option);
  };

  const handleSubmit = () => {
    if (inputValue.trim() && !isStreaming) {
      sendMessage(inputValue.trim());
    }
  };

  const resetNegotiation = () => {
    setMessages([]);
    setSessionId(null);
    setNegotiationState(null);
    setIsNegotiationComplete(false);
    setShowStartForm(true);
    setInputValue('');
    setIsStreaming(false);
    loadActiveSessions();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (phase: string) => {
    switch (phase) {
      case 'completed': return 'text-green-600';
      case 'failed': case 'declined': return 'text-red-600';
      case 'waiting_for_influencer_response': case 'waiting_for_decision': return 'text-blue-600';
      case 'brand_considering': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (phase: string) => {
    switch (phase) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': case 'declined': return <XCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  // UI helper for status color
  const getOutreachStatusColor = (status: OutreachStatus) => {
    switch (status) {
      case 'replied': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Utility: Format timestamp
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (showStartForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <ElevenLabsWidget email={email} campaign_id={campaign_id} />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🤖 AI Negotiation Agent
            </h1>
            <p className="text-gray-600">
              Practice your negotiation skills with our AI-powered brand representative
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Start Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                Start New Negotiation
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Budget ($)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    min="1000"
                    max="100000"
                    step="500"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Type
                  </label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  >
                    <option value="social_media">Social Media</option>
                    <option value="blog_post">Blog Post</option>
                    <option value="video_content">Video Content</option>
                    <option value="product_review">Product Review</option>
                    <option value="brand_partnership">Brand Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  >
                    <option value="1_week">1 Week</option>
                    <option value="2_weeks">2 Weeks</option>
                    <option value="1_month">1 Month</option>
                    <option value="3_months">3 Months</option>
                  </select>
                </div>

                <button
                  onClick={startNegotiation}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  Start Negotiation
                </button>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-blue-600" />
                  Active Sessions
                </h2>
                <button
                  onClick={loadActiveSessions}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activeSessions.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No active sessions</p>
                  </div>
                ) : (
                  activeSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getStatusIcon(session.status)}
                          <span className={`ml-2 font-medium ${getStatusColor(session.status)}`}>
                            {session.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          Round {session.rounds}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Budget: {formatCurrency(session.budget)}</p>
                        <p>Created: {formatDate(session.created_at)}</p>
                        <p>Last Activity: {formatDate(session.last_activity)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {globalError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center justify-between">
            <span>{globalError}</span>
            <button onClick={() => setGlobalError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="animate-spin mr-2" /> Loading...
          </div>
        )}
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-xl p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Bot className="w-6 h-6 mr-2 text-blue-600" />
                AI Negotiation Agent
              </h1>
              {negotiationState && (
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Budget: {formatCurrency(negotiationState.budget)}
                  </span>
                  <span className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Round: {negotiationState.negotiation_rounds}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {negotiationState.campaign_type.replace('_', ' ')} • {negotiationState.duration.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={resetNegotiation}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Session
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div
          ref={chatContainerRef}
          className="bg-white shadow-xl h-96 overflow-y-auto p-6 space-y-4"
        >
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start">
                    {message.type === 'bot' && (
                      <Bot className="w-4 h-4 mr-2 mt-1 text-blue-600" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-4 h-4 mr-2 mt-1 text-white" />
                    )}
                    <div>
                      <div className="whitespace-pre-wrap">
                        {message.content}
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                        )}
                        {/* Retry button for failed bot messages */}
                        {message.type === 'bot' && message.content.startsWith('Error:') && lastUserMessage && (
                          <button
                            onClick={() => sendMessage(lastUserMessage)}
                            className="ml-2 text-blue-600 underline text-xs"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options */}
              {message.options && message.options.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-start ml-6">
                  {message.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(option)}
                      disabled={isStreaming}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!isNegotiationComplete && (
          <div className="sticky bottom-0 bg-white rounded-b-2xl shadow-xl p-6 z-10">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={isStreaming ? "AI is responding..." : "Type your message..."}
                disabled={isStreaming}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isStreaming}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isNegotiationComplete && (
          <div className="bg-white rounded-b-2xl shadow-xl p-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Negotiation Complete!
                  </h3>
                  <p className="text-gray-600">
                    {negotiationState?.agreed_price && (campaign?.status === 'in_review' || campaign?.status === 'completed')
                      ? `Deal agreed at ${formatCurrency(negotiationState.agreed_price)}`
                      : (campaign?.status === 'failed' || campaign?.status === 'declined')
                        ? 'No agreement reached'
                        : (campaign?.status === 'in_review' && !negotiationState?.agreed_price)
                          ? 'Agreement in review.'
                          : 'Negotiation ended.'}
                  </p>
                  {/* Show review message if in_review, else show nothing (no Mark as Completed button) */}
                  {campaign?.status === 'in_review' && (
                    <div className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                      Agreement in review. Awaiting brand action.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Outreach Status */}
        <div className="flex items-center gap-3 mt-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getOutreachStatusColor(outreachStatus)}`}>
            Outreach Status: {outreachStatus.charAt(0).toUpperCase() + outreachStatus.slice(1)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegotiationChat;