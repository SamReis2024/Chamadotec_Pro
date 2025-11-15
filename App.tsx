import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import TicketsPage from './pages/TicketsPage';
import ClientsPage from './pages/ClientsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { Role } from './types';

const AppContent: React.FC = () => {
    const { user, currentPage, setCurrentPage } = useAuth();
    
    console.log('Usuário atual:', user);
    console.log('Página atual:', currentPage);

    if (!user) {
        console.log('Nenhum usuário autenticado, redirecionando para login');
        return <LoginPage />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage />;
            case 'tickets':
                return <TicketsPage />;
            case 'clients':
                if (user.role === Role.ADMIN || user.role === Role.MANAGER) {
                    return <ClientsPage />;
                }
                break;
            case 'users':
                if (user.role === Role.ADMIN) {
                    return <UsersPage />;
                }
                break;
            case 'audit':
                if (user.role === Role.ADMIN) {
                    return <AuditPage />;
                }
                break;
            case 'reports':
                return <ReportsPage />;
            case 'settings':
                if (user.role === Role.ADMIN) {
                    return <SettingsPage />;
                }
                break;
            default:
                return <DashboardPage />;
        }
    };

    return (
        <Layout>
            {renderPage()}
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;