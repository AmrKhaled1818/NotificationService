# Distributed Notification System

A distributed notification system built with Node.js microservices, implementing the Outbox Pattern for reliable message delivery across multiple channels including email and webhooks.

## Overview

This notification system implements a distributed architecture pattern using the Outbox Pattern to ensure reliable message delivery. It consists of multiple microservices that work together to process, queue, and deliver notifications through various channels including email and webhooks.

## Architecture

The system follows a microservices architecture with the following key components:

- **API Service**: RESTful API for receiving notification requests
- **Outbox Worker**: Processes outbox events and publishes to Kafka
- **Notification Consumer**: Consumes messages from Kafka and sends notifications
- **DLQ Consumer**: Handles failed messages and retry logic
- **Monitoring**: Prometheus and Grafana for metrics and observability

## Technologies Used

### Core Technologies
- **Node.js**: Runtime environment for all services
- **Express.js**: Web framework for API service
- **Kafka**: Message broker for event streaming
- **PostgreSQL**: Primary database for outbox events and DLQ tracking
- **Docker**: Containerization for all services

### Libraries and Dependencies
- **Kafkajs**: Kafka client for Node.js
- **Nodemailer**: Email sending functionality
- **Axios**: HTTP client for webhook calls
- **Joi/Zod**: Data validation
- **Prom-client**: Prometheus metrics collection
- **Dotenv**: Environment configuration
- **PG**: PostgreSQL client

### Infrastructure
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Visualization and dashboards
- **Zookeeper**: Kafka coordination
- **Docker Compose**: Multi-container orchestration

## Project Structure

```
notification-system/
├── api-service/           # REST API for notification requests
├── outbox-worker/         # Outbox pattern implementation
├── consumer/              # Kafka message consumers
├── common/                # Shared utilities and configurations
├── load-test/             # Performance testing and load testing
├── infra/                 # Infrastructure configuration
├── docker-compose.yml     # Multi-service orchestration
├── init.sql              # Database schema initialization
└── package.json          # Root package configuration
```

### Directory Descriptions

#### `api-service/`
RESTful API service that receives notification requests. Handles request validation, stores events in the outbox table, and provides webhook endpoints for testing.

**Key Files:**
- `index.js`: Main application entry point
- `routes/`: API route definitions
- `validators/`: Request validation schemas
- `emailClient.js`: Email client configuration
- `kafkaClient.js`: Kafka client setup

#### `outbox-worker/`
Implements the Outbox Pattern to ensure reliable message delivery. Monitors the outbox table for pending events and publishes them to Kafka topics.

**Key Files:**
- `index.js`: Main worker process
- `kafkaProducer.js`: Kafka message publishing logic
- `outbox.entity.js`: Database entity definitions
- `deadLetterConsumer.js`: DLQ message processing

#### `consumer/`
Kafka message consumers that process notification events and send them through various channels (email, webhooks).

**Key Files:**
- `consumer.js`: Main notification consumer
- `dlq-consumer.js`: Dead letter queue consumer
- `kafkaClient.js`: Kafka consumer configuration

#### `common/`
Shared utilities, configurations, and services used across multiple microservices.

**Key Files:**
- `dlq-service.js`: Dead letter queue service logic
- `notifier.js`: Notification sending utilities
- `config/`: Shared configuration files
- `entities/`: Shared database entities

#### `load-test/`
Comprehensive load testing suite with performance monitoring and reporting capabilities.

**Key Files:**
- `loadtest.js`: Main load testing script
- `dlq-test.js`: Dead letter queue testing
- `generate-report.js`: Test report generation
- `dashboard.html`: Load test results dashboard

#### `infra/`
Infrastructure configuration files for monitoring and observability.

**Key Files:**
- `prometheus.yml`: Prometheus configuration

## Database Schema

The system uses PostgreSQL with two main tables:

### `outbox_event`
Stores notification events that need to be processed:
- `id`: Unique identifier (UUID)
- `recipient`: Target recipient
- `channel`: Notification channel (email, webhook)
- `message`: Notification content
- `status`: Processing status (PENDING, PROCESSED, FAILED)
- `createdAt`: Event creation timestamp

### `dlq_messages`
Tracks failed messages for retry and analysis:
- `id`: Unique identifier (UUID)
- `message_key`: Kafka message key
- `original_payload`: Original message content
- `error_message`: Failure reason
- `retry_count`: Number of retry attempts
- `status`: Current status (FAILED, RETRYING, RESOLVED)
- `retry_at`: Next retry timestamp
- `resolved_at`: Resolution timestamp

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Quick Start
1. Clone the repository
2. Navigate to the notification-system directory
3. Run the entire system:
   ```bash
   docker-compose up -d
   ```

### Service Ports
- API Service: `http://localhost:8080`
- Outbox Worker: `http://localhost:8081`
- PostgreSQL: `localhost:5432`
- Kafka: `localhost:9092`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

## API Endpoints

### Send Notification
```
POST /api/notifications
Content-Type: application/json

{
  "recipient": "user@example.com",
  "channel": "email",
  "message": "Hello, this is a test notification"
}
```

### Webhook Test
```
POST /webhook/test-webhook
Content-Type: application/json

{
  "message": "Test webhook notification"
}
```

## Load Testing

The system includes comprehensive load testing capabilities:

```bash
# Run load tests
npm run load-test

# Test dead letter queue
npm run dlq-test

# Generate performance reports
npm run generate-report
```

## Monitoring

### Prometheus Metrics
- Request rates and latencies
- Kafka message processing rates
- Database connection metrics
- Error rates and failure counts

### Grafana Dashboards
- Real-time system performance
- Message processing throughput
- Error rate monitoring
- Resource utilization

## Development

### Local Development
```bash
# Install dependencies
npm install

# Start individual services
npm run start:consumer
npm run start:dlq-consumer
```

### Environment Variables
Key environment variables for configuration:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`: Database configuration
- `KAFKA_BROKER`: Kafka broker address
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email configuration
- `NOTIFICATION_WEBHOOK_URL`: Webhook endpoint for testing

## Error Handling

The system implements robust error handling with:
- Dead Letter Queue for failed messages
- Automatic retry mechanisms
- Comprehensive error logging
- Graceful degradation

## Performance

The system is designed for high throughput with:
- Asynchronous message processing
- Connection pooling
- Efficient database queries
- Horizontal scaling capabilities

## Security

- Environment-based configuration
- Input validation and sanitization
- Secure database connections
- Containerized deployment

## Contributing

1. Follow the existing code structure
2. Add appropriate tests for new features
3. Update documentation for API changes
4. Ensure all services start successfully with Docker Compose

## License

ISC License
