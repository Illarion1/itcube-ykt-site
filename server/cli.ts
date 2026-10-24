/**
 * Создание пользователя админ-панели или смена его пароля:
 *   npm run admin
 * Команда задаст вопросы: логин, имя и пароль. Если такой логин уже есть, у него сменится пароль.
 *
 * Можно без вопросов, например в скрипте на сервере:
 *   npm run admin -- --login anna --name "Анна" --password "длинный-пароль"
 */
import './env.ts';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { resolveDataDir } from './app.ts';
import { checkCredentials, hashPassword, LOGIN_PATTERN, MIN_PASSWORD } from './auth.ts';
import { createStore } from './store.ts';
import type { User } from './store.ts';

const { values: args } = parseArgs({
  options: { login: { type: 'string' }, name: { type: 'string' }, password: { type: 'string' } },
});

const root = fileURLToPath(new URL('..', import.meta.url));
const store = createStore(resolveDataDir(root), path.join(root, 'content'));
await store.init();

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

// Обычный вопрос с ответом в одну строку
async function ask(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

// Вопрос, ответ на который не виден на экране (вместо букв — точки)
function askHidden(question: string): Promise<string> {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) return ask(question);
  return new Promise((resolve) => {
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\u0003') {
          stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') {
          if (value) {
            value = value.slice(0, -1);
            stdout.write('\b \b');
          }
        } else if (ch >= ' ') {
          value += ch;
          stdout.write('•');
        }
      }
    };
    stdin.on('data', onData);
  });
}

console.log('Пользователь админ-панели сайта IT-куб\n');

let login = (args.login ?? '').trim().toLowerCase();
while (!LOGIN_PATTERN.test(login)) {
  if (args.login) fail('Логин: от 2 до 32 латинских букв или цифр (можно точку, дефис, подчёркивание)');
  login = (await ask('Логин (латинскими буквами, например anna): ')).toLowerCase();
  if (!LOGIN_PATTERN.test(login)) console.log('  Нужны латинские буквы или цифры, от 2 до 32 символов.');
}

const existing = (await store.readUsers()).find((u) => u.login === login);
let name = args.name?.trim() ?? '';
if (existing) {
  console.log(`Пользователь «${login}» уже есть — зададим ему новый пароль.`);
  name ||= existing.name;
} else if (!name) {
  name = (await ask('Имя (как обращаться в админ-панели, например Анна Петровна): ')) || login;
}

let password = args.password ?? '';
if (args.password !== undefined) {
  const errors = checkCredentials(login, password);
  if (errors.password) fail(errors.password);
} else {
  for (;;) {
    password = await askHidden(`Пароль (не короче ${MIN_PASSWORD} символов): `);
    if (password.length < MIN_PASSWORD) {
      console.log(`  Слишком короткий: нужно хотя бы ${MIN_PASSWORD} символов.`);
      continue;
    }
    if ((await askHidden('Повторите пароль: ')) === password) break;
    console.log('  Пароли не совпали, попробуем ещё раз.');
  }
}

const hash = await hashPassword(password);
await store.updatePrivate<User, User>('users', async (users) => {
  const user: User = existing ? { ...existing, name, hash } : { login, name, hash, createdAt: new Date().toISOString() };
  return { list: existing ? users.map((u) => (u.login === login ? user : u)) : [...users, user], result: user };
});

console.log(`\n✓ Готово! ${existing ? 'Пароль изменён.' : `Пользователь «${login}» создан.`}`);
console.log('  Вход: адрес сайта + /admin, например http://localhost:5173/admin');
