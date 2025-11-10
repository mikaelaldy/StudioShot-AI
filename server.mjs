import { preview } from 'vite';

const port = Number.parseInt(process.env.PORT ?? '', 10) || 8080;
const host = '0.0.0.0';

const server = await preview({
  preview: {
    port,
    host,
  },
});

const localUrls = server.resolvedUrls?.local ?? [];
const networkUrls = server.resolvedUrls?.network ?? [];
const urls = [...localUrls, ...networkUrls];

if (urls.length > 0) {
  console.log(`Vite preview server listening on ${urls.join(', ')}`);
} else {
  console.log(`Vite preview server listening on http://${host}:${port}`);
}

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Closing Vite preview server.`);
  await server.close();
  process.exit(0);
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
