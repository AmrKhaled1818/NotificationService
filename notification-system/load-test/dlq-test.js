#!/usr/bin/env node

import { Kafka } from 'kafkajs';
import pg from 'pg';

const kafka = new Kafka({
  clientId: 'dlq-test',
  brokers: ['localhost:9092'], // Use localhost for host-based testing
});

const producer = kafka.producer();

// PostgreSQL setup
const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost', // Use localhost for testing
  database: 'testdb',
  password: 'pass',
  port: 5432,
});

async function sendTestNotifications() {
  await producer.connect();
  console.log('🚀 DLQ Test Script Started\n');

  const testMessages = [
    {
      id: '1',
      recipient: 'test1@example.com',
      channel: 'email',
      message: 'Test notification 1 - should succeed sometimes',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      recipient: '+1234567890',
      channel: 'sms',
      message: 'Test notification 2 - will randomly fail',
      timestamp: new Date().toISOString()
    },
    {
      id: '3',
      recipient: 'test3@example.com',
      channel: 'email',
      message: 'Test notification 3 - for DLQ testing',
      timestamp: new Date().toISOString()
    },
    {
      id: '4',
      recipient: '+0987654321',
      channel: 'sms',
      message: 'Test notification 4 - retry behavior test',
      timestamp: new Date().toISOString()
    },
    {
      id: '5',
      recipient: 'admin@example.com',
      channel: 'email',
      message: 'Test notification 5 - final test message',
      timestamp: new Date().toISOString()
    }
  ];

  console.log('📤 Sending test notifications...\n');

  for (const msg of testMessages) {
    try {
      await producer.send({
        topic: 'notification-topic',
        messages: [{
          key: msg.id,
          value: JSON.stringify(msg)
        }]
      });
      console.log(`✅ Sent message ${msg.id} to ${msg.recipient} via ${msg.channel}`);
    } catch (error) {
      console.error(`❌ Failed to send message ${msg.id}:`, error.message);
    }
  }

  await producer.disconnect();
  console.log('\n📋 Test messages sent successfully!');
  console.log('\n📊 Monitor the system with:');
  console.log('- Consumer logs: docker-compose logs -f notification-consumer');
  console.log('- DLQ Consumer logs: docker-compose logs -f dlq-consumer');
  console.log('- DLQ Dashboard: http://localhost:8080/admin/dlq/dashboard');
  console.log('- DLQ Statistics: http://localhost:8080/admin/dlq/stats');
  console.log('- Prometheus Metrics: http://localhost:8080/metrics');
}

async function checkDLQStatus() {
  const client = await pool.connect();
  try {
    console.log('\n🔍 Checking DLQ Status...\n');

    const result = await client.query(`
      SELECT 
        status,
        COUNT(*) as count,
        MIN(failed_at) as oldest_failure,
        MAX(failed_at) as newest_failure
      FROM dlq_messages 
      GROUP BY status
    `);

    if (result.rows.length === 0) {
      console.log('✅ No messages in DLQ yet');
    } else {
      console.log('📊 DLQ Statistics:');
      result.rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count} messages`);
        if (row.oldest_failure) {
          console.log(`    Oldest: ${new Date(row.oldest_failure).toLocaleString()}`);
          console.log(`    Newest: ${new Date(row.newest_failure).toLocaleString()}`);
        }
      });
    }

    // Show recent failed messages
    const recentFailed = await client.query(`
      SELECT message_key, error_message, retry_count, failed_at, original_payload->>'recipient' as recipient
      FROM dlq_messages 
      WHERE status = 'FAILED'
      ORDER BY failed_at DESC
      LIMIT 5
    `);

    if (recentFailed.rows.length > 0) {
      console.log('\n📋 Recent Failed Messages:');
      recentFailed.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. Key: ${row.message_key}, Recipient: ${row.recipient}`);
        console.log(`     Error: ${row.error_message}`);
        console.log(`     Retries: ${row.retry_count}, Failed: ${new Date(row.failed_at).toLocaleString()}`);
      });
    }

  } finally {
    client.release();
  }
}

async function retryFailedMessage(messageKey) {
  console.log(`\n🔄 Manually retrying message: ${messageKey}`);
  
  try {
    const response = await fetch(`http://localhost:8080/admin/dlq/retry/${messageKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Retry request successful:', result.message);
    } else {
      console.log('❌ Retry request failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Failed to send retry request:', error.message);
    console.log('💡 Make sure the API service is running on localhost:8080');
  }
}

// Command line interface
const command = process.argv[2];
const messageKey = process.argv[3];

switch (command) {
  case 'send':
    sendTestNotifications().catch(console.error);
    break;
    
  case 'status':
    checkDLQStatus().then(() => process.exit(0)).catch(console.error);
    break;
    
  case 'retry':
    if (!messageKey) {
      console.log('❌ Please provide a message key: npm run dlq-test retry <message-key>');
      process.exit(1);
    }
    retryFailedMessage(messageKey).then(() => process.exit(0)).catch(console.error);
    break;
    
  default:
    console.log('\n🧪 DLQ Test Script Usage:');
    console.log('  node dlq-test.js send     - Send test notifications');
    console.log('  node dlq-test.js status   - Check DLQ status');
    console.log('  node dlq-test.js retry <key> - Retry specific message');
    console.log('\nExamples:');
    console.log('  node dlq-test.js send');
    console.log('  node dlq-test.js status');
    console.log('  node dlq-test.js retry 1');
    process.exit(0);
} 