import { Kafka } from 'kafkajs';
import env from '../common/config/validateEnv.js';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch'; // Not needed in Node 18+, safe fallback

const kafka = new Kafka({
  clientId: 'dead-letter-consumer',
  brokers: [env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'dlq-consumer-group' });

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT),
  secure: env.SMTP_SECURE === 'true',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const run = async () => {
  await consumer.connect();
  console.log('🧾 DLQ Consumer connected');

  await consumer.subscribe({ topic: 'notification-dead-letter', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payload = JSON.parse(message.value.toString());
      console.log('💥 Received message from DLQ:', payload);

      const mailOptions = {
        from: env.SMTP_FROM,
        to: payload.recipient,
        subject: '[RETRY] Notification Failed Previously',
        text: payload.message,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Retry email sent to ${mailOptions.to}`);
      } catch (error) {
        console.error('❌ Failed to resend email from DLQ:', error.message);

        try {
          await fetch(env.NOTIFICATION_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 Email delivery failed from DLQ!\nTo: ${mailOptions.to}\nError: ${error.message}`,
            }),
          });
          console.log('📡 DLQ alert sent to Slack/Discord');
        } catch (webhookError) {
          console.error('⚠️ Failed to send webhook alert:', webhookError.message);
        }
      }
    },
  });
};

run().catch(console.error);
