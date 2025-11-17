import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role, Page } from '../types';
import { ChartPieIcon, TicketIcon, UserGroupIcon, BuildingOfficeIcon, XMarkIcon, ShieldCheckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface NavItemConfig {
    page: Page;
    label: string;
    icon: React.ElementType;
    roles: Role[];
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const { user, currentPage, setCurrentPage } = useAuth();

    const handleNavigation = (page: Page) => {
        setCurrentPage(page);
        setSidebarOpen(false);
    };

    const navItems: NavItemConfig[] = [
        { page: 'dashboard', label: 'Dashboard', icon: ChartPieIcon, roles: [Role.ADMIN, Role.MANAGER_ADMIN, Role.MANAGER, Role.TECHNICIAN] },
        { page: 'tickets', label: 'Chamados', icon: TicketIcon, roles: [Role.ADMIN, Role.MANAGER_ADMIN, Role.MANAGER, Role.TECHNICIAN] },
        { page: 'reports', label: 'Relatórios', icon: ChartPieIcon, roles: [Role.ADMIN, Role.MANAGER_ADMIN, Role.MANAGER, Role.TECHNICIAN] },
        { page: 'clients', label: 'Clientes', icon: BuildingOfficeIcon, roles: [Role.ADMIN, Role.MANAGER_ADMIN, Role.MANAGER] },
        { page: 'users', label: 'Usuários', icon: UserGroupIcon, roles: [Role.ADMIN, Role.MANAGER_ADMIN] },
        { page: 'audit', label: 'Auditoria', icon: ShieldCheckIcon, roles: [Role.ADMIN] },
        { page: 'settings', label: 'Configurações', icon: Cog6ToothIcon, roles: [Role.ADMIN] },
    ];

    const availableNavItems = navItems.filter(item => user && item.roles.includes(user.role));

    return (
        <>
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-800">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        >
                            <span className="sr-only">Close sidebar</span>
                            <XMarkIcon className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex-shrink-0 flex items-center px-4">
                            <h1 className="text-2xl font-bold text-white">HelpDesk Pro</h1>
                        </div>
                        <nav className="mt-5 px-2 space-y-1">
                            {availableNavItems.map(item => (
                                <NavItem key={item.page} {...item} currentPage={currentPage} handleNavigation={handleNavigation} />
                            ))}
                        </nav>
                    </div>
                </div>
                <div className="flex-shrink-0 w-14"></div>
            </div>

            {/* Static sidebar for desktop */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <div className="flex flex-col h-0 flex-1 bg-slate-800">
                        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                            <div className="flex items-center flex-shrink-0 px-4">
                               <h1 className="text-2xl font-bold text-white">HelpDesk Pro</h1>
                            </div>
                            <nav className="mt-5 flex-1 px-2 bg-slate-800 space-y-1">
                                {availableNavItems.map(item => (
                                    <NavItem key={item.page} {...item} currentPage={currentPage} handleNavigation={handleNavigation} />
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


interface NavItemProps {
    page: Page;
    label: string;
    icon: React.ElementType;
    currentPage: Page;
    handleNavigation: (page: Page) => void;
}

const NavItem: React.FC<NavItemProps> = ({ page, label, icon: Icon, currentPage, handleNavigation }) => {
    const isActive = currentPage === page;
    return (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleNavigation(page); }}
            className={`
                ${isActive ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
            `}
        >
            <Icon className={`mr-3 h-6 w-6 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} />
            {label}
        </a>
    );
};


export default Sidebar;