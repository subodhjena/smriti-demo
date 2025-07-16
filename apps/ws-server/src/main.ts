import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleConnection } from './handlers/connection';
import { logger } from '@smriti/logger';
import { initializeErrorHandling, handleError } from './utils/errorHandler';

// Load environment variables
dotenv.config();

// Initialize error handling
initializeErrorHandling();

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'];

// Create Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'smriti-ws-server'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Smriti WebSocket Server', 
    version: '1.0.0',
    endpoints: {
      health: '/health',
      websocket: 'ws://localhost:3000'
    }
  });
});

// Global error handling middleware
app.use(handleError);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/',
  clientTracking: true
});

// Handle WebSocket connections
wss.on('connection', handleConnection);

// Global error handler for WebSocket server
wss.on('error', (error) => {
  logger.error('WebSocket Server Error', error);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  wss.clients.forEach((client) => {
    client.terminate();
  });
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  wss.clients.forEach((client) => {
    client.terminate();
  });
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start server
server.listen(port, host, () => {
  logger.info(`🚀 Smriti WebSocket Server ready at http://${host}:${port}`);
  logger.info(`📡 WebSocket endpoint: ws://${host}:${port}`);
  logger.info(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});

// Export for testing
export { app, server, wss };
