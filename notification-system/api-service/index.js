import './common/config/validateEnv.js';
import express from 'express';
import notifyRoute from './routes/notify.js';
import dlqAdminRoute from './routes/dlq-admin.js';
import webhookTestRoute from './routes/webhook-test.js';
import client from 'prom-client';
import { getDLQStats } from './common/dlq-service.js';
import env from './common/config/validateEnv.js';


const app = express();
const PORT = process.env.PORT || 8080;

client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.use(express.json());

// Route: /notify
app.use('/notify', notifyRoute);

// GET /notify - Information about the notification endpoint
app.get('/notify', (req, res) => {
  res.json({
    message: 'Notification API Endpoint',
    description: 'Use POST /notify to send notifications',
    method: 'POST',
    contentType: 'application/json',
    example: {
      recipient: 'user@example.com',
      channel: 'EMAIL',
      message: 'Your notification message'
    },
    channels: ['EMAIL', 'SMS'],
    status: 'active'
  });
});

// Route: /admin/dlq - Dead Letter Queue management
app.use('/admin/dlq', dlqAdminRoute);

// Route: /webhook - Webhook testing endpoints
app.use('/webhook', webhookTestRoute);

// Simple test endpoint for DLQ
app.get('/test-dlq', async (req, res) => {
  try {
    const stats = await getDLQStats();
    res.json({
      success: true,
      message: 'DLQ service is working!',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'DLQ service error',
      message: error.message
    });
  }
});

// Simple DLQ stats endpoint
app.get('/admin/dlq/stats', async (req, res) => {
  try {
    const stats = await getDLQStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching DLQ stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DLQ statistics',
      message: error.message
    });
  }
});

// Simple DLQ dashboard endpoint
app.get('/admin/dlq/dashboard', async (req, res) => {
  try {
    const stats = await getDLQStats();
    const dashboard = {
      statistics: stats,
      summary: {
        totalFailed: stats.find(s => s.status === 'FAILED')?.count || 0,
        totalRetrying: stats.find(s => s.status === 'RETRYING')?.count || 0,
        totalResolved: stats.find(s => s.status === 'RESOLVED')?.count || 0
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error generating DLQ dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate DLQ dashboard',
      message: error.message
    });
  }
});

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'Notification API Running' });
});

app.listen(PORT, () => {
  console.log(`API Service running on http://localhost:${PORT}`);
  console.log(`DLQ Admin available at http://localhost:${PORT}/admin/dlq/dashboard`);
});
