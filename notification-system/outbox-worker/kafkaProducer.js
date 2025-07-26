import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'outbox-worker',
  brokers: ['kafka:9092'],
});

const producer = kafka.producer();

let isConnected = false;

export async function initKafkaProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log('🚀 Kafka producer connected');
  }
}

export async function sendToKafka(event) {
  const payload = {
    recipient: event.recipient,
    channel: event.channel,
    message: event.message,
    createdAt: event.createdAt
  };

  await producer.send({
    topic: 'notification-topic',
    messages: [
      {
        key: event.id,
        value: JSON.stringify(payload),
      },
    ],
  });
}

export async function closeKafkaProducer() {
  if (isConnected) {
    await producer.disconnect();
    console.log('📴 Kafka producer disconnected');
  }
}
