const express = require('express');
const router = express.Router();
const paymentGatewayController = require('../controllers/paymentGatewayController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get available payment methods
router.get('/methods', paymentGatewayController.getPaymentMethods);

// Razorpay routes
router.post('/razorpay/create-order', authenticateToken, paymentGatewayController.createRazorpayOrder);
router.post('/razorpay/verify-payment', authenticateToken, paymentGatewayController.verifyRazorpayPayment);
router.post('/razorpay/webhook', paymentGatewayController.handleRazorpayWebhook);

// Stripe routes
router.post('/stripe/create-payment-intent', authenticateToken, paymentGatewayController.createStripePaymentIntent);
router.post('/stripe/confirm-payment', authenticateToken, paymentGatewayController.confirmStripePayment);
router.post('/stripe/webhook', paymentGatewayController.handleStripeWebhook);

module.exports = router;