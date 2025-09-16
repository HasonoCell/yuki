import connect from 'connect';
import fs from 'fs';
import path from 'path';
import http from 'http';
import serveStatic from 'serve-static';
import { createTransformMiddleware } from './middleware/transform.js';
import { createModuleMiddleware } from './middleware/module.js';

interface DevServerOptions {
  root: string;
}

export class DevServer {
  private app: connect.Server;
  private server?: http.Server;
  private root: string;

  constructor(options: DevServerOptions) {
    this.root = options.root;
    this.app = connect();

    // 编译文件中间件
    this.app.use(createTransformMiddleware(this.root));

    // 请求第三方依赖中间件
    this.app.use(createModuleMiddleware(this.root));

    // 静态文件服务中间件 - 自动处理 index.html
    // 当请求根目录时自动返回 index.html
    this.app.use(
      serveStatic(this.root, {
        index: ['index.html'],
      })
    );
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = http.createServer(this.app);
      this.server = server;

      this.server.listen(3000, () => {
        console.log(`🚀 Dev server running at http://localhost:3000`);
        console.log(`📁 Serving files from: ${this.root}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 Dev server stopped');
          this.server = undefined;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
