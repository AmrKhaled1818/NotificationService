// common/utils/notifier.js
import axios from 'axios';

const WEBHOOK_URL = process.env.WEBHOOK_URL; // set in your .env

export async function notifyEmailFailure(errorDetails) {
  if (!WEBHOOK_URL) return;

  const message = {
    username: 'Notification Service',
    content: `🚨 Email failure occurred:\n\n**Error:** ${errorDetails.message}\n**To:** ${errorDetails.to}`,
  };

  try {
    await axios.post(WEBHOOK_URL, message);
    console.log('Webhook alert sent.');
  } catch (err) {
    console.error('Failed to send webhook alert:', err.message);
  }
}
