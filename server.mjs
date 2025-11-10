import http from 'node:http';
import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number.parseInt(process.env.PORT ?? '', 10) || 8080;
const host = '0.0.0.0';
const distDir = resolve(process.cwd(), 'dist');

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.webp', 'image/webp'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.map', 'application/json; charset=utf-8'],
]);

const ensureDistExists = async () => {
  try {
    await access(distDir);
  } catch (error) {
    console.error(`Build artifacts not found at ${distDir}. Did you run \`npm run build\`?`);
    throw error;
  }
};

await ensureDistExists();

const sendFile = (res, filePath) => {
  const ext = extname(filePath).toLowerCase();
  const type = MIME_TYPES.get(ext) ?? 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(filePath).pipe(res);
};

const sendNotFound = (res) => {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
};

const serveRequest = async (req, res) => {
  if (!req.url) {
    sendNotFound(res);
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  }

  const candidatePath = normalize(join(distDir, pathname));

  if (!candidatePath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  let filePath = candidatePath;

  try {
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html');
      await access(filePath);
    }

    sendFile(res, filePath);
    return;
  } catch {
    // Fall back to SPA entry point for unmatched routes
    const indexPath = join(distDir, 'index.html');

    try {
      await access(indexPath);
      sendFile(res, indexPath);
    } catch (error) {
      console.error('Unable to locate index.html in dist directory.', error);
      sendNotFound(res);
    }
  }
};

const server = http.createServer((req, res) => {
  void serveRequest(req, res).catch((error) => {
    console.error('Unexpected error serving request.', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  });
});

server.listen(port, host, () => {
  console.log(`Static server listening on http://${host}:${port}`);
});

const shutdown = (signal) => {
  console.log(`Received ${signal}. Closing HTTP server.`);
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
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
