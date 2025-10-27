
import { User } from '../types';
import { db } from './mockDB';

const USER_SESSION_KEY = 'helpdesk_pro_user';

class AuthService {
    public async login(email: string, password: string): Promise<User | null> {
        return new Promise((resolve) => {
            setTimeout(() => { // Simulate network delay
                const user = db.getUserByEmail(email);
                if (user && user.password === password) {
                    const userToStore = { ...user };
                    delete userToStore.password;
                    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(userToStore));
                    resolve(userToStore);
                } else {
                    resolve(null);
                }
            }, 500);
        });
    }

    public logout(): void {
        sessionStorage.removeItem(USER_SESSION_KEY);
    }

    public getCurrentUser(): User | null {
        const userJson = sessionStorage.getItem(USER_SESSION_KEY);
        if (userJson) {
            return JSON.parse(userJson);
        }
        return null;
    }
}

export const authService = new AuthService();
