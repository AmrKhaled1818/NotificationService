const express = require('express');
const bodyParser = require('body-parser');
const notifyRoute = require('./routes/notify');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());

// Route: /notify
app.use('/notify', notifyRoute);

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'Notification API Running' });
});

app.listen(PORT, () => {
  console.log(`API Service running on http://localhost:${PORT}`);
});
