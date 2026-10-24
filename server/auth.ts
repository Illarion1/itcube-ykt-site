/**
 * Вход в админ-панель: проверка пароля, сессии и защита от подбора пароля.
 *
 * Сессия — подписанная секретным ключом строка в cookie (HttpOnly: скрипты страницы её не видят).
 * В подпись входит отпечаток пароля, поэтому после смены пароля все старые входы перестают работать.
 */
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { promisify } from 'node:util';
import { clientIp, getCookie, HttpError, isHttps, serializeCookie } from './http.ts';
import type { Store, User } from './store.ts';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;

const COOKIE = 'itcube_session';
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1 };

export const LOGIN_PATTERN = /^[a-z0-9._-]{2,32}$/;
export const MIN_PASSWORD = 8;

/** Пароль → отпечаток вида scrypt$соль$хэш */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length, SCRYPT);
  return timingSafeEqual(actual, expected);
}

/** Проверяет логин и пароль нового пользователя; возвращает ошибки по полям (пусто — всё в порядке) */
export function checkCredentials(login: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!LOGIN_PATTERN.test(login)) errors.login = 'Логин: от 2 до 32 латинских букв или цифр (можно точку, дефис, подчёркивание)';
  if (password.length < MIN_PASSWORD) errors.password = `Пароль должен быть не короче ${MIN_PASSWORD} символов`;
  if (password.length > 200) errors.password = 'Слишком длинный пароль';
  return errors;
}

// Отпечаток, по которому проверяется сессия. Отпечаток пароля пользователя — часть подписи
function sign(secret: string, login: string, expires: number, user: User) {
  return createHmac('sha256', secret).update(`${login}\n${expires}\n${user.hash}`).digest('base64url');
}

// Защита от подбора: не больше 10 неудачных попыток за 15 минут с одного адреса
const FAIL_LIMIT = 10;
const FAIL_WINDOW = 15 * 60 * 1000;

export function createAuth(store: Store, secret: string) {
  const failures = new Map<string, { count: number; until: number }>();

  function issue(req: IncomingMessage, res: ServerResponse, user: User) {
    const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    const token = `${Buffer.from(user.login).toString('base64url')}.${expires}.${sign(secret, user.login, expires, user)}`;
    res.setHeader('Set-Cookie', serializeCookie(COOKIE, token, { maxAge: SESSION_DAYS * 24 * 60 * 60, secure: isHttps(req) }));
  }

  function clear(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('Set-Cookie', serializeCookie(COOKIE, '', { maxAge: 0, secure: isHttps(req) }));
  }

  /** Пользователь, который вошёл (или null) */
  async function current(req: IncomingMessage): Promise<User | null> {
    const [encodedLogin, expiresText, signature] = (getCookie(req, COOKIE) ?? '').split('.');
    const expires = Number(expiresText);
    if (!encodedLogin || !signature || !(expires > Date.now())) return null;
    const login = Buffer.from(encodedLogin, 'base64url').toString('utf8');
    const user = (await store.readUsers()).find((u) => u.login === login);
    if (!user) return null;
    const expected = Buffer.from(sign(secret, login, expires, user));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual) ? user : null;
  }

  async function login(req: IncomingMessage, res: ServerResponse, loginRaw: string, password: string): Promise<User> {
    const ip = clientIp(req);
    const record = failures.get(ip);
    if (record && record.count >= FAIL_LIMIT && record.until > Date.now()) {
      throw new HttpError(429, 'Слишком много неудачных попыток. Подождите 15 минут и попробуйте снова.');
    }

    const login = loginRaw.trim().toLowerCase();
    const user = (await store.readUsers()).find((u) => u.login === login);
    // Даже если такого логина нет, проверяем пароль «вхолостую» — чтобы по времени ответа
    // нельзя было понять, существует ли логин
    const ok = await verifyPassword(password, user?.hash ?? 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA');
    if (!user || !ok) {
      const fresh = !record || record.until <= Date.now();
      failures.set(ip, { count: fresh ? 1 : record.count + 1, until: fresh ? Date.now() + FAIL_WINDOW : record.until });
      throw new HttpError(401, 'Неверный логин или пароль');
    }

    failures.delete(ip);
    issue(req, res, user);
    return user;
  }

  return { current, login, issue, clear };
}
