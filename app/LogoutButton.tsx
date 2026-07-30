import { logout } from './actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
