# Smriti WebSocket Server

A lightweight, high-performance WebSocket server that acts as a proxy between clients and OpenAI's Realtime API for real-time spiritual guidance through voice and text interactions.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Setup and Installation](#setup-and-installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Message Types](#message-types)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The Smriti WebSocket Server provides a clean, efficient bridge between client applications and OpenAI's Realtime API. It focuses on connection management, authentication, and direct event forwarding while maintaining minimal processing overhead.

### Key Responsibilities

1. **WebSocket Connection Management**: Handle client WebSocket connections with authentication
2. **Authentication**: Token validation with demo mode support for development
3. **Session Management**: Automatic session creation, tracking, and cleanup
4. **OpenAI Proxy**: Direct forwarding of events between clients and OpenAI's Realtime API
5. **Error Handling**: Comprehensive error handling and structured logging
6. **Health Monitoring**: Health check endpoints for monitoring

## Architecture

### Simplified Proxy Architecture

```plaintext
Client Apps (Web/Mobile)
       ↓ WebSocket Connection
    WS-Server (Lightweight Proxy)
       ↓ Direct Event Forwarding
    OpenAI Realtime API
```

### Component Structure

```plaintext
src/
├── config/                      # Configuration files
│   └── system-prompt.ts        # AI system prompts and variants
├── handlers/                    # Connection and message handling
│   ├── connection.ts           # Main WebSocket connection handler
│   ├── connection-utils.ts     # Connection utilities and helpers
│   ├── message-handlers.ts     # Simplified message routing
│   └── openai-proxy.ts         # Direct OpenAI event forwarding
├── services/                    # Business logic services
│   ├── auth.ts                 # Authentication service
│   ├── openai-realtime.ts      # OpenAI Realtime API integration
│   └── session.ts              # Session management
├── types/                       # TypeScript type definitions
│   └── index.ts                # Core interfaces (Session, ConnectionContext, AuthToken)
├── utils/                       # Utility functions
│   └── errorHandler.ts         # Error handling utilities
└── main.ts                     # Server entry point
```

### Message Flow (Simplified)

1. **Connection Establishment**:

   ```plaintext
   Client → WebSocket Connection → Authentication → Session Creation → OpenAI Connection
   ```

2. **Event Forwarding (Primary)**:

   ```plaintext
   Client ←→ WS-Server (Direct Proxy) ←→ OpenAI API
   ```

3. **Legacy Message Support**:

   ```plaintext
   Legacy Client → Message Conversion → OpenAI API → Response → Client
   ```

## Features

### Core Features

- **High-Performance Proxy**: Direct event forwarding with minimal processing overhead
- **Real-time Communication**: Bidirectional WebSocket communication
- **Session Management**: Automatic session creation, tracking, and cleanup
- **Authentication**: Token-based authentication with demo mode support
- **Comprehensive Logging**: Structured logging with different log levels

### Proxy Benefits

- **Reduced Latency**: Direct event forwarding without server-side processing
- **Future Compatibility**: Automatically supports new OpenAI event types
- **Simplified Debugging**: Direct event tracing between client and OpenAI
- **Better Performance**: Minimal server-side overhead
- **Client Control**: Browser handles OpenAI event protocol natively

### Monitoring Features

- **Health Checks**: Health endpoint for monitoring
- **Connection Tracking**: Track active connections and sessions
- **Graceful Shutdown**: Proper cleanup on server shutdown
- **Structured Logging**: Comprehensive logging for debugging and monitoring

## Setup and Installation

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- OpenAI API Key
- Environment variables configured

### Installation

1. **Install Dependencies**:

   ```bash
   pnpm install
   ```

2. **Environment Setup**:

   ```bash
   cp env.template .env
   ```

3. **Configure Environment Variables** (see [Configuration](#configuration))

4. **Build the Application**:

   ```bash
   nx build ws-server
   ```

5. **Start the Server**:

   ```bash
   nx serve ws-server
   ```

### Development Mode

```bash
# Start in development mode with hot reload
nx serve ws-server
```

## Configuration

### Environment Variables

Copy `env.template` to `.env` and configure the following:

```env
# Server Configuration
PORT=3000                                    # Server port
NODE_ENV=development                         # Environment mode
HOST=localhost                              # Server host

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here  # OpenAI API Key

# Authentication (Optional - for production)
CLERK_SECRET_KEY=sk_test_your_key_here      # Clerk authentication key

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4200       # Comma-separated allowed origins

# Logging
LOG_LEVEL=info                              # Log level (debug, info, warn, error)
```

### OpenAI Realtime API Configuration

The server configures OpenAI with the following default settings:

- **Model**: `gpt-4o-realtime-preview`
- **Voice**: `alloy` (configurable: alloy, echo, fable, onyx, nova, shimmer)
- **Audio Format**: PCM16, 24kHz
- **Temperature**: 0.8
- **Max Response Tokens**: 4096
- **Turn Detection**: Server-side VAD with 500ms silence duration

### System Prompt Configuration

The AI personality and behavior is defined by system prompts located in `src/config/system-prompt.ts`:

- **Default**: Comprehensive Sanatan Dharma spiritual advisor
- **Brief**: Concise spiritual guidance
- **Philosophical**: Deep philosophical insights
- **Alternative Variants**: Specialized prompts for different contexts

## API Reference

### HTTP Endpoints

#### Health Check

```plaintext
GET /health
```

Returns server health status.

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "smriti-ws-server"
}
```

#### Root Endpoint

```plaintext
GET /
```

Returns server information and available endpoints.

### WebSocket Connection

#### Connection URL

```plaintext
ws://localhost:3000/?token=your_auth_token
```

#### Authentication

- **Query Parameter**: `token` - Authentication token
- **Header**: `Authorization: Bearer <token>` - Alternative auth method
- **Demo Mode**: Connections without tokens are allowed in development

## Message Types

### Primary Message Format (OpenAI Proxy)

#### Client to Server (OpenAI Event)

```json
{
  "type": "openai_event",
  "payload": {
    // Raw OpenAI Realtime API event
    "type": "conversation.item.create",
    "item": { ... }
  }
}
```

#### Server to Client (OpenAI Event)

```json
{
  "type": "openai_event",
  "payload": {
    // Raw OpenAI Realtime API event
    "type": "response.audio.delta",
    "delta": "base64_audio_data"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sessionId": "sess_1234567890_abcdef"
}
```

### Server-Specific Messages

#### Ping/Pong (Keepalive)

```json
// Client to Server
{
  "type": "ping"
}

// Server to Client
{
  "type": "pong",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sessionId": "sess_1234567890_abcdef"
}
```

#### Welcome Message

```json
{
  "type": "welcome",
  "payload": {
    "message": "Connected to Smriti AI Guidance",
    "sessionId": "sess_1234567890_abcdef",
    "userId": "user_123",
    "authenticated": true,
    "features": ["text_chat", "voice_chat", "spiritual_guidance"]
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sessionId": "sess_1234567890_abcdef"
}
```

### Legacy Message Support (Backward Compatibility)

For existing clients that haven't migrated to the proxy approach:

#### Text Message

```json
{
  "type": "text_message",
  "payload": {
    "text": "Hello, I'm seeking guidance about meditation."
  }
}
```

#### Audio Messages

```json
// Audio data
{
  "type": "audio_data",
  "payload": {
    "audio": "base64_encoded_pcm16_audio_data"
  }
}

// Audio commit
{
  "type": "audio_commit",
  "payload": {}
}

// Audio clear
{
  "type": "audio_clear",
  "payload": {}
}
```

#### Error Messages

```json
{
  "type": "error",
  "payload": {
    "message": "Failed to process message",
    "details": "Specific error details"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sessionId": "sess_1234567890_abcdef"
}
```

## Development

### Project Architecture

The server follows a simplified, modular architecture optimized for proxy operations:

- **Handlers**: Minimal WebSocket connection management and direct event forwarding
- **Services**: Authentication, session management, and OpenAI connection handling
- **Types**: Essential interfaces for core functionality
- **Utils**: Error handling and validation utilities

### Key Design Principles

1. **Proxy-First Architecture**: Primary focus on direct event forwarding
2. **Minimal Processing**: Reduce server-side overhead and latency
3. **Clean Separation**: Clear boundaries between connection, auth, and proxy logic
4. **Backward Compatibility**: Support legacy message formats during transition

### Adding New Features

1. For OpenAI events: No server changes needed - direct proxy forwarding
2. For server features: Add to `message-handlers.ts` server-specific section
3. For authentication: Extend `auth.ts` service
4. For session management: Extend `session.ts` service

### Debugging

Enable debug logging:

```env
LOG_LEVEL=debug
```

Debug specific components:

- Connection issues: Check WebSocket connection logs
- Authentication: Verify token validation logs
- OpenAI integration: Monitor proxy event logs
- Session management: Track session creation/cleanup logs

## Deployment

### Production Considerations

1. **Environment Variables**: Ensure all production env vars are set
2. **Authentication**: Configure proper Clerk authentication
3. **CORS**: Set appropriate allowed origins
4. **Logging**: Use appropriate log level (info/warn)
5. **Health Checks**: Configure monitoring for `/health` endpoint
6. **Performance**: Monitor proxy throughput and latency

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your_production_key
CLERK_SECRET_KEY=your_production_clerk_key
ALLOWED_ORIGINS=https://your-domain.com
LOG_LEVEL=info
```

## Troubleshooting

### Common Issues

#### Connection Issues

- **Symptom**: WebSocket connection fails
- **Solution**: Check CORS configuration and allowed origins
- **Debug**: Enable debug logging and check connection logs

#### Authentication Failures

- **Symptom**: Connection rejected with auth error
- **Solution**: Verify token format and Clerk configuration
- **Debug**: Check auth service logs and token validation

#### OpenAI Connection Issues

- **Symptom**: Events not forwarded to/from OpenAI
- **Solution**: Verify OpenAI API key and connection status
- **Debug**: Monitor proxy event logs and OpenAI service logs

#### Performance Issues

- **Symptom**: High latency or dropped connections
- **Solution**: Check server resources and connection limits
- **Debug**: Monitor session counts and proxy throughput

### Monitoring

- **Health Check**: `GET /health` for service status
- **Connection Count**: Monitor active session counts
- **Proxy Performance**: Track event forwarding latency
- **Error Rates**: Monitor error logs for patterns

### Support

For additional support:

1. Check debug logs with `LOG_LEVEL=debug`
2. Verify OpenAI API key and quotas
3. Test with simple ping/pong messages
4. Monitor network connectivity and latency
