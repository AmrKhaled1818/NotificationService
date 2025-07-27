// kafkaClient.js
import { Kafka } from 'kafkajs';
import env from './common/config/validateEnv.js';
import './common/config/validateEnv.js';

const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: [env.KAFKA_BROKER], // e.g., "kafka:9093"
  ssl: true, // Enable TLS
  sasl: env.KAFKA_USERNAME && env.KAFKA_PASSWORD ? {
    mechanism: 'plain',
    username: env.KAFKA_USERNAME,
    password: env.KAFKA_PASSWORD,
  } : undefined,
});

export default kafka;
