'use client';

import { useActionState } from 'react';
import { signup } from './actions';

export default function RegistroPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }}>
      <h1>Registro de residente</h1>
      <form action={action}>
        <div>
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" type="text" />
        </div>
        {state?.errors?.nombre && <p>{state.errors.nombre[0]}</p>}

        <div>
          <label htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" />
        </div>
        {state?.errors?.email && <p>{state.errors.email[0]}</p>}

        <div>
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" />
        </div>
        {state?.errors?.password && (
          <div>
            <p>La contraseña debe:</p>
            <ul>
              {state.errors.password.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="carrera">Carrera</label>
          <input id="carrera" name="carrera" type="text" />
        </div>
        {state?.errors?.carrera && <p>{state.errors.carrera[0]}</p>}

        {state?.message && <p>{state.message}</p>}

        <button disabled={pending} type="submit">
          {pending ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>
    </div>
  );
}