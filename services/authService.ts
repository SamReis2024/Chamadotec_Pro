
import { User } from '../types';
import { db } from './mockDB';

const USER_SESSION_KEY = 'helpdesk_pro_user';

const serializeUser = (user: User) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
});

const deserializeUser = (raw: any): User => ({
    ...raw,
    createdAt: new Date(raw.createdAt),
});

class AuthService {
    public async login(email: string, password: string): Promise<User | null> {
        const userRecord = await db.getUserByEmail(email);

        if (!userRecord || userRecord.password !== password) {
            return null;
        }

        const { password: _, ...userWithoutPassword } = userRecord;
        const safeUser: User = userWithoutPassword;

        sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(serializeUser(safeUser)));
        return safeUser;
    }

    public logout(): void {
        sessionStorage.removeItem(USER_SESSION_KEY);
    }

    public getCurrentUser(): User | null {
        const userJson = sessionStorage.getItem(USER_SESSION_KEY);
        if (!userJson) {
            return null;
        }

        try {
            const parsed = JSON.parse(userJson);
            return deserializeUser(parsed);
        } catch (err) {
            console.error('Falha ao desserializar usuário da sessão:', err);
            sessionStorage.removeItem(USER_SESSION_KEY);
            return null;
        }
    }
}

export const authService = new AuthService();
