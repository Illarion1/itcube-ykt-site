/**
 * Подключение сервера админ-панели к Vite.
 *
 * adminServer — при `npm run dev` и `npm run preview` адреса /api, /data и /uploads
 * обслуживает тот же сервер, что и на настоящем хостинге. Поэтому админ-панель
 * работает сразу, без отдельного запуска.
 *
 * staticSnapshot — при сборке статической версии (`npm run build:static`, `npm run build:gh`)
 * кладёт в папку dist текущие данные и загруженные файлы. Такой сайт можно выложить
 * на Vercel или GitHub Pages, но менять его через админ-панель нельзя.
 */
import { cp, mkdir, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';
import { collectionList } from '../src/admin/schema.ts';
import { createApp, resolveDataDir } from './app.ts';

type Next = (error?: unknown) => void;

const exists = (file: string) =>
  stat(file).then(
    () => true,
    () => false,
  );

export function adminServer(): Plugin {
  async function middleware(root: string) {
    const app = await createApp({ root });
    return (req: IncomingMessage, res: ServerResponse, next: Next) => {
      app.handle(req, res).then((handled) => handled || next(), next);
    };
  }

  return {
    name: 'itcube-admin-server',
    async configureServer(server) {
      server.middlewares.use(await middleware(server.config.root));
    },
    async configurePreviewServer(server) {
      server.middlewares.use(await middleware(server.config.root));
    },
  };
}

export function staticSnapshot(): Plugin {
  let root = '';
  let outDir = '';
  let enabled = false;

  return {
    name: 'itcube-static-snapshot',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
      enabled = config.mode === 'static';
    },
    async closeBundle() {
      if (!enabled) return;
      // Берём рабочие данные (data), а если их ещё нет — начальные (content)
      const dataDir = resolveDataDir(root);
      const hasData = await exists(path.join(dataDir, 'news.json'));
      const source = hasData ? dataDir : path.join(root, 'content');
      await mkdir(path.join(outDir, 'data'), { recursive: true });
      for (const { name } of collectionList) {
        await cp(path.join(source, `${name}.json`), path.join(outDir, 'data', `${name}.json`));
      }
      const uploads = path.join(dataDir, 'uploads');
      if (hasData && (await exists(uploads))) await cp(uploads, path.join(outDir, 'uploads'), { recursive: true });
      console.log(`Статическая версия: данные взяты из ${path.relative(root, source) || source}`);
    },
  };
}
