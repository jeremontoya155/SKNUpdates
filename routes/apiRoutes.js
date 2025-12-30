const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// LOGIN
router.post('/mobile/login', apiController.login);

// TICKETS
router.get('/mobile/tickets', apiController.getTickets);
router.get('/mobile/tickets/:id', apiController.getTicketDetalle);
router.put('/mobile/tickets/:id/estado', apiController.cambiarEstado);

module.exports = router;
