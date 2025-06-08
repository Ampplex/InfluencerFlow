export interface ContractTemplate {
  influencer_name: string;
  brand_name: string;
  rate: number;
  timeline: string;
  deliverables: string;
  payment_terms: string;
  special_requirements?: string;
}

export interface Contract {
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

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface SignContractRequest {
  contract_id: string;
  signature_file: File;
  user_id: string;
  mime_type: string;
} 