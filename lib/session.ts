import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey= process.env.SESSION_SECRET!;
const encodedKey = new TextEncoder().encode(secretKey);

type SessionPayload = {
    userId: string;
    rol: 'admin' | 'residente';
    expiresAt: number;
};

export async function encrypt(payload: SessionPayload) {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload as SessionPayload;
    } catch {
        return null;
    }
}

export async function createSession(userId: string, rol: 'admin' | 'residente') {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime(); // 7 days desde ahora
    const session = await encrypt({ userId, rol, expiresAt });
    const cookiesStore = await cookies();

    cookiesStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    });
}    

export async function deleteSession() {
    const cookiesStore = await cookies();
    cookiesStore.delete('session');
}