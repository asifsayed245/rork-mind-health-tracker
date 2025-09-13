#!/usr/bin/env node

/**
 * Backend Server Startup Script
 * 
 * This script starts the Hono backend server on port 8081
 * Run with: node start-backend.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting backend server...');

// Get current directory
const currentDir = process.cwd();

// Start the backend server
const backend = spawn('bun', ['run', path.join(currentDir, 'backend/hono.ts')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '8081'
  }
});

backend.on('error', (error) => {
  console.error('❌ Failed to start backend server:', error.message);
  console.log('💡 Make sure you have bun installed: https://bun.sh/');
  process.exit(1);
});

backend.on('close', (code) => {
  const exitCode = typeof code === 'number' ? code : 1;
  console.log(`Backend server exited with code ${exitCode}`);
  process.exit(exitCode);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down backend server...');
  backend.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down backend server...');
  backend.kill('SIGTERM');
});

console.log('✅ Backend server started on http://localhost:8081');
console.log('📊 API health check: http://localhost:8081/api');
console.log('🗄️  Database test: http://localhost:8081/api/test-db');
console.log('Press Ctrl+C to stop the server');