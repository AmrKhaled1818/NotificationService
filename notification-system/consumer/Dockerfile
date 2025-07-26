FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY consumer/package*.json ./consumer/

# Install dependencies
RUN npm install
RUN cd consumer && npm install

# Copy source code
COPY . .

# Default command (can be overridden in docker-compose)
CMD ["node", "consumer/consumer.js"] 