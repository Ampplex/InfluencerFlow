const { Router } = require('express');
const UserController = require('../controllers/user');

const router = Router();
const userController = new UserController();

// WhatsApp webhook verification (GET)
router.get('/webhook', (req, res) => { userController.verifyWebhook(req, res) });
// WhatsApp webhook handler (POST)
router.post('/webhook', (req, res) => { userController.handleWebhook(req, res) });

module.exports = router;
