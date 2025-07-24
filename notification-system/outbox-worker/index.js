import 'dotenv/config';
import { DataSource } from 'typeorm';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Entity definition (repeat from api-service/entities/OutboxEvent.js)
import { EntitySchema } from 'typeorm';

const OutboxEvent = new EntitySchema({
  name: 'OutboxEvent',
  tableName: 'outbox_event',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    recipient: {
      type: 'varchar'
    },
    channel: {
      type: 'varchar'
    },
    message: {
      type: 'varchar'
    },
    status: {
      type: 'varchar',
      default: 'PENDING'
    },
    createdAt: {
      type: 'timestamp',
      createDate: true
    }
  }
});

// Load ENV vars
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME
} = process.env;

console.log('📦 Loaded DB ENV:', {
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
});

// Initialize TypeORM DataSource
const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: false,
  logging: false,
  entities: [OutboxEvent]
});

async function pollOutbox() {
  await AppDataSource.initialize();
  console.log('🚀 Worker connected to DB, polling...');

  const repo = AppDataSource.getRepository('OutboxEvent');

  setInterval(async () => {
    const pendingEvents = await repo.find({
      where: { status: 'PENDING' }
    });

    if (pendingEvents.length > 0) {
      console.log('📬 Found events:', pendingEvents);
    } else {
      console.log('⏳ No new events...');
    }
  }, 5000); // every 5 seconds
}

pollOutbox().catch(console.error);
