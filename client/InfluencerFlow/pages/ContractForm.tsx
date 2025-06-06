// pages/ContractManager.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FileText, Download, CheckCircle, Clock, XCircle, Upload, User, Building, DollarSign, Calendar, Package, FileSignature, AlertCircle, CreditCard } from 'lucide-react';

// Types matching your Vercel functions
interface ContractTemplate {
  influencer_name: string;
  brand_name: string;
  rate: number;
  timeline: string;
  deliverables: string;
  payment_terms: string;
  special_requirements?: string;
}

interface Contract {
  id: string;
  template_id: string;
  influencer_id: string;
  brand_id: string;
  status: ContractStatus;
  contract_data: ContractTemplate;
  signed_by?: string;
  signed_at?: string;
  signature_url?: string;
  contract_url?: string;
  payment_status?: PaymentStatus;
  payment_id?: string;
  razorpay_order_id?: string;
  created_at: string;
  updated_at: string;
}

enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED'
}

enum PaymentStatus {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// API Configuration - Fixed for Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://13.235.43.100:5050';

// API functions using your existing backend
const api = {
  previewContract: async (data: ContractTemplate): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to preview contract' }));
      throw new Error(error.error || 'Failed to preview contract');
    }
    
    return response.blob();
  },
  
  generateContract: async (data: ContractTemplate & { influencer_id: string; brand_id: string }): Promise<Contract> => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to generate contract' }));
      throw new Error(error.error || 'Failed to generate contract');
    }
    
    return response.json();
  },
  
  signContract: async (contractId: string, signatureFile: File, userId: string): Promise<Contract> => {
    const formData = new FormData();
    formData.append('contract_id', contractId);
    formData.append('signature_file', signatureFile);
    formData.append('user_id', userId);
    formData.append('mime_type', signatureFile.type);
    
    const response = await fetch(`${API_BASE_URL}/api/contracts/sign`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to sign contract' }));
      throw new Error(error.error || 'Failed to sign contract');
    }
    
    return response.json();
  },

  createPaymentOrder: async (contractId: string, amount: number): Promise<{ order_id: string; key: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contract_id: contractId, 
        amount: Math.round(amount * 100), // Convert USD to cents
        currency: 'USD'
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create payment order' }));
      throw new Error(error.error || 'Failed to create payment order');
    }
    
    return response.json();
  },

  verifyPayment: async (paymentData: RazorpayResponse & { contract_id: string }): Promise<Contract> => {
    const response = await fetch(`${API_BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Payment verification failed' }));
      throw new Error(error.error || 'Payment verification failed');
    }
    
    return response.json();
  },
  
  getContract: async (id: string): Promise<Contract> => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${id}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch contract' }));
      throw new Error(error.error || 'Failed to fetch contract');
    }
    
    return response.json();
  },
  
  listContracts: async (userId: string, role: 'influencer' | 'brand'): Promise<Contract[]> => {
    const response = await fetch(`${API_BASE_URL}/api/contracts?user_id=${userId}&role=${role}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch contracts' }));
      throw new Error(error.error || 'Failed to fetch contracts');
    }
    
    return response.json();
  }
};

// Razorpay Integration Hook
const useRazorpay = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initiatePayment = (options: RazorpayOptions) => {
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded');
    }
    
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return { initiatePayment };
};

// Error Display Component
const ErrorMessage = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center">
      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
      <span className="text-red-800 font-medium">Error: {error}</span>
    </div>
    <button 
      onClick={onRetry}
      className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
    >
      Retry
    </button>
  </div>
);

// Loading Spinner Component
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
    <span className="text-gray-600">{message}</span>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status, paymentStatus }: { status: ContractStatus; paymentStatus?: PaymentStatus }) => {
  const statusConfig = {
    [ContractStatus.DRAFT]: { color: 'bg-gray-100 text-gray-800', icon: FileText },
    [ContractStatus.PENDING_SIGNATURE]: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    [ContractStatus.SIGNED]: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    [ContractStatus.REJECTED]: { color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const paymentConfig = {
    [PaymentStatus.PENDING]: { color: 'bg-orange-100 text-orange-800', icon: Clock },
    [PaymentStatus.INITIATED]: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
    [PaymentStatus.COMPLETED]: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    [PaymentStatus.FAILED]: { color: 'bg-red-100 text-red-800', icon: XCircle }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
      {paymentStatus && (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentConfig[paymentStatus].color}`}>
          <CreditCard className="w-3 h-3 mr-1" />
          Payment: {paymentStatus}
        </span>
      )}
    </div>
  );
};

// Contract Form Component (truncated for brevity - same as previous)
const ContractForm = ({ onContractCreated }: { onContractCreated: () => void }) => {
  const [formData, setFormData] = useState<ContractTemplate>({
    influencer_name: '',
    brand_name: '',
    rate: 0,
    timeline: '',
    deliverables: '',
    payment_terms: '',
    special_requirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof ContractTemplate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.influencer_name || !formData.brand_name || !formData.rate || 
        !formData.timeline || !formData.deliverables || !formData.payment_terms) {
      setError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handlePreview = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const pdfBlob = await api.previewContract(formData);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const contractData = {
        ...formData,
        influencer_id: 'inf-' + Date.now(),
        brand_id: 'brand-' + Date.now()
      };
      
      await api.generateContract(contractData);
      
      setFormData({
        influencer_name: '',
        brand_name: '',
        rate: 0,
        timeline: '',
        deliverables: '',
        payment_terms: '',
        special_requirements: ''
      });
      
      alert('Contract generated successfully!');
      onContractCreated();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
      {error && <ErrorMessage error={error} onRetry={() => setError(null)} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Influencer Name *
          </label>
          <input
            type="text"
            value={formData.influencer_name}
            onChange={(e) => handleChange('influencer_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter influencer name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-2" />
            Brand Name *
          </label>
          <input
            type="text"
            value={formData.brand_name}
            onChange={(e) => handleChange('brand_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter brand name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Rate ($) *
          </label>
          <input
            type="number"
            value={formData.rate}
            onChange={(e) => handleChange('rate', Number(e.target.value))}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter compensation amount in USD"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Timeline *
          </label>
          <input
            type="text"
            value={formData.timeline}
            onChange={(e) => handleChange('timeline', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 30 days, 2 weeks"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Package className="w-4 h-4 inline mr-2" />
          Deliverables *
        </label>
        <textarea
          value={formData.deliverables}
          onChange={(e) => handleChange('deliverables', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the work to be delivered (e.g., 2 Instagram posts, 1 story)"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Terms *
        </label>
        <input
          type="text"
          value={formData.payment_terms}
          onChange={(e) => handleChange('payment_terms', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 50% upfront, 50% on completion"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requirements (Optional)
        </label>
        <textarea
          value={formData.special_requirements || ''}
          onChange={(e) => handleChange('special_requirements', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional requirements or notes"
        />
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={handlePreview}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating Preview...' : 'Preview Contract'}
        </button>
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating Contract...' : 'Generate & Save Contract'}
        </button>
      </div>
    </div>
  );
};

// Main Contract Manager Component
const ContractManager = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'detail'>('list');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [userRole] = useState<'influencer' | 'brand'>('brand');
  const [userId] = useState('user-123');
  const { initiatePayment } = useRazorpay();

  // Determine active tab based on URL
  useEffect(() => {
    if (params.id) {
      setActiveTab('detail');
      loadContract(params.id);
    } else if (window.location.pathname.includes('/create')) {
      setActiveTab('create');
    } else {
      setActiveTab('list');
    }
  }, [params.id]);

  useEffect(() => {
    if (activeTab === 'list') {
      loadContracts();
    }
  }, [activeTab]);

  const loadContract = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const contract = await api.getContract(id);
      setSelectedContract(contract);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const contractList = await api.listContracts(userId, userRole);
      setContracts(contractList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContractCreated = () => {
    setActiveTab('list');
    loadContracts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileSignature className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Contract Manager</h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'create' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Contract
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Contracts ({contracts.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorMessage error={error} onRetry={() => setError(null)} />}

        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Contract</h2>
              <p className="text-gray-600">Fill in the contract details to generate a new agreement.</p>
            </div>
            <ContractForm onContractCreated={handleContractCreated} />
          </div>
        )}

        {activeTab === 'list' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Contracts</h2>
              <p className="text-gray-600">Manage your contracts and track their progress.</p>
            </div>
            {contracts.length === 0 && !loading ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
                <p className="text-gray-500 mb-6">Create your first contract to get started.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Contract
                </button>
              </div>
            ) : loading ? (
              <LoadingSpinner message="Loading contracts..." />
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedContract(contract);
                      setActiveTab('detail');
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.contract_data.brand_name} × {contract.contract_data.influencer_name}
                        </h3>
                        <p className="text-gray-600 mt-1">${contract.contract_data.rate.toLocaleString()}</p>
                      </div>
                      <StatusBadge status={contract.status} paymentStatus={contract.payment_status} />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Timeline:</span>
                        <p className="font-medium">{contract.contract_data.timeline}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="font-medium">{new Date(contract.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Deliverables:</span>
                        <p className="font-medium truncate">{contract.contract_data.deliverables}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment:</span>
                        <p className="font-medium truncate">{contract.contract_data.payment_terms}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'detail' && selectedContract && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => setActiveTab('list')}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
              >
                ← Back to Contracts
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedContract.contract_data.brand_name} × {selectedContract.contract_data.influencer_name}
                  </h2>
                  <StatusBadge status={selectedContract.status} paymentStatus={selectedContract.payment_status} />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      window.open(`${API_BASE_URL}/api/contracts/${selectedContract.id}/download`, '_blank');
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Rate</label>
                  <p className="text-lg font-semibold">${selectedContract.contract_data.rate.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Timeline</label>
                  <p className="font-medium">{selectedContract.contract_data.timeline}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Deliverables</label>
                  <p className="font-medium">{selectedContract.contract_data.deliverables}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Payment Terms</label>
                  <p className="font-medium">{selectedContract.contract_data.payment_terms}</p>
                </div>
                {selectedContract.contract_data.special_requirements && (
                  <div>
                    <label className="text-sm text-gray-500">Special Requirements</label>
                    <p className="font-medium">{selectedContract.contract_data.special_requirements}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContractManager;