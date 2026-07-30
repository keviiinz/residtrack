'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }}>
      <h1>Iniciar sesión</h1>
      <form action={action}>
        <div>
          <label htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" />
        </div>
        {state?.errors?.email && <p>{state.errors.email[0]}</p>}

        <div>
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" />
        </div>
        {state?.errors?.password && <p>{state.errors.password[0]}</p>}

        {state?.message && <p>{state.message}</p>}

        <button disabled={pending} type="submit">
          {pending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}