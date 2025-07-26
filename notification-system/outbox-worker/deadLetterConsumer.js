const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'dead-letter-consumer',
  brokers: ['kafka:9092'],
});

const consumer = kafka.consumer({ groupId: 'dlq-consumer-group' });

const run = async () => {
  await consumer.connect();
  console.log('🧾 DLQ Consumer connected');

  await consumer.subscribe({ topic: 'notification-dead-letter', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('💥 Received message from DLQ:', {
        value: message.value.toString(),
      });
    },
  });
};

run().catch(console.error);
