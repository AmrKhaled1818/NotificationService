const Joi = require('joi');

const notificationSchema = Joi.object({
  recipient: Joi.string().email().required(),
  channel: Joi.string().valid('EMAIL', 'SMS').required(),
  message: Joi.string().min(1).required(),
});

module.exports = notificationSchema;
