FROM node:18-alpine

WORKDIR /app

COPY api-service/package*.json ./
RUN npm ci --only=production

COPY api-service/index.js ./
COPY api-service/routes/ ./routes/
COPY api-service/validators/ ./validators/
COPY common/ ./common/

EXPOSE 8080

CMD ["node", "index.js"] 