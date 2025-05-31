import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ContractController } from '../controllers/contractController';
import { Request, Response } from 'express';
import { ContractStatus } from '../types/contract';

type MockResponse = {
    data: { id: string; path?: string };
    error: null;
};

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        storage: {
            upload: jest.fn().mockImplementation(() => Promise.resolve({ data: { path: 'test/path' }, error: null })),
            from: jest.fn().mockReturnThis(),
        },
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => Promise.resolve({ 
            data: { id: 'test-id' }, 
            error: null 
        })),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
    })),
}));

describe('ContractController', () => {
    let contractController: ContractController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        contractController = new ContractController();
        mockResponse = {
            status: jest.fn().mockReturnThis() as unknown as Response['status'],
            json: jest.fn() as unknown as Response['json'],
        };
    });

    describe('generateContract', () => {
        it('should generate a new contract successfully', async () => {
            mockRequest = {
                body: {
                    influencer_name: 'Test Influencer',
                    brand_name: 'Test Brand',
                    rate: 1000,
                    timeline: '30 days',
                    deliverables: 'Instagram post',
                    payment_terms: 'Net 30',
                    influencer_id: 'inf-123',
                    brand_id: 'brand-123'
                }
            };

            await contractController.generateContract(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String)
                })
            );
        });

        it('should handle errors during contract generation', async () => {
            mockRequest = {
                body: {} // Invalid request body
            };

            await contractController.generateContract(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            );
        });
    });

    describe('signContract', () => {
        it('should sign a contract successfully', async () => {
            mockRequest = {
                body: {
                    contract_id: 'test-contract',
                    signature_file: Buffer.from('test-signature'),
                    user_id: 'test-user'
                }
            };

            await contractController.signContract(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String)
                })
            );
        });

        it('should handle errors during contract signing', async () => {
            mockRequest = {
                body: {} // Invalid request body
            };

            await contractController.signContract(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            );
        });
    });

    describe('getContract', () => {
        it('should get a contract by ID successfully', async () => {
            mockRequest = {
                params: {
                    id: 'test-contract'
                }
            };

            await contractController.getContract(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String)
                })
            );
        });
    });

    describe('listContracts', () => {
        it('should list contracts for an influencer', async () => {
            mockRequest = {
                query: {
                    user_id: 'test-influencer',
                    role: 'influencer'
                }
            };

            await contractController.listContracts(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalled();
        });

        it('should list contracts for a brand', async () => {
            mockRequest = {
                query: {
                    user_id: 'test-brand',
                    role: 'brand'
                }
            };

            await contractController.listContracts(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalled();
        });
    });
}); 