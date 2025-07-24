const express = require('express');
const notificationSchema = require('../validators/notificationValidator');
const path = require('path');
const { AppDataSource } = require(path.resolve(__dirname, '../../common/config/typeorm.config'));
const OutboxEvent = require(path.resolve(__dirname, '../../common/entities/OutboxEvent'));


const router = express.Router();

// POST /notify route
router.post('/', async (req, res) => {
  const { error, value } = notificationSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    // Ensure DB is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const repo = AppDataSource.getRepository(OutboxEvent);

    const newEvent = repo.create({
      recipient: value.recipient,
      channel: value.channel,
      message: value.message,
      status: 'PENDING',
    });

    const saved = await repo.save(newEvent);
    return res.status(201).json({ id: saved.id, status: saved.status });
  } catch (err) {
    console.error('Error inserting notification:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
