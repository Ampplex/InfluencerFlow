import { Contract, ContractTemplate, SignContractRequest } from '../types/contract';
import supabase from '../utils/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const contractService = {
  previewContract: async (data: ContractTemplate): Promise<Blob> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated user');
    }

    const response = await fetch(`${API_BASE_URL}/api/contracts/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to preview contract' }));
      throw new Error(error.error || 'Failed to preview contract');
    }

    return response.blob();
  },

  generateContract: async (data: ContractTemplate & { influencer_id: string; brand_id: string }): Promise<Contract> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated user');
    }

    const response = await fetch(`${API_BASE_URL}/api/contracts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to generate contract' }));
      throw new Error(error.error || 'Failed to generate contract');
    }

    return response.json();
  },

  signContract: async (contractId: string, signatureFile: File, userId: string): Promise<Contract> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated user');
    }
    const formData = new FormData();
    formData.append('contract_id', contractId);
    formData.append('user_id', userId);
    formData.append('signature_file', signatureFile);

    const response = await fetch('http://localhost:3000/api/contracts/sign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sign contract');
    }

    return response.json();
  },

  getContract: async (id: string): Promise<Contract> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated user');
    }

    const response = await fetch(`${API_BASE_URL}/api/contracts/${id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch contract' }));
      throw new Error(error.error || 'Failed to fetch contract');
    }

    return response.json();
  },

  listContracts: async (userId: string, role: 'influencer' | 'brand'): Promise<Contract[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated user');
    }

    const response = await fetch(`${API_BASE_URL}/api/contracts?user_id=${userId}&role=${role}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch contracts' }));
      throw new Error(error.error || 'Failed to fetch contracts');
    }

    return response.json();
  },

  // Helper function to get current user's role and ID
  getCurrentUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated user');
    }

    // Get user's brand info
    const { data: brandData } = await supabase
      .from('brands')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      userId: session.user.id,
      role: brandData ? 'brand' : 'influencer',
      brandName: brandData?.brand_name || ''
    };
  }
}; 