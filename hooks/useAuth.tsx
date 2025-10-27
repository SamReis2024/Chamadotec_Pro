import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Page } from '../types';
import { authService } from '../services/authService';
import { db } from '../services/mockDB';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<User | null>;
    logout: () => void;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');

    useEffect(() => {
        const loggedInUser = authService.getCurrentUser();
        if (loggedInUser) {
            setUser(loggedInUser);
            db.setCurrentUserId(loggedInUser.id);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const loggedInUser = await authService.login(email, password);
        setUser(loggedInUser);
        if(loggedInUser) {
            setCurrentPage('dashboard');
            db.setCurrentUserId(loggedInUser.id);
        }
        return loggedInUser;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        db.clearCurrentUserId();
    };
    
    return (
        <AuthContext.Provider value={{ user, login, logout, currentPage, setCurrentPage }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};