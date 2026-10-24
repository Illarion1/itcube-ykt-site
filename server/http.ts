// Небольшие помощники для работы с HTTP: ответы, чтение тела запроса, cookie, отдача файлов
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

/** Ошибка с понятным текстом для пользователя и HTTP-статусом */
export class HttpError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/** Заголовки безопасности для всех ответов сервера */
export function setSecurityHeaders(res: ServerResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}

export function sendJson(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

/** Читает тело запроса целиком, но не больше limit байт */
export async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'Слишком большой запрос');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req: IncomingMessage, limit = 2 * 1024 * 1024): Promise<unknown> {
  if (!String(req.headers['content-type']).includes('application/json')) {
    throw new HttpError(415, 'Ожидались данные в формате JSON');
  }
  const raw = await readBody(req, limit);
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new HttpError(400, 'Не удалось прочитать данные');
  }
}

export function getCookie(req: IncomingMessage, name: string): string | null {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      try {
        return decodeURIComponent(rest.join('='));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function serializeCookie(name: string, value: string, { maxAge, secure }: { maxAge: number; secure: boolean }) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/**
 * Если сайт стоит за прокси (nginx, Caddy), настоящий адрес посетителя и протокол
 * приходят в заголовках X-Forwarded-*. Доверяем им, только если TRUST_PROXY=1:
 * иначе любой посетитель мог бы подделать свой адрес.
 */
const trustProxy = process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true';

export function clientIp(req: IncomingMessage) {
  const forwarded = trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '';
  return forwarded || req.socket.remoteAddress || 'unknown';
}

export function isHttps(req: IncomingMessage) {
  return Boolean((req.socket as { encrypted?: boolean }).encrypted) || (trustProxy && req.headers['x-forwarded-proto'] === 'https');
}

/**
 * Защита от подделки запросов с чужих сайтов: изменять данные можно только
 * запросами со страниц нашего же сайта (браузер сам ставит заголовок Origin).
 */
export function assertSameOrigin(req: IncomingMessage) {
  const origin = req.headers.origin;
  if (!origin) return;
  let host = '';
  try {
    host = new URL(origin).host;
  } catch {
    // неправильный Origin — считаем чужим
  }
  const expected = (trustProxy && String(req.headers['x-forwarded-host'] ?? '')) || req.headers.host;
  if (host !== expected) throw new HttpError(403, 'Запрос отклонён: он пришёл с другого сайта');
}

/** Путь из адреса → путь к файлу внутри папки root (или null, если адрес пытается выйти за её пределы) */
export function safeJoin(root: string, urlPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0') || decoded.includes('\\')) return null;
  const file = path.resolve(root, `.${path.posix.normalize(`/${decoded}`)}`);
  return file === root || file.startsWith(root + path.sep) ? file : null;
}

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.rtf': 'application/rtf',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
};

const compressible = /^(text\/|application\/(json|xml|manifest)|image\/svg)/;

// Сжатые копии файлов, чтобы не сжимать одно и то же при каждом запросе
const gzipCache = new Map<string, { etag: string; body: Buffer }>();

/**
 * Отдаёт файл с диска: правильный Content-Type, кэширование (ETag → ответ 304 «не изменился»)
 * и сжатие gzip для текстовых файлов. Возвращает false, если файла нет.
 */
export async function sendFile(req: IncomingMessage, res: ServerResponse, file: string, cacheControl: string): Promise<boolean> {
  let info;
  try {
    info = await stat(file);
  } catch {
    return false;
  }
  if (!info.isFile()) return false;

  const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  const type = contentTypes[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const canGzip = compressible.test(type) && info.size > 1024;
  const headers: Record<string, string | number> = {
    'Content-Type': type,
    'Cache-Control': cacheControl,
    ETag: etag,
    'Last-Modified': info.mtime.toUTCString(),
  };
  if (canGzip) headers.Vary = 'Accept-Encoding';

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    res.end();
    return true;
  }

  if (canGzip && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
    let cached = gzipCache.get(file);
    if (cached?.etag !== etag) {
      cached = { etag, body: gzipSync(await readFile(file)) };
      if (info.size < 5 * 1024 * 1024) gzipCache.set(file, cached);
    }
    res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': cached.body.length });
    res.end(req.method === 'HEAD' ? undefined : cached.body);
    return true;
  }

  res.writeHead(200, { ...headers, 'Content-Length': info.size });
  if (req.method === 'HEAD') {
    res.end();
    return true;
  }
  await new Promise<void>((resolve) => {
    const stream = createReadStream(file);
    stream.on('error', () => {
      res.destroy();
      resolve();
    });
    stream.on('end', () => resolve());
    stream.pipe(res);
  });
  return true;
}
