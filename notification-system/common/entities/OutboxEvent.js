const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'OutboxEvent',
  tableName: 'outbox_event',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    recipient: {
      type: 'varchar',
    },
    channel: {
      type: 'varchar',
    },
    message: {
      type: 'varchar',
    },
    status: {
      type: 'varchar',
      default: 'PENDING',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
}); 