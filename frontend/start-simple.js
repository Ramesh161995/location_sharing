#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Location Sharing App (Simple Mode)...');
console.log('📱 Backend will be available at: http://localhost:8000');
console.log('📱 Frontend will be available at: http://localhost:19006');

// Start the backend
console.log('\n🔧 Starting Python Backend...');
const backend = spawn('py', ['run_super_simple.py'], {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit'
});

// Start the frontend
console.log('\n📱 Starting React Native Frontend...');
const frontend = spawn('npx', ['expo', 'start', '--web'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill();
  frontend.kill();
  process.exit();
});

// Handle errors
backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
});

frontend.on('error', (err) => {
  console.error('❌ Frontend error:', err);
});









