# in outbox-worker/Dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8081
CMD ["node", "index.js"]  # adjust if you use a different entrypoint
