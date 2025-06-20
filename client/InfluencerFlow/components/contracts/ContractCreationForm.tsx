import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate } from '../../types/contract';
import { contractService } from '../../services/contractService';
import supabase from '../../utils/supabase';

interface ContractCreationFormProps {
  onPreview?: (data: ContractTemplate) => void;
  onSubmit?: (data: ContractTemplate) => void;
}

export const ContractCreationForm: React.FC<ContractCreationFormProps> = ({ onPreview, onSubmit }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContractTemplate>({
    influencer_name: '',
    brand_name: '',
    rate: 0,
    timeline: '',
    deliverables: '',
    payment_terms: '',
    special_requirements: ''
  });

  // Add state for influencer ID
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('');
  const [influencerOptions, setInfluencerOptions] = useState<Array<{id: string, name: string}>>([]);

  // Add function to fetch influencers from outreach records
  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const { data: outreachData, error } = await supabase
          .from('outreach')
          .select('influencer_id, influencer_username')
          .eq('status', 'replied');
          
        if (error) throw error;
        
        setInfluencerOptions(
          outreachData.map(record => ({
            id: record.influencer_id,
            name: record.influencer_username
          }))
        );
      } catch (err) {
        console.error('Error fetching influencers:', err);
        setError('Failed to load influencers');
      }
    };
    
    fetchInfluencers();
  }, []);

  const handleChange = (field: keyof ContractTemplate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.brand_name || !formData.rate || !formData.timeline || 
        !formData.deliverables || !formData.payment_terms || !selectedInfluencerId) {
      setError('Please fill in all required fields and select an influencer');
      return false;
    }
    return true;
  };

  const handlePreview = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (onPreview) {
        onPreview(formData);
      } else {
        const pdfBlob = await contractService.previewContract(formData);
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (onSubmit) {
        onSubmit(formData);
      } else {
        const user = await contractService.getCurrentUser();
        const contractData = {
          ...formData,
          brand_name: user.brandName || formData.brand_name,
          influencer_id: selectedInfluencerId, // Use the selected influencer ID
          brand_id: user.userId
        };
        
        await contractService.generateContract(contractData);
        navigate('/contracts');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Influencer *
          </label>
          <select
            value={selectedInfluencerId}
            onChange={(e) => {
              setSelectedInfluencerId(e.target.value);
              const selected = influencerOptions.find(opt => opt.id === e.target.value);
              if (selected) {
                handleChange('influencer_name', selected.name);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an influencer</option>
            {influencerOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand Name *
          </label>
          <input
            type="text"
            value={formData.brand_name}
            onChange={(e) => handleChange('brand_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter brand name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate (USD) *
          </label>
          <input
            type="number"
            value={formData.rate || ''}
            onChange={(e) => handleChange('rate', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter rate"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeline *
          </label>
          <input
            type="text"
            value={formData.timeline}
            onChange={(e) => handleChange('timeline', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 30 days"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deliverables *
          </label>
          <textarea
            value={formData.deliverables}
            onChange={(e) => handleChange('deliverables', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter deliverables"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Terms *
          </label>
          <input
            type="text"
            value={formData.payment_terms}
            onChange={(e) => handleChange('payment_terms', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 50% upfront, 50% upon completion"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requirements
          </label>
          <textarea
            value={formData.special_requirements || ''}
            onChange={(e) => handleChange('special_requirements', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter any special requirements"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePreview}
          disabled={loading}
          className="flex-1 bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Preview Contract
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Generate Contract
        </button>
      </div>
    </form>
  );
}; 