import express from 'express';
import notifyRoute from './routes/notify.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Route: /notify
app.use('/notify', notifyRoute);

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'Notification API Running' });
});

app.listen(PORT, () => {
  console.log(`API Service running on http://localhost:${PORT}`);
});
