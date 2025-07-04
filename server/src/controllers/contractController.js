const { createClient } = require('@supabase/supabase-js');
const { generatePDF } = require('../utils/pdfGenerator');
const { validateSignatureFile } = require('../utils/fileValidation');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const supabase = createClient(
    process.env.SUPABASE_URL || "https://eepxrnqcefpvzxqkpjaw.supabase.co",
    process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzIzNDgsImV4cCI6MjA2NDIwODM0OH0.zTsgRk2c8zdO0SnQBI9CicH_NodH_C9duSdbwojAKBQ"
);

module.exports = class ContractController {
    // Generate contract preview
    async previewContract(req, res) {
        try {
            const contractData = req.body;

            if (!contractData.influencer_name || !contractData.brand_name) {
                throw new Error('Missing required contract information');
            }

            // Generate preview PDF without saving
            const pdfBuffer = await generatePDF(contractData);

            // Send PDF directly in response
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=contract_preview.pdf');
            res.send(pdfBuffer);
        } catch (error) {
            res.status(500).json({ error: error.message || 'Unknown error' });
        }
    }

    // Generate a new contract from template
    async generateContract(req, res) {
        try {
            const templateData = req.body;
            const { influencer_id, brand_id } = req.body;
            const authHeader = req.headers.authorization;

            if (!influencer_id || !brand_id) {
                throw new Error('Missing influencer_id or brand_id');
            }

            if (!authHeader) {
                throw new Error('No authorization header');
            }

            // Generate contract ID
            const contract_id = uuidv4();

            // Generate PDF from template
            const pdfBuffer = await generatePDF(templateData);

            // Create contract record in database first
            const contract = {
                id: contract_id,
                template_id: 'default',
                influencer_id,
                brand_id,
                status: 'PENDING_SIGNATURE',
                contract_data: templateData,
                contract_url: '', // Will update after upload
                created_at: new Date(),
                updated_at: new Date()
            };

            const { data: newContract, error: contractError } = await supabase
                .from('contracts')
                .insert(contract)
                .select()
                .single();

            if (contractError) {
                console.error('Database insert error:', contractError);
                throw new Error('Failed to create contract record: ' + contractError.message);
            }

            // Now upload PDF to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('contracts')
                .upload(`${contract_id}.pdf`, pdfBuffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                // Delete the contract record if file upload fails
                await supabase
                    .from('contracts')
                    .delete()
                    .eq('id', contract_id);
                throw new Error('Failed to upload contract PDF: ' + uploadError.message);
            }

            // Get the public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('contracts')
                .getPublicUrl(`${contract_id}.pdf`);

            // Update contract with file URL
            const { data: updatedContract, error: updateError } = await supabase
                .from('contracts')
                .update({ contract_url: publicUrl })
                .eq('id', contract_id)
                .select()
                .single();

            if (updateError) {
                console.error('Contract update error:', updateError);
                throw new Error('Failed to update contract with file URL: ' + updateError.message);
            }

            res.status(201).json(updatedContract);
        } catch (error) {
            res.status(500).json({ error: error.message || 'Unknown error' });
        }
    }

    // Updated signContract method in ContractController
    async signContract(req, res) {
        try {
            console.log('Request body:', req.body);
            console.log('Request file:', req.file);
            console.log('Request content-type:', req.get('content-type'));

            // Extract data from multer-parsed request
            const { contract_id, user_id } = req.body;
            const authHeader = req.headers.authorization;

            // Validation
            if (!contract_id || !user_id) {
                throw new Error('Missing required signature information: contract_id or user_id');
            }

            if (!req.file) {
                throw new Error('Missing signature file');
            }

            if (!authHeader) {
                throw new Error('No authorization header');
            }

            const signature_file = req.file.buffer;
            const mime_type = req.file.mimetype;

            // Validate signature file
            validateSignatureFile(signature_file, mime_type);

            // Upload signature to storage
            const { data: signatureData, error: signatureError } = await supabase.storage
                .from('signatures')
                .upload(`${contract_id}_${user_id}.png`, signature_file, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (signatureError) {
                console.error('Signature upload error:', signatureError);
                throw new Error('Failed to upload signature: ' + signatureError.message);
            }

            // Get the public URL for the signature
            const { data: { publicUrl: signatureUrl } } = supabase.storage
                .from('signatures')
                .getPublicUrl(`${contract_id}_${user_id}.png`);

            // Get existing contract
            const { data: contract, error: contractError } = await supabase
                .from('contracts')
                .select()
                .eq('id', contract_id)
                .single();

            if (contractError) {
                throw new Error('Failed to fetch contract: ' + contractError.message);
            }

            if (contract.status === 'SIGNED') {
                throw new Error('Contract has already been signed');
            }

            let finalPdfBuffer;
            try {
                finalPdfBuffer = await generatePDF({
                    ...contract.contract_data,
                    signature_url: signatureUrl,
                    signature_buffer: signature_file
                });
                console.log('Sign Contract - Final PDF buffer generated. Length:', finalPdfBuffer.length);
            } catch (pdfGenErr) {
                console.error('Error generating final PDF: Name:', pdfGenErr.name, 'Message:', pdfGenErr.message, 'Stack:', pdfGenErr.stack);
                throw new Error('Failed to generate final PDF: ' + pdfGenErr.message);
            }

            // Upload final signed PDF
            const { data: finalPdfData, error: finalPdfError } = await supabase.storage
                .from('contracts')
                .upload(`${contract_id}_signed.pdf`, finalPdfBuffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (finalPdfError) {
                console.error('Final PDF upload error:', finalPdfError);
                throw new Error('Failed to upload signed contract: ' + finalPdfError.message);
            }

            // Get the public URL for the signed PDF
            const { data: { publicUrl: signedPdfUrl } } = supabase.storage
                .from('contracts')
                .getPublicUrl(`${contract_id}_signed.pdf`);

            // Update contract record
            const { data: updatedContract, error: updateError } = await supabase
                .from('contracts')
                .update({
                    status: 'SIGNED',
                    signed_by: user_id,
                    signed_at: new Date().toISOString(),
                    signature_url: signatureUrl,
                    contract_url: signedPdfUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contract_id)
                .select()
                .single();

            if (updateError) {
                console.error('Contract update error:', updateError);
                throw new Error('Failed to update contract status: ' + updateError.message);
            }

            res.status(200).json(updatedContract);
        } catch (error) {
            res.status(500).json({ error: error.message || 'Unknown error' });
        }
    }

    // Get contract by ID
    async getContract(req, res) {
        try {
            const { id } = req.params;
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                throw new Error('No authorization header');
            }

            // Set auth context for Supabase client
            const supabaseWithAuth = supabase.auth.setSession({
                access_token: authHeader.replace('Bearer ', ''),
                refresh_token: ''
            });

            const { data, error } = await supabase
                .from('contracts')
                .select()
                .eq('id', id)
                .single();

            if (error) {
                console.error('Contract fetch error:', error);
                throw error;
            }

            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message || 'Unknown error' });
        }
    }

    // List contracts for a user (either influencer or brand)
    async listContracts(req, res) {
        try {
            const { user_id, role } = req.query;
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                throw new Error('No authorization header');
            }

            // Set auth context for Supabase client
            const supabaseWithAuth = supabase.auth.setSession({
                access_token: authHeader.replace('Bearer ', ''),
                refresh_token: ''
            });

            const field = role === 'influencer' ? 'influencer_id' : 'brand_id';

            const { data, error } = await supabase
                .from('contracts')
                .select()
                .eq(field, user_id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Contracts list error:', error);
                throw error;
            }

            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message || 'Unknown error' });
        }
    }
} 