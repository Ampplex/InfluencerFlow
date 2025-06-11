import { contractService } from './contractService';
import supabase from '../utils/supabase';
import { ContractTemplate } from '../types/contract';

export interface NegotiationResult {
  outreachId: string;
  influencerId: string;
  brandId: string;
  campaignId: number;
  agreedPrice: number;
}

export const contractIntegrationService = {
  /**
   * Generates a contract preview based on negotiation result
   */
  generateContractPreview: async (outreachId: string): Promise<Blob> => {
    try {
      // 1. Get outreach details with the agreed price
      const { data: outreach, error: outreachError } = await supabase
        .from('outreach')
        .select(`
          influencer_id,
          influencer_username,
          influencer_email,
          brand_id,
          agreed_price,
          campaign_id
        `)
        .eq('id', outreachId)
        .single();

      if (outreachError) throw new Error(`Failed to fetch outreach: ${outreachError.message}`);
      if (!outreach.agreed_price) throw new Error('No agreed price found for this outreach');
      
      // 2. Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaign')
        .select(`
          campaign_name,
          description,
          brand_name,
          start_date,
          end_date
        `)
        .eq('id', outreach.campaign_id)
        .single();
      
      if (campaignError) throw new Error(`Failed to fetch campaign: ${campaignError.message}`);
      
      // 3. Get brand details if brand_name is not in campaign
      let brandName = campaign.brand_name;
      if (!brandName) {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('brand_name')
          .eq('brand_id', outreach.brand_id)
          .single();
          
        if (!brandError && brandData) {
          brandName = brandData.brand_name;
        }
      }
      
      // 4. Calculate timeline from campaign dates if available
      let timeline = '30 days'; // Default
      if (campaign.start_date && campaign.end_date) {
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        timeline = `${days} days (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`;
      }
      
      // 5. Create contract template data
      const contractData: ContractTemplate = {
        influencer_name: outreach.influencer_username,
        brand_name: brandName || 'Your Brand',
        rate: outreach.agreed_price,
        timeline: timeline,
        deliverables: campaign.description || 'Content as discussed during negotiation',
        payment_terms: '50% upfront, 50% upon completion',
        special_requirements: ''
      };
      
      // 6. Get preview from contract service
      return await contractService.previewContract(contractData);
    } catch (error: any) {
      console.error('Contract preview error:', error);
      throw error;
    }
  },

  /**
   * Generates an actual contract from negotiation result and updates related records
   */
  generateContract: async (outreachId: string): Promise<string> => {
    try {
      // 1. Get outreach details with the agreed price
      const { data: outreach, error: outreachError } = await supabase
        .from('outreach')
        .select(`
          influencer_id,
          influencer_username,
          influencer_email,
          brand_id,
          agreed_price,
          campaign_id
        `)
        .eq('id', outreachId)
        .single();

      if (outreachError) throw new Error(`Failed to fetch outreach: ${outreachError.message}`);
      if (!outreach.agreed_price) throw new Error('No agreed price found for this outreach');
      
      // 2. Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaign')
        .select(`
          campaign_name,
          description,
          brand_name,
          start_date,
          end_date
        `)
        .eq('id', outreach.campaign_id)
        .single();
      
      if (campaignError) throw new Error(`Failed to fetch campaign: ${campaignError.message}`);
      
      // 3. Get brand details if brand_name is not in campaign
      let brandName = campaign.brand_name;
      if (!brandName) {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('brand_name')
          .eq('brand_id', outreach.brand_id)
          .single();
          
        if (!brandError && brandData) {
          brandName = brandData.brand_name;
        }
      }
      
      // 4. Calculate timeline from campaign dates if available
      let timeline = '30 days'; // Default
      if (campaign.start_date && campaign.end_date) {
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        timeline = `${days} days (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`;
      }
      
      // 5. Create contract template data
      const contractData = {
        influencer_name: outreach.influencer_username,
        brand_name: brandName || 'Your Brand',
        rate: outreach.agreed_price,
        timeline: timeline,
        deliverables: campaign.description || 'Content as discussed during negotiation',
        payment_terms: '50% upfront, 50% upon completion',
        special_requirements: '',
        influencer_id: outreach.influencer_id,
        brand_id: outreach.brand_id
      };
      
      // 6. Generate contract
      const contract = await contractService.generateContract(contractData);
      
      // 7. Update outreach with contract_id
      const { error: outreachUpdateError } = await supabase
        .from('outreach')
        .update({ 
          contract_id: contract.id,
          status: 'completed'
        })
        .eq('id', outreachId);
        
      if (outreachUpdateError) {
        console.error('Failed to update outreach with contract_id:', outreachUpdateError);
        // Continue execution even if this update fails
      }
      
      // 8. Update campaign with contract_id and change status
      const { error: campaignUpdateError } = await supabase
        .from('campaign')
        .update({ 
          contract_id: contract.id,
          status: 'contract_generated',
          final_price: outreach.agreed_price
        })
        .eq('id', outreach.campaign_id);
        
      if (campaignUpdateError) {
        console.error('Failed to update campaign with contract_id:', campaignUpdateError);
        // Continue execution even if this update fails
      }
      
      return contract.id;
    } catch (error: any) {
      console.error('Contract generation error:', error);
      throw error;
    }
  }
}; 