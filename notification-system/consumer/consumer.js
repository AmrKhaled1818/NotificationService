import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'notification-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

async function startConsumer() {
  await consumer.connect();
  console.log('✅ Kafka consumer connected');

  await consumer.subscribe({ topic: 'notification-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value.toString();
      const payload = JSON.parse(value);

      console.log(`📥 Received message on ${topic}:`);
      console.log(`→ Recipient: ${payload.recipient}`);
      console.log(`→ Channel: ${payload.channel}`);
      console.log(`→ Message: ${payload.message}`);
      console.log(`→ Timestamp: ${payload.createdAt}`);

      // You can later integrate real SMS/email logic here
    },
  });
}

startConsumer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await consumer.disconnect();
  console.log("👋 Kafka consumer disconnected");
  process.exit(0);
});
