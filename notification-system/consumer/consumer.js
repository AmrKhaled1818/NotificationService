import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'dead-letter-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'dlq-consumer-group' });

async function startConsumer() {
  await consumer.connect();
  console.log('✅ DLQ Consumer connected');

  await consumer.subscribe({ topic: 'notification-dead-letter', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value.toString();
      console.log('💥 Received message from DLQ:', value);

      // You can parse it if it's JSON
      try {
        const payload = JSON.parse(value);
        console.log(`→ Type: ${payload.type}`);
        console.log(`→ To: ${payload.to}`);
        console.log(`→ Message: ${payload.message}`);
      } catch (e) {
        console.warn('⚠️ Could not parse message as JSON');
      }
    },
  });
}

startConsumer().catch(console.error);

process.on('SIGINT', async () => {
  await consumer.disconnect();
  console.log("👋 DLQ Kafka consumer disconnected");
  process.exit(0);
});
