#!/usr/bin/env node

import { DevServer } from './server/dev-server.js';
import path from 'path';
import { fileURLToPath } from 'url';

async function testServer() {
  // 获取当前文件的目录
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // 获取 playground 目录的绝对路径
  const playgroundPath = path.resolve(__dirname, '../../../playground');

  console.log(`📂 Playground path: ${playgroundPath}`);

  // 创建并启动开发服务器
  const server = new DevServer({
    root: playgroundPath,
  });

  try {
    await server.start();
    console.log('✅ Server started successfully!');
    console.log('📝 Open http://localhost:3000 in your browser');
    console.log('🛑 Press Ctrl+C to stop the server');

    // 监听进程退出信号
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

testServer();
