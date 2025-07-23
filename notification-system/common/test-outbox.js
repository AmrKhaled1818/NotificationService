const { AppDataSource } = require('./config/typeorm.config');
const OutboxEvent = require('./entities/OutboxEvent');

async function testOutbox() {
  try {
    await AppDataSource.initialize();
    // Insert a test event
    await AppDataSource.getRepository(OutboxEvent).save({
      recipient: 'test@example.com',
      channel: 'EMAIL',
      message: 'Hello from Outbox!',
    });
    // Fetch all events
    const events = await AppDataSource.getRepository(OutboxEvent).find();
    console.log('Outbox Events:', events);
    await AppDataSource.destroy();
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testOutbox(); 