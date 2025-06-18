const { Router } = require('express');
const multer = require('multer');
const ContractController = require('../controllers/contractController');

const router = Router();
const contractController = new ContractController();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Preview contract without saving
router.post('/preview', contractController.previewContract);

// Generate new contract
router.post('/generate', contractController.generateContract);

// Sign existing contract - ADD MULTER MIDDLEWARE HERE
router.post('/sign', upload.single('signature_file'), contractController.signContract);

// Get contract by ID
router.get('/:id', contractController.getContract);

// List contracts
router.get('/', contractController.listContracts);

module.exports = router;