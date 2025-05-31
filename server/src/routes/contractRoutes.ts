import { Router } from 'express';
import { ContractController } from '../controllers/contractController';

const router = Router();
const contractController = new ContractController();

// Preview contract without saving
router.post('/preview', contractController.previewContract);

// Generate new contract
router.post('/generate', contractController.generateContract);

// Sign existing contract
router.post('/sign', contractController.signContract);

// Get contract by ID
router.get('/:id', contractController.getContract);

// List contracts
router.get('/', contractController.listContracts);

export default router; 