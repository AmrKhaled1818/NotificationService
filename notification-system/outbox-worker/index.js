import express from 'express';
import client from 'prom-client';
import pg from 'pg';
import { Kafka } from 'kafkajs';

const app = express();
const PORT = process.env.PORT || 8081;

// Prometheus metrics
client.collectDefaultMetrics();

const sentEmailsCounter = new client.Counter({
  name: 'outbox_events_sent_total',
  help: 'Total number of events successfully sent to Kafka',
});

const failedEmailsCounter = new client.Counter({
  name: 'outbox_events_failed_total',
  help: 'Total number of events failed to send to Kafka',
});

const queueGauge = new client.Gauge({
  name: 'outbox_event_queue_depth',
  help: 'Number of PENDING events in the outbox',
});

// PostgreSQL setup
const pool = new pg.Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'testdb',
  password: 'pass',
  port: 5432,
});

// Kafka setup
const kafka = new Kafka({
  clientId: 'outbox-worker',
  brokers: ['kafka:9092'],
});

const producer = kafka.producer();

const pollOutbox = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query(
      "SELECT * FROM outbox_event WHERE status = 'PENDING' ORDER BY id ASC"
    );

    const events = res.rows;
    queueGauge.set(events.length); // Update Prometheus gauge

    if (events.length === 0) {
      console.log('🔍 No new events...');
      client.release();
      return;
    }

    console.log(`📤 Found ${events.length} pending events`);

    for (const event of events) {
      try {
        await producer.send({
          topic: 'notification-topic',
          messages: [
            {
              key: event.id.toString(),
              value: JSON.stringify({
                recipient: event.recipient,
                channel: event.channel,
                message: event.message,
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        });

        await client.query('UPDATE outbox_event SET status = $1 WHERE id = $2', [
          'SENT',
          event.id,
        ]);

        sentEmailsCounter.inc(); // increment success
        console.log(`✅ Event ${event.id} sent to Kafka and marked as SENT`);
      } catch (err) {
        failedEmailsCounter.inc(); // increment failure
        console.error(`❌ Failed to send event ${event.id}:`, err.message);
      }
    }

    client.release();
  } catch (err) {
    console.error('❌ Error polling outbox:', err.message);
  }
};

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start everything
app.listen(PORT, async () => {
  console.log(`🚀 Outbox Worker metrics server running on http://localhost:${PORT}`);
  await producer.connect();
  console.log('✅ Kafka producer connected');
  console.log('⏳ Polling for PENDING outbox events every 5 seconds...');
  setInterval(pollOutbox, 5000);
});
