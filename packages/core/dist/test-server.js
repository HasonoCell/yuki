#!/usr/bin/env node
import { DevServer } from './server/dev-server.js';
import path from 'path';
import { fileURLToPath } from 'url';
async function testServer() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const playgroundPath = path.resolve(__dirname, '../../../playground');
  console.log(`\u{1F4C2} Playground path: ${playgroundPath}`);
  const server = new DevServer({
    root: playgroundPath,
  });
  try {
    await server.start();
    console.log('\u2705 Server started successfully!');
    console.log('\u{1F4DD} Open http://localhost:3000 in your browser');
    console.log('\u{1F6D1} Press Ctrl+C to stop the server');
    process.on('SIGINT', async () => {
      console.log('\n\u{1F6D1} Shutting down server...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('\u274C Failed to start server:', error);
    process.exit(1);
  }
}
testServer();
