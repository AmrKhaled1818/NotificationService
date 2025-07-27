import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  // Kafka
  KAFKA_CLIENT_ID: z.string(),
  KAFKA_BROKER: z.string(),
  KAFKA_USERNAME: z.string().optional(),
  KAFKA_PASSWORD: z.string().optional(),

  // SMTP
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_SECURE: z.string(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
});

const env = envSchema.parse(process.env);
export default env;
