import { Kafka } from 'kafkajs';
import pg from 'pg';

// PostgreSQL setup
const pool = new pg.Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'testdb',
  password: 'pass',
  port: 5432,
});

// Configuration
const CONFIG = {
  DLQ_TOPIC: 'notification-dlq',
  MAIN_TOPIC: 'notification-topic',
  AUTO_RETRY_DELAY_HOURS: 24, // Auto retry after 24 hours
};

// Update DLQ record status
async function updateDLQStatus(messageKey, status, retryAt = null) {
  const client = await pool.connect();
  try {
    const updateQuery = retryAt 
      ? 'UPDATE dlq_messages SET status = $1, retry_at = $2, updated_at = CURRENT_TIMESTAMP WHERE message_key = $3'
      : 'UPDATE dlq_messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE message_key = $2';
    
    const params = retryAt 
      ? [status, retryAt, messageKey]
      : [status, messageKey];
    
    await client.query(updateQuery, params);
  } finally {
    client.release();
  }
}

// Manual retry function (can be called from admin endpoint)
export async function manualRetryMessage(messageKey) {
  const client = await pool.connect();
  try {
    // Get the message from DLQ
    const result = await client.query(
      'SELECT * FROM dlq_messages WHERE message_key = $1 AND status = $2',
      [messageKey, 'FAILED']
    );

    if (result.rows.length === 0) {
      throw new Error('Message not found in DLQ or already processed');
    }

    const dlqRecord = result.rows[0];
    const originalPayload = dlqRecord.original_payload;

    // Create Kafka producer for retry
    const kafka = new Kafka({
      clientId: 'dlq-admin',
      brokers: ['kafka:9092'],
    });
    const producer = kafka.producer();
    await producer.connect();

    // Send back to main topic
    await producer.send({
      topic: CONFIG.MAIN_TOPIC,
      messages: [{
        key: messageKey,
        value: JSON.stringify(originalPayload),
        headers: {
          'retry-count': '0',
          'dlq-retry': 'true',
          'manual-retry': 'true'
        }
      }]
    });

    await producer.disconnect();

    // Update status
    await updateDLQStatus(messageKey, 'RETRYING');
    console.log(`✅ Manually retried message ${messageKey}`);
    
    return { success: true, messageKey };
    
  } finally {
    client.release();
  }
}

// Get DLQ statistics
export async function getDLQStats() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        status,
        COUNT(*) as count,
        MIN(failed_at) as oldest_failure,
        MAX(failed_at) as newest_failure
      FROM dlq_messages 
      GROUP BY status
    `);

    return result.rows;
  } finally {
    client.release();
  }
}

// Get DLQ messages with pagination
export async function getDLQMessages(page = 1, limit = 50, status = null) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT id, message_key, original_payload, error_message, 
             retry_count, failed_at, status, retry_at, resolved_at
      FROM dlq_messages
    `;
    let params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ` ORDER BY failed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Store DLQ record in database
export async function storeDLQRecord(message, error, retryCount) {
  const client = await pool.connect();
  try {
    const originalPayload = JSON.parse(message.value.toString());
    await client.query(`
      INSERT INTO dlq_messages 
      (message_key, original_payload, error_message, retry_count, failed_at, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      message.key?.toString() || null,
      JSON.stringify(originalPayload),
      error.message,
      retryCount,
      new Date(),
      'FAILED'
    ]);
  } finally {
    client.release();
  }
}

// Send message to dead letter queue
export async function sendToDLQ(originalMessage, error, retryCount, producer) {
  const dlqPayload = {
    originalMessage: JSON.parse(originalMessage.value.toString()),
    error: error.message,
    retryCount: retryCount,
    failedAt: new Date().toISOString(),
    originalTopic: originalMessage.topic,
    originalPartition: originalMessage.partition,
    originalOffset: originalMessage.offset
  };

  await producer.send({
    topic: CONFIG.DLQ_TOPIC,
    messages: [{
      key: originalMessage.key,
      value: JSON.stringify(dlqPayload),
      headers: {
        'error-reason': error.message,
        'retry-count': retryCount.toString(),
        'original-topic': originalMessage.topic
      }
    }]
  });

  console.log(`💀 Message sent to DLQ after ${retryCount} attempts. Error: ${error.message}`);
}

// Check if message should be auto-retried
export function shouldAutoRetry(dlqPayload) {
  const failedAt = new Date(dlqPayload.failedAt);
  const now = new Date();
  const hoursSinceFailed = (now - failedAt) / (1000 * 60 * 60);
  
  return hoursSinceFailed >= CONFIG.AUTO_RETRY_DELAY_HOURS && dlqPayload.retryCount <= 5;
}

// Retry a message by sending it back to the main topic
export async function retryMessage(dlqPayload, messageKey, producer) {
  console.log(`🔄 Retrying message for recipient: ${dlqPayload.originalMessage.recipient}`);
  
  try {
    await producer.send({
      topic: CONFIG.MAIN_TOPIC,
      messages: [{
        key: messageKey,
        value: JSON.stringify(dlqPayload.originalMessage),
        headers: {
          'retry-count': '0', // Reset retry count for DLQ retry
          'dlq-retry': 'true',
          'original-error': dlqPayload.error
        }
      }]
    });

    // Update DLQ record
    await updateDLQStatus(messageKey, 'RETRYING');
    console.log(`✅ Message ${messageKey} sent back to main topic for retry`);
    
  } catch (error) {
    console.error(`❌ Failed to retry message ${messageKey}: ${error.message}`);
    throw error;
  }
} 