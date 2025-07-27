import { Kafka } from 'kafkajs';
import pg from 'pg';
import client from 'prom-client';
import { sendToDLQ, storeDLQRecord } from '../common/dlq-service.js';
import env from '../common/config/validateEnv.js';

// Prometheus metrics
const processedMessagesCounter = new client.Counter({
  name: 'notification_messages_processed_total',
  help: 'Total number of notification messages processed',
  labelNames: ['status'] // success, failed, retried
});

const dlqMessagesCounter = new client.Counter({
  name: 'notification_dlq_messages_total',
  help: 'Total number of messages sent to DLQ',
  labelNames: ['error_type']
});

const retryAttemptsCounter = new client.Counter({
  name: 'notification_retry_attempts_total',
  help: 'Total number of retry attempts',
  labelNames: ['attempt_number']
});

const processingDurationHistogram = new client.Histogram({
  name: 'notification_processing_duration_seconds',
  help: 'Duration of notification processing',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

console.log('🔧 Environment configuration:', {
  KAFKA_CLIENT_ID: env.KAFKA_CLIENT_ID,
  KAFKA_BROKER: env.KAFKA_BROKER,
  DB_HOST: env.DB_HOST,
  DB_PORT: env.DB_PORT
});

const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: [env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });
const producer = kafka.producer();

// PostgreSQL setup for DLQ tracking
const pool = new pg.Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASS,
  port: parseInt(env.DB_PORT),
});

// Configuration
const CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
  DLQ_TOPIC: 'notification-dlq',
  MAIN_TOPIC: 'notification-topic'
};

// Simulate notification processing (can fail)
async function processNotification(payload) {
  const endTimer = processingDurationHistogram.startTimer();
  
  try {
    console.log(`🔄 Processing notification for ${payload.recipient} via ${payload.channel}`);
    
    // Simulate random failures for demonstration
    // if (Math.random() < 0.3) { // 30% failure rate for testing
    //   throw new Error('Simulated processing failure');
    // }
    
    // Here you would integrate real SMS/email logic
    console.log(`✅ Successfully processed notification for ${payload.recipient}`);
    processedMessagesCounter.inc({ status: 'success' });
    return true;
  } catch (error) {
    processedMessagesCounter.inc({ status: 'failed' });
    throw error;
  } finally {
    endTimer();
  }
}

async function startConsumer() {
  await consumer.connect();
  await producer.connect();
  console.log('✅ Kafka consumer and producer connected');

  await consumer.subscribe({ topic: CONFIG.MAIN_TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value.toString();
      let payload;
      let retryCount = 0;

      try {
        payload = JSON.parse(value);
        
        // Check if this is a retry from headers
        if (message.headers && message.headers['retry-count']) {
          retryCount = parseInt(message.headers['retry-count'].toString());
        }

        console.log(`📥 Received message on ${topic} (attempt ${retryCount + 1}):`);
        console.log(`→ Recipient: ${payload.recipient}`);
        console.log(`→ Channel: ${payload.channel}`);
        console.log(`→ Message: ${payload.message}`);

        // Attempt to process the notification
        await processNotification(payload);
        
      } catch (error) {
        console.error(`❌ Failed to process message: ${error.message}`);
        
        retryCount++;
        retryAttemptsCounter.inc({ attempt_number: retryCount.toString() });
        
        if (retryCount < CONFIG.MAX_RETRY_ATTEMPTS) {
          // Retry the message
          console.log(`🔄 Retrying message (attempt ${retryCount + 1}/${CONFIG.MAX_RETRY_ATTEMPTS})`);
          processedMessagesCounter.inc({ status: 'retried' });
          
          setTimeout(async () => {
            await producer.send({
              topic: CONFIG.MAIN_TOPIC,
              messages: [{
                key: message.key,
                value: message.value,
                headers: {
                  'retry-count': retryCount.toString(),
                  'original-timestamp': payload.timestamp || new Date().toISOString()
                }
              }]
            });
          }, CONFIG.RETRY_DELAY_MS);
          
        } else {
          // Max retries exceeded, send to DLQ
          console.log(`💀 Max retries exceeded for message. Sending to DLQ...`);
          
          try {
            await sendToDLQ(message, error, retryCount, producer);
            await storeDLQRecord(message, error, retryCount);
            
            // Update metrics
            dlqMessagesCounter.inc({ error_type: error.message.replace(/[^a-zA-Z0-9]/g, '_') });
          } catch (dlqError) {
            console.error(`❌ Failed to send message to DLQ: ${dlqError.message}`);
          }
        }
      }
    },
  });
}

startConsumer().catch(console.error);

process.on('SIGINT', async () => {
  await consumer.disconnect();
  await producer.disconnect();
  await pool.end();
  console.log("👋 Kafka consumer, producer, and DB pool disconnected");
  process.exit(0);
});
