import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Contract, ContractStatus, ContractTemplate, SignContractRequest } from '../types/contract';
import { generatePDF } from '../utils/pdfGenerator';
import { validateSignatureFile } from '../utils/fileValidation';
import { ContractError, StorageError, handleError } from '../types/errors';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export class ContractController {
    // Generate contract preview
    async previewContract(req: Request, res: Response) {
        try {
            const contractData: ContractTemplate = req.body;
            
            if (!contractData.influencer_name || !contractData.brand_name) {
                throw new ContractError('Missing required contract information');
            }

            // Generate preview PDF without saving
            const pdfBuffer = await generatePDF(contractData);
            
            // Send PDF directly in response
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=contract_preview.pdf');
            res.send(pdfBuffer);
        } catch (error) {
            const { status, message } = handleError(error);
            res.status(status).json({ error: message });
        }
    }

    // Generate a new contract from template
    async generateContract(req: Request, res: Response) {
        try {
            const contractData: ContractTemplate = req.body;
            const { influencer_id, brand_id } = req.body;

            if (!influencer_id || !brand_id) {
                throw new ContractError('Missing influencer_id or brand_id');
            }

            // Generate contract ID
            const contract_id = uuidv4();

            // Generate PDF from template
            const pdfBuffer = await generatePDF(contractData);

            // Upload PDF to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('contracts')
                .upload(`${contract_id}/contract.pdf`, pdfBuffer);

            if (uploadError) {
                throw new StorageError('Failed to upload contract PDF: ' + uploadError.message);
            }

            // Create contract record in database
            const contract: Contract = {
                id: contract_id,
                template_id: 'default',
                influencer_id,
                brand_id,
                status: ContractStatus.PENDING_SIGNATURE,
                contract_data: contractData,
                contract_url: uploadData.path,
                created_at: new Date(),
                updated_at: new Date()
            };

            const { data, error } = await supabase
                .from('contracts')
                .insert(contract)
                .select()
                .single();

            if (error) {
                throw new ContractError('Failed to create contract record: ' + error.message);
            }

            res.status(201).json(data);
        } catch (error) {
            const { status, message } = handleError(error);
            res.status(status).json({ error: message });
        }
    }

    // Sign a contract
    async signContract(req: Request, res: Response) {
        try {
            const { contract_id, signature_file, user_id, mime_type }: SignContractRequest & { mime_type: string } = req.body;

            if (!contract_id || !signature_file || !user_id) {
                throw new ContractError('Missing required signature information');
            }

            // Validate signature file
            validateSignatureFile(signature_file, mime_type);

            // Upload signature to storage
            const { data: signatureData, error: signatureError } = await supabase.storage
                .from('signatures')
                .upload(`${contract_id}/${user_id}.png`, signature_file);

            if (signatureError) {
                throw new StorageError('Failed to upload signature: ' + signatureError.message);
            }

            // Get existing contract
            const { data: contract, error: contractError } = await supabase
                .from('contracts')
                .select()
                .eq('id', contract_id)
                .single();

            if (contractError) {
                throw new ContractError('Failed to fetch contract: ' + contractError.message);
            }

            if (contract.status === ContractStatus.SIGNED) {
                throw new ContractError('Contract has already been signed');
            }

            // Generate final PDF with signature
            const finalPdfBuffer = await generatePDF({
                ...contract.contract_data,
                signature_url: signatureData.path
            });

            // Upload final signed PDF
            const { data: finalPdfData, error: finalPdfError } = await supabase.storage
                .from('contracts')
                .upload(`${contract_id}/signed_contract.pdf`, finalPdfBuffer);

            if (finalPdfError) {
                throw new StorageError('Failed to upload signed contract: ' + finalPdfError.message);
            }

            // Update contract record
            const { data: updatedContract, error: updateError } = await supabase
                .from('contracts')
                .update({
                    status: ContractStatus.SIGNED,
                    signed_by: user_id,
                    signed_at: new Date(),
                    signature_url: signatureData.path,
                    contract_url: finalPdfData.path,
                    updated_at: new Date()
                })
                .eq('id', contract_id)
                .select()
                .single();

            if (updateError) {
                throw new ContractError('Failed to update contract status: ' + updateError.message);
            }

            res.status(200).json(updatedContract);
        } catch (error) {
            const { status, message } = handleError(error);
            res.status(status).json({ error: message });
        }
    }

    // Get contract by ID
    async getContract(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('contracts')
                .select()
                .eq('id', id)
                .single();

            if (error) throw error;

            res.status(200).json(data);
        } catch (error) {
            console.error('Error fetching contract:', error);
            res.status(500).json({ error: 'Failed to fetch contract' });
        }
    }

    // List contracts for a user (either influencer or brand)
    async listContracts(req: Request, res: Response) {
        try {
            const { user_id, role } = req.query;
            const field = role === 'influencer' ? 'influencer_id' : 'brand_id';

            const { data, error } = await supabase
                .from('contracts')
                .select()
                .eq(field, user_id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.status(200).json(data);
        } catch (error) {
            console.error('Error listing contracts:', error);
            res.status(500).json({ error: 'Failed to list contracts' });
        }
    }
} 