#!/usr/bin/env bun
import app from './hono';

const port = parseInt(process.env.PORT || '3001');

console.log(`Starting Hono server on port ${port}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Bun version: ${Bun.version}`);

// Test if our Hono app is properly imported
console.log('Hono app imported:', !!app);
console.log('Hono app type:', typeof app);

try {
  // Start the server
  const server = Bun.serve({
    port,
    fetch: app.fetch,
    error(error) {
      console.error('Server error:', error);
      return new Response('Internal Server Error', { status: 500 });
    },
    development: process.env.NODE_ENV === 'development',
  });

  console.log(`Server running at http://localhost:${server.port}`);
  console.log(`API health check: http://localhost:${server.port}/api`);
  console.log(`Ping test: http://localhost:${server.port}/api/ping`);
  console.log(`Database test: http://localhost:${server.port}/api/test-db`);
  console.log(`tRPC endpoint: http://localhost:${server.port}/api/trpc`);
  console.log(`tRPC test: http://localhost:${server.port}/api/trpc-test`);

} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});