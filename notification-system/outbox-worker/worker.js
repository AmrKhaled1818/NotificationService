import { sendToKafka } from './kafkaProducer.js';
import { DataSource } from 'typeorm';
import OutboxEvent from '../common/entities/OutboxEvent.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../common/.env') });

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

async function processOutbox() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(OutboxEvent);
  // Fetch PENDING events
  const events = await repo.find({ where: { status: 'PENDING' } });
  for (const event of events) {
    try {
      await sendToKafka(event);
      event.status = 'SENT';
      await repo.save(event);
      console.log(`Event ${event.id} sent to Kafka and marked as SENT.`);
    } catch (err) {
      event.status = 'RETRY'; // or 'FAILED' for permanent errors
      await repo.save(event);
      console.error(`Failed to send event ${event.id}:`, err.message);
    }
  }
  await AppDataSource.destroy();
}

processOutbox(); 