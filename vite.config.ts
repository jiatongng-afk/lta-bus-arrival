import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-serverless-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url) return next();
            const url = new URL(req.url, 'http://localhost');
            if (url.pathname === '/api/health') {
              try {
                const module = await server.ssrLoadModule('./api/health.ts');
                return await module.default(req, res);
              } catch (err) {
                return next(err);
              }
            }
            if (url.pathname === '/api/busarrival') {
              try {
                const module = await server.ssrLoadModule('./api/busarrival.ts');
                return await module.default(req, res);
              } catch (err) {
                return next(err);
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
