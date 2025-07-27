import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  // Kafka
  KAFKA_CLIENT_ID: z.string().default('notification-service'),
  KAFKA_BROKER: z.string().default('kafka:9092'),
  KAFKA_USERNAME: z.string().optional(),
  KAFKA_PASSWORD: z.string().optional(),

  // SMTP
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_SECURE: z.string().default('true'),
  SMTP_USER: z.string().default('test@example.com'),
  SMTP_PASS: z.string().default('test-password'),

  // Database
  DB_HOST: z.string().default('postgres'),
  DB_PORT: z.string().default('5432'),
  DB_USER: z.string().default('postgres'),
  DB_PASS: z.string().default('pass'),
  DB_NAME: z.string().default('testdb'),
});

const env = envSchema.parse(process.env);
export default env;
