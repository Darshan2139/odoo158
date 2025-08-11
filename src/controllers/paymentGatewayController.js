const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const RentalOrder = require('../models/RentalOrder');

// Initialize Stripe only if secret key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Initialize Razorpay only if credentials are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const paymentGatewayController = {
  // Create Razorpay order
  createRazorpayOrder: async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(400).json({
          success: false,
          message: 'Razorpay is not configured'
        });
      }

      const { invoice_id, amount, currency = 'INR' } = req.body;

      // Verify invoice exists
      const invoice = await Invoice.findByPk(invoice_id, {
        include: [
          {
            model: RentalOrder,
            as: 'order',
            attributes: ['order_id', 'customer_id']
          }
        ]
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency,
        receipt: `invoice_${invoice_id}_${Date.now()}`,
        notes: {
          invoice_id: invoice_id,
          customer_id: invoice.order.customer_id
        }
      });

      res.json({
        success: true,
        data: {
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key_id: process.env.RAZORPAY_KEY_ID
        }
      });
    } catch (error) {
      console.error('Create Razorpay order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Razorpay order',
        error: error.message
      });
    }
  },

  // Verify Razorpay payment
  verifyRazorpayPayment: async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        invoice_id 
      } = req.body;

      // Verify signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Get payment details from Razorpay
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

      // Create payment record
      const payment = await Payment.create({
        invoice_id: invoice_id,
        payment_amount: paymentDetails.amount / 100, // Convert from paise
        method: 'razorpay',
        transaction_id: razorpay_payment_id,
        status: paymentDetails.status === 'captured' ? 'success' : 'pending',
        payment_date: new Date(),
        gateway_response: JSON.stringify(paymentDetails)
      });

      // Update invoice status if payment successful
      if (paymentDetails.status === 'captured') {
        await Invoice.update(
          { payment_status: 'paid' },
          { where: { invoice_id: invoice_id } }
        );
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          payment_id: payment.payment_id,
          status: payment.status,
          amount: payment.payment_amount
        }
      });
    } catch (error) {
      console.error('Verify Razorpay payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: error.message
      });
    }
  },

  // Create Stripe payment intent
  createStripePaymentIntent: async (req, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({
          success: false,
          message: 'Stripe is not configured'
        });
      }

      const { invoice_id, amount, currency = 'inr' } = req.body;

      // Verify invoice exists
      const invoice = await Invoice.findByPk(invoice_id, {
        include: [
          {
            model: RentalOrder,
            as: 'order',
            include: [
              {
                model: require('../models/User'),
                as: 'customer',
                attributes: ['email', 'full_name']
              }
            ]
          }
        ]
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to smallest currency unit
        currency: currency,
        metadata: {
          invoice_id: invoice_id,
          customer_id: invoice.order.customer_id
        },
        receipt_email: invoice.order.customer.email
      });

      res.json({
        success: true,
        data: {
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id
        }
      });
    } catch (error) {
      console.error('Create Stripe payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment intent',
        error: error.message
      });
    }
  },

  // Confirm Stripe payment
  confirmStripePayment: async (req, res) => {
    try {
      const { payment_intent_id, invoice_id } = req.body;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

      // Create payment record
      const payment = await Payment.create({
        invoice_id: invoice_id,
        payment_amount: paymentIntent.amount / 100,
        method: 'stripe',
        transaction_id: payment_intent_id,
        status: paymentIntent.status === 'succeeded' ? 'success' : 'pending',
        payment_date: new Date(),
        gateway_response: JSON.stringify(paymentIntent)
      });

      // Update invoice status if payment successful
      if (paymentIntent.status === 'succeeded') {
        await Invoice.update(
          { payment_status: 'paid' },
          { where: { invoice_id: invoice_id } }
        );
      }

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          payment_id: payment.payment_id,
          status: payment.status,
          amount: payment.payment_amount
        }
      });
    } catch (error) {
      console.error('Confirm Stripe payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm payment',
        error: error.message
      });
    }
  },

  // Get payment methods
  getPaymentMethods: async (req, res) => {
    try {
      const paymentMethods = [
        {
          id: 'razorpay',
          name: 'Razorpay',
          description: 'Pay with cards, UPI, wallets, and net banking',
          enabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
          currencies: ['INR']
        },
        {
          id: 'stripe',
          name: 'Stripe',
          description: 'Pay with credit/debit cards',
          enabled: !!process.env.STRIPE_SECRET_KEY,
          currencies: ['USD', 'EUR', 'INR', 'GBP']
        }
      ];

      res.json({
        success: true,
        data: {
          payment_methods: paymentMethods.filter(method => method.enabled)
        }
      });
    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment methods',
        error: error.message
      });
    }
  },

  // Webhook handler for Razorpay
  handleRazorpayWebhook: async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const body = JSON.stringify(req.body);

      // Verify webhook signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      const event = req.body;

      // Handle different event types
      switch (event.event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity);
          break;
        default:
          console.log(`Unhandled Razorpay event: ${event.event}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Razorpay webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  },

  // Webhook handler for Stripe
  handleStripeWebhook: async (req, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({
          success: false,
          message: 'Stripe is not configured'
        });
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  },

  // Helper methods
  handlePaymentCaptured: async (paymentData) => {
    try {
      const payment = await Payment.findOne({
        where: { transaction_id: paymentData.id }
      });

      if (payment) {
        await payment.update({
          status: 'success',
          gateway_response: JSON.stringify(paymentData)
        });

        // Update invoice status
        await Invoice.update(
          { payment_status: 'paid' },
          { where: { invoice_id: payment.invoice_id } }
        );
      }
    } catch (error) {
      console.error('Handle payment captured error:', error);
    }
  },

  handlePaymentFailed: async (paymentData) => {
    try {
      const payment = await Payment.findOne({
        where: { transaction_id: paymentData.id }
      });

      if (payment) {
        await payment.update({
          status: 'failed',
          gateway_response: JSON.stringify(paymentData)
        });
      }
    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  },

  handleStripePaymentSucceeded: async (paymentIntent) => {
    try {
      const payment = await Payment.findOne({
        where: { transaction_id: paymentIntent.id }
      });

      if (payment) {
        await payment.update({
          status: 'success',
          gateway_response: JSON.stringify(paymentIntent)
        });

        // Update invoice status
        await Invoice.update(
          { payment_status: 'paid' },
          { where: { invoice_id: payment.invoice_id } }
        );
      }
    } catch (error) {
      console.error('Handle Stripe payment succeeded error:', error);
    }
  },

  handleStripePaymentFailed: async (paymentIntent) => {
    try {
      const payment = await Payment.findOne({
        where: { transaction_id: paymentIntent.id }
      });

      if (payment) {
        await payment.update({
          status: 'failed',
          gateway_response: JSON.stringify(paymentIntent)
        });
      }
    } catch (error) {
      console.error('Handle Stripe payment failed error:', error);
    }
  }
};

module.exports = paymentGatewayController;