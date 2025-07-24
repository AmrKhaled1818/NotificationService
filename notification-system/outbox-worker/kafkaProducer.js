import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'outbox-worker',
  brokers: ['localhost:9092'], // Update if your Kafka is elsewhere
});

const producer = kafka.producer();

export async function sendToKafka(event) {
  await producer.connect();
  await producer.send({
    topic: 'notification-topic',
    messages: [
      { key: event.id, value: JSON.stringify(event) },
    ],
  });
  await producer.disconnect();
} 