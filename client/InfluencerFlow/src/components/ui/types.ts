
export interface EarlyAccessRequest {
  id?: string;
  name: string;
  email: string;
  brand: string;
  business_help?: string;
  origin_domain: string;
  user_agent?: string;
  ip_address?: string;
  request_fingerprint?: string;
  created_at?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'spam';
  updated_at?: string;
}

export interface BrevoEmailRequest {
  email: string;
  name: string;
  brand: string;
}

export interface BrevoEmailResponse {
  messageId?: string;
  success: boolean;
  error?: string;
}