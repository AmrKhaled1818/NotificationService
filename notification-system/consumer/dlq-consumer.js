import { Kafka } from 'kafkajs';
import pg from 'pg';
import { shouldAutoRetry, retryMessage } from '../common/dlq-service.js';
import env from '../common/config/validateEnv.js';

const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: [env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'dlq-group' });
const producer = kafka.producer();

// PostgreSQL setup
const pool = new pg.Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASS,
  port: parseInt(env.DB_PORT),
});

// Configuration
const CONFIG = {
  DLQ_TOPIC: 'notification-dlq',
  MAIN_TOPIC: 'notification-topic',
  AUTO_RETRY_DELAY_HOURS: 24, // Auto retry after 24 hours
};

// Process DLQ messages
async function processDLQMessage(dlqPayload, messageKey) {
  console.log(`📥 Processing DLQ message:`);
  console.log(`→ Original Recipient: ${dlqPayload.originalMessage.recipient}`);
  console.log(`→ Failed At: ${dlqPayload.failedAt}`);
  console.log(`→ Error: ${dlqPayload.error}`);
  console.log(`→ Retry Count: ${dlqPayload.retryCount}`);

  // Check if this message should be auto-retried
  if (shouldAutoRetry(dlqPayload)) {
    console.log(`🕐 Auto-retrying message after ${CONFIG.AUTO_RETRY_DELAY_HOURS} hours delay`);
    await retryMessage(dlqPayload, messageKey, producer);
  } else {
    console.log(`⏸️ Message not eligible for auto-retry. Keeping in DLQ for manual review.`);
    // Could implement additional logic here like alerting, reporting, etc.
  }
}

async function startDLQConsumer() {
  await consumer.connect();
  await producer.connect();
  console.log('✅ DLQ Consumer and producer connected');

  await consumer.subscribe({ topic: CONFIG.DLQ_TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value.toString();
        const dlqPayload = JSON.parse(value);
        const messageKey = message.key?.toString();

        await processDLQMessage(dlqPayload, messageKey);
        
      } catch (error) {
        console.error(`❌ Failed to process DLQ message: ${error.message}`);
        // DLQ messages that fail processing could be logged or sent to a secondary DLQ
      }
    },
  });
}

// Only start consumer if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startDLQConsumer().catch(console.error);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await consumer.disconnect();
    await producer.disconnect();
    await pool.end();
    console.log("👋 DLQ Consumer, producer, and DB pool disconnected");
    process.exit(0);
  });
} 