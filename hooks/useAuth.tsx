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
        console.log('useEffect - Verificando usuário logado...');
        const loggedInUser = authService.getCurrentUser();
        console.log('Usuário recuperado do sessionStorage:', loggedInUser);
        if (loggedInUser) {
            console.log('Usuário encontrado, atualizando estado...');
            setUser(loggedInUser);
            db.setCurrentUserId(loggedInUser.id);
        } else {
            console.log('Nenhum usuário encontrado no sessionStorage');
        }
    }, []);

    const login = async (email: string, password: string) => {
        console.log('Tentando fazer login com:', { email });
        const loggedInUser = await authService.login(email, password);
        console.log('Resposta do login:', loggedInUser ? 'Sucesso' : 'Falha');
        setUser(loggedInUser);
        if(loggedInUser) {
            console.log('Login bem-sucedido, redirecionando para dashboard');
            setCurrentPage('dashboard');
            db.setCurrentUserId(loggedInUser.id);
        } else {
            console.log('Falha no login - credenciais inválidas');
        }
        return loggedInUser;
    };

    const logout = () => {
        console.log('Realizando logout...');
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