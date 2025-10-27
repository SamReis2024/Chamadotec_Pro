
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bars3Icon, UserCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="relative bg-white dark:bg-slate-800 shadow-sm z-10">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Hamburger menu for mobile */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Profile dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center space-x-2 text-left p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <UserCircleIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                            <div className="hidden sm:block">
                                <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name}</span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400">{user?.role}</span>
                            </div>
                        </button>

                        {dropdownOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-slate-700 ring-1 ring-black ring-opacity-5">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        logout();
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-600"
                                >
                                    <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                                    Sair
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
