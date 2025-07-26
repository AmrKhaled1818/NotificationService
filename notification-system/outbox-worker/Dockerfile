FROM node:18-alpine

WORKDIR /app

COPY outbox-worker/package*.json ./
RUN npm ci --only=production

COPY outbox-worker/index.js ./
COPY outbox-worker/kafkaProducer.js ./
COPY outbox-worker/outbox.entity.js ./
COPY outbox-worker/worker.js ./
COPY common/ ./common/
COPY outbox-worker/deadLetterConsumer.js ./

EXPOSE 8081

CMD ["node", "index.js"]
