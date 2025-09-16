import connect from 'connect';
import http from 'http';
import serveStatic from 'serve-static';
import { createTransformMiddleware } from './middleware/transform.js';
import { createModuleMiddleware } from './middleware/module.js';
class DevServer {
  app;
  server;
  root;
  constructor(options) {
    this.root = options.root;
    this.app = connect();
    this.app.use(createTransformMiddleware(this.root));
    this.app.use(createModuleMiddleware(this.root));
    this.app.use(
      serveStatic(this.root, {
        index: ['index.html'],
      })
    );
  }
  async start() {
    return new Promise((resolve, reject) => {
      const server = http.createServer(this.app);
      this.server = server;
      this.server.listen(3e3, () => {
        console.log(`\u{1F680} Dev server running at http://localhost:3000`);
        console.log(`\u{1F4C1} Serving files from: ${this.root}`);
        resolve();
      });
      this.server.on('error', reject);
    });
  }
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('\u{1F6D1} Dev server stopped');
          this.server = void 0;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
export { DevServer };
