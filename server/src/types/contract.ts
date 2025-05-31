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
    signed_at?: Date;
    signature_url?: string;
    contract_url?: string;
    created_at: Date;
    updated_at: Date;
}

export enum ContractStatus {
    DRAFT = 'DRAFT',
    PENDING_SIGNATURE = 'PENDING_SIGNATURE',
    SIGNED = 'SIGNED',
    REJECTED = 'REJECTED'
}

export interface SignContractRequest {
    contract_id: string;
    signature_file: Buffer;
    user_id: string;
    mime_type: string;
} 