import { Router } from 'express';

const router = Router();

// Preview contract without saving
router.post('/add_campaign', contractController.previewContract);

export default router; 