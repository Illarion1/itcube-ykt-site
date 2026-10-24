import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Copy, KeyRound, Trash2, UserPlus, Wand2 } from 'lucide-react';
import { formatDate } from '../lib/format';
import { ApiError, adminApi } from './api';
import type { SessionUser, UserInfo } from './api';
import { Btn, describedBy, FieldShell, inputClass, Modal, Notice, PageHeading, Spinner, useConfirm, useToast } from './ui';

// Пароль из 12 случайных букв и цифр без похожих символов (0/O, 1/l): k7mz-x9pq-4trs
function generatePassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8)].map((part) => part.join('')).join('-');
}

type Editing = { mode: 'create' } | { mode: 'edit'; user: UserInfo };

/** Пользователи админ-панели: кто может входить и менять сайт */
export function UsersPage({ me, onRenamed }: { me: SessionUser; onRenamed: (user: SessionUser) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserInfo[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Editing | null>(null);
  // Логин и пароль только что созданного пользователя — показываем один раз, чтобы передать сотруднику
  const [created, setCreated] = useState<{ login: string; password: string } | null>(null);

  const load = () =>
    adminApi
      .users()
      .then(({ users }) => setUsers(users))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить список'));

  useEffect(() => {
    void load();
  }, []);

  async function remove(user: UserInfo) {
    const ok = await confirm({
      title: `Удалить пользователя «${user.name}»?`,
      text: `Логин ${user.login} больше не сможет входить в админ-панель.`,
      confirmLabel: 'Удалить',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.removeUser(user.login);
      toast({ tone: 'success', text: `Пользователь «${user.name}» удалён` });
      void load();
    } catch (err) {
      toast({ tone: 'error', text: err instanceof ApiError ? err.message : 'Не удалось удалить' });
    }
  }

  return (
    <>
      <PageHeading
        title="Пользователи и пароли"
        description="Каждому сотруднику, который меняет сайт, лучше завести свой логин: так видно, кто что менял, и доступ легко отключить."
        actions={
          <Btn variant="primary" icon={UserPlus} onClick={() => setEditing({ mode: 'create' })}>
            Добавить пользователя
          </Btn>
        }
      />

      {created && (
        <div className="mb-6">
          <Notice>
            <p className="font-semibold">Пользователь создан. Передайте сотруднику данные для входа:</p>
            <p className="mt-2">
              Адрес: <b>{window.location.origin}/admin</b>
              <br />
              Логин: <b>{created.login}</b>
              <br />
              Пароль: <b>{created.password}</b>
            </p>
            <p className="mt-2">Пароль больше нигде не показывается — сохраните его сейчас. Сменить пароль можно в любой момент.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn
                size="sm"
                icon={Copy}
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(`Адрес: ${window.location.origin}/admin\nЛогин: ${created.login}\nПароль: ${created.password}`)
                    .then(() => toast({ tone: 'success', text: 'Скопировано' }));
                }}
              >
                Скопировать
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => setCreated(null)}>
                Скрыть
              </Btn>
            </div>
          </Notice>
        </div>
      )}

      {error && <Notice tone="error">{error}</Notice>}
      {!users && !error && <Spinner />}

      {users && (
        <ul className="overflow-hidden rounded-card bg-white">
          {users.map((user) => (
            <li key={user.login} className="flex flex-wrap items-center gap-3 border-b border-line p-4 last:border-b-0 sm:px-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface font-display text-sm font-semibold" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {user.name}
                  {user.login === me.login && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold">это вы</span>}
                </span>
                <span className="text-sm text-muted">
                  логин {user.login} · добавлен {formatDate(user.createdAt)}
                </span>
              </span>
              <span className="flex gap-1">
                <Btn size="sm" variant="ghost" icon={KeyRound} onClick={() => setEditing({ mode: 'edit', user })}>
                  {user.login === me.login ? 'Сменить пароль' : 'Изменить'}
                </Btn>
                {user.login !== me.login && <Btn size="sm" variant="danger" icon={Trash2} onClick={() => void remove(user)} aria-label={`Удалить ${user.name}`} />}
              </span>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <UserDialog
          editing={editing}
          isMe={editing.mode === 'edit' && editing.user.login === me.login}
          onClose={() => setEditing(null)}
          onDone={(user, password) => {
            setEditing(null);
            void load();
            if (editing.mode === 'create') setCreated({ login: user.login, password });
            else toast({ tone: 'success', text: password ? 'Пароль изменён' : 'Сохранено' });
            if (user.login === me.login) onRenamed(user);
          }}
        />
      )}
    </>
  );
}

function UserDialog({
  editing,
  isMe,
  onClose,
  onDone,
}: {
  editing: Editing;
  isMe: boolean;
  onClose: () => void;
  onDone: (user: SessionUser, password: string) => void;
}) {
  const isCreate = editing.mode === 'create';
  const [name, setName] = useState(isCreate ? '' : editing.user.name);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const { user } = isCreate
        ? await adminApi.createUser({ name, login, password })
        : await adminApi.updateUser(editing.user.login, { name, ...(password ? { password } : {}) });
      onDone(user, password);
    } catch (err) {
      setErrors(err instanceof ApiError ? { ...err.fields, ...(Object.keys(err.fields).length ? {} : { form: err.message }) } : { form: 'Не получилось сохранить' });
      setBusy(false);
    }
  }

  const title = isCreate ? 'Новый пользователь' : isMe ? 'Мой профиль и пароль' : `Пользователь ${editing.user.login}`;

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="mt-5 space-y-5" noValidate>
        <FieldShell id="user-name" label="Имя" hint="Как обращаться: например, Анна Петровна" error={errors.name}>
          <input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('user-name', 'hint', errors.name)}
          />
        </FieldShell>
        {isCreate && (
          <FieldShell id="user-login" label="Логин" hint="Латинскими буквами, например anna" error={errors.login}>
            <input
              id="user-login"
              value={login}
              onChange={(e) => setLogin(e.target.value.toLowerCase().trim())}
              autoCapitalize="none"
              spellCheck={false}
              className={inputClass}
              aria-invalid={Boolean(errors.login)}
              aria-describedby={describedBy('user-login', 'hint', errors.login)}
            />
          </FieldShell>
        )}
        <FieldShell
          id="user-password"
          label={isCreate ? 'Пароль' : 'Новый пароль'}
          hint={isCreate ? 'Не короче 8 символов. Можно придумать автоматически.' : 'Оставьте пустым, если пароль менять не нужно.'}
          error={errors.password}
        >
          <div className="flex gap-2">
            <input
              id="user-password"
              type="text"
              autoComplete="new-password"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={describedBy('user-password', 'hint', errors.password)}
            />
            <Btn icon={Wand2} onClick={() => setPassword(generatePassword())} title="Придумать пароль" aria-label="Придумать пароль" />
          </div>
        </FieldShell>
        {isMe && password && <Notice>После смены пароля вы останетесь в админ-панели, а на других устройствах нужно будет войти заново.</Notice>}
        {errors.form && <Notice tone="error">{errors.form}</Notice>}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>
            Отмена
          </Btn>
          <Btn type="submit" variant="primary" loading={busy}>
            {isCreate ? 'Создать' : 'Сохранить'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
