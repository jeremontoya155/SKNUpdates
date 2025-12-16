const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const { isAuthenticated } = require('./middleware');

// Rutas del checklist
router.get('/:ticketId', isAuthenticated, checklistController.verChecklist);
router.post('/:ticketId', isAuthenticated, checklistController.guardarChecklist);

module.exports = router;
