import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Helper plugin to serve and copy the root `data/` directory
function gitfeedDataPlugin() {
  return {
    name: 'gitfeed-data-plugin',
    configureServer(server: any) {
      // In dev mode, serve requests to /data/... from root ../data/...
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && (req.url.startsWith('/data/') || req.url.startsWith('./data/'))) {
          const cleanUrl = req.url.replace(/^\.?\/data\//, '');
          const filePath = path.resolve(__dirname, '../data', cleanUrl);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return fs.createReadStream(filePath).pipe(res);
          }
        }
        next();
      });
    },
    closeBundle() {
      // Copy ../data into dist/data on production build
      const sourceDir = path.resolve(__dirname, '../data');
      const targetDir = path.resolve(__dirname, 'dist/data');
      if (fs.existsSync(sourceDir)) {
        fs.cpSync(sourceDir, targetDir, { recursive: true });
        console.log('✓ Successfully copied data/ into dist/data/ for static deployment.');
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), gitfeedDataPlugin()],
  base: './', // Ensures relative path asset resolution on GitHub Pages or custom domain
  server: {
    port: 3000,
    open: false,
  }
});
