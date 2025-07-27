// emailClient.js
import nodemailer from 'nodemailer';
import env from './common/config/validateEnv.js';
import './common/config/validateEnv.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT),
  secure: env.SMTP_SECURE === 'true', // true for 465 (TLS), false for 587 (STARTTLS)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export default transporter;
