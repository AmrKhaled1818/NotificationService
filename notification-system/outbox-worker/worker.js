import { initKafkaProducer, sendToKafka, closeKafkaProducer } from './kafkaProducer.js';
import { DataSource } from 'typeorm';
import OutboxEvent from '../common/entities/OutboxEvent.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../common/.env') });

console.log("🌱 Loaded .env from:", path.resolve(__dirname, '../common/.env'));

// Setup TypeORM
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [OutboxEvent],
});

let intervalRef = null;

async function startPolling() {
  await AppDataSource.initialize();
  await initKafkaProducer();
  const repo = AppDataSource.getRepository(OutboxEvent);

  console.log("⏳ Polling for PENDING outbox events every 5 seconds...");

  intervalRef = setInterval(async () => {
    try {
      const pendingEvents = await repo.find({ where: { status: 'PENDING' } });

      if (pendingEvents.length === 0) {
        console.log("🔍 No new events...");
        return;
      }

      for (const event of pendingEvents) {
        try {
          await sendToKafka(event);
          event.status = 'SENT';
          await repo.save(event);
          console.log(`✅ Event ${event.id} sent to Kafka and marked as SENT.`);
        } catch (err) {
          event.status = 'RETRY';
          await repo.save(event);
          console.error(`❌ Failed to send event ${event.id}:`, err.message);
        }
      }
    } catch (error) {
      console.error("💥 Error during polling:", error.message);
    }
  }, 5000);
}

async function shutdown() {
  if (intervalRef) clearInterval(intervalRef);
  await AppDataSource.destroy();
  await closeKafkaProducer();
  console.log("👋 Worker shutdown complete.");
  process.exit(0);
}

// Start polling loop
startPolling().catch((err) => {
  console.error("💥 Failed to start polling worker:", err);
  shutdown();
});

// Graceful shutdown handlers
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
