import express from 'express';
import client from 'prom-client';

const app = express();
const PORT = process.env.PORT || 8081;

client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => {
  console.log(`Outbox Worker metrics server running on http://localhost:${PORT}`);
}); 