/**
 * Загрузка файлов из админ-панели. Браузер присылает файл «как есть» в теле запроса,
 * а исходное имя — в заголовке X-File-Name. Файл сохраняется в data/uploads/год/месяц/
 * под новым именем латиницей (чтобы адрес был понятным и не совпадал с другими файлами).
 */
import { randomBytes } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { slugify } from '../src/admin/schema.ts';
import { HttpError } from './http.ts';

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const DOCUMENT_TYPES = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.rtf', '.txt', '.csv', '.zip', '.rar', '.7z'];

const MB = 1024 * 1024;
const IMAGE_LIMIT = 15 * MB;
const DOCUMENT_LIMIT = 50 * MB;

export async function saveUpload(req: IncomingMessage, uploadsDir: string) {
  let originalName = 'file';
  try {
    originalName = decodeURIComponent(String(req.headers['x-file-name'] ?? 'file'));
  } catch {
    // имя испорчено — оставляем «file»
  }
  const ext = path.extname(originalName).toLowerCase();
  const isImage = IMAGE_TYPES.includes(ext);
  if (!isImage && !DOCUMENT_TYPES.includes(ext)) {
    throw new HttpError(
      415,
      `Такой файл загрузить нельзя (${ext || 'без расширения'}). Подойдут фото (JPG, PNG, WebP, GIF) и документы (PDF, Word, Excel, PowerPoint, архивы).`,
    );
  }

  const limit = isImage ? IMAGE_LIMIT : DOCUMENT_LIMIT;
  const tooBig = new HttpError(413, `Файл слишком большой: можно до ${limit / MB} МБ`);
  if (Number(req.headers['content-length']) > limit) throw tooBig;

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dir = path.join(uploadsDir, year, month);
  await mkdir(dir, { recursive: true });

  const base = slugify(path.basename(originalName, ext)).slice(0, 60).replace(/-+$/, '') || 'file';
  const fileName = `${base}-${randomBytes(3).toString('hex')}${ext === '.jpeg' ? '.jpg' : ext}`;
  const tmp = path.join(dir, `.${fileName}.part`);

  // Считаем байты на лету и обрываем загрузку, если файл больше лимита
  let size = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      callback(size > limit ? tooBig : null, chunk);
    },
  });

  try {
    await pipeline(req, counter, createWriteStream(tmp));
    if (size === 0) throw new HttpError(400, 'Файл пустой');
    await rename(tmp, path.join(dir, fileName));
  } catch (error) {
    await rm(tmp, { force: true });
    throw error instanceof HttpError ? error : new HttpError(400, 'Файл не загрузился полностью. Попробуйте ещё раз.');
  }

  return { url: `/uploads/${year}/${month}/${fileName}`, name: originalName, size };
}
