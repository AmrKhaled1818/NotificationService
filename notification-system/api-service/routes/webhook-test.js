import express from 'express';

const router = express.Router();

// Store received webhooks for testing
let receivedWebhooks = [];

// Test webhook endpoint to receive alerts
router.post('/test-webhook', (req, res) => {
  const webhookData = {
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: req.headers
  };
  
  receivedWebhooks.push(webhookData);
  
  console.log('🔔 Test webhook received:', JSON.stringify(webhookData, null, 2));
  
  res.status(200).json({ 
    success: true, 
    message: 'Webhook received',
    receivedAt: webhookData.timestamp
  });
});

// Get all received webhooks
router.get('/test-webhook', (req, res) => {
  res.json({
    success: true,
    count: receivedWebhooks.length,
    webhooks: receivedWebhooks
  });
});

// Clear received webhooks
router.delete('/test-webhook', (req, res) => {
  receivedWebhooks = [];
  res.json({
    success: true,
    message: 'Webhooks cleared'
  });
});

export default router; 