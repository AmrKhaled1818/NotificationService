import express from 'express';
import notifyRoute from './routes/notify.js';
import client from 'prom-client';

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

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'Notification API Running' });
});

app.listen(PORT, () => {
  console.log(`API Service running on http://localhost:${PORT}`);
});
