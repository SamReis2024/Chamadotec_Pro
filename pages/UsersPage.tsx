import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDB';
import { User, Role } from '../types';
import { PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import UserForm from '../components/UserForm';
import { useAuth } from '../hooks/useAuth';

const roleColors: Record<Role, string> = {
    [Role.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [Role.MANAGER_ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [Role.MANAGER]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    [Role.TECHNICIAN]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const UsersPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const initialNewUserState: Omit<User, 'id'|'createdAt'> = { name: '', email: '', password: '', role: Role.TECHNICIAN };
    const [newUser, setNewUser] = useState(initialNewUserState);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    useEffect(() => {
        let active = true;

        const loadUsers = async () => {
            try {
                const data = await db.getUsers();
                if (active) {
                    setUsers(data);
                }
            } catch (error) {
                console.error('Erro ao carregar usuários:', error);
            }
        };

        loadUsers();

        return () => {
            active = false;
        };
    }, []);

    const refreshUsers = async () => {
        const data = await db.getUsers();
        setUsers(data);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if(isEditModalOpen && editingUser) {
            setEditingUser({ ...editingUser, [name]: value });
        } else {
            setNewUser(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            alert('Usuário não autenticado.');
            return;
        }
        
        // Verificar permissões de criação baseadas no role
        const allowedRolesForCreation: Role[] = [];
        if (currentUser.role === Role.ADMIN) {
            allowedRolesForCreation.push(Role.ADMIN, Role.MANAGER_ADMIN, Role.MANAGER, Role.TECHNICIAN);
        } else if (currentUser.role === Role.MANAGER_ADMIN) {
            allowedRolesForCreation.push(Role.MANAGER_ADMIN, Role.MANAGER, Role.TECHNICIAN);
        } else {
            alert('Você não tem permissão para criar usuários.');
            return;
        }
        
        if (!allowedRolesForCreation.includes(newUser.role)) {
            alert('Você não tem permissão para criar usuários com este papel.');
            return;
        }
        
        if(!newUser.name || !newUser.email || !newUser.password) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }
        try {
            await db.createUser(newUser);
            await refreshUsers();
            setIsCreateModalOpen(false);
            setNewUser(initialNewUserState);
        } catch (error: any) {
            console.error('Erro ao criar usuário:', error);
            const errorMessage = error?.message || 'Não foi possível criar o usuário.';
            alert(errorMessage);
        }
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser({ ...user });
        setIsEditModalOpen(true);
    };
    
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingUser) return;
        const { password, ...userWithoutPassword } = editingUser;
        try {
            await db.updateUser(editingUser.id, userWithoutPassword);
            await refreshUsers();
            setIsEditModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            alert('Não foi possível atualizar o usuário.');
        }
    }

    const handleOpenDeleteConfirm = (user: User) => {
        setUserToDelete(user);
        setIsDeleteConfirmOpen(true);
    }
    
    const handleConfirmDelete = async () => {
        if(!userToDelete) return;
        try {
            await db.deleteUser(userToDelete.id);
            await refreshUsers();
            setIsDeleteConfirmOpen(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Não foi possível excluir o usuário.');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Usuários</h1>
                {currentUser && (currentUser.role === Role.ADMIN || currentUser.role === Role.MANAGER_ADMIN) && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Adicionar Usuário
                    </button>
                )}
            </div>
            
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Função</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Data de Criação</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                    <button onClick={() => handleOpenEditModal(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleOpenDeleteConfirm(user)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {isCreateModalOpen && currentUser && (
                <UserForm 
                    user={newUser} 
                    handleSubmit={handleCreateUser} 
                    handleInputChange={handleInputChange} 
                    closeModal={() => setIsCreateModalOpen(false)} 
                    title="Novo Usuário" 
                    submitButtonText="Salvar Usuário"
                    currentUserRole={currentUser.role}
                />
            )}

            {isEditModalOpen && editingUser && currentUser && (
                 <UserForm 
                    user={editingUser} 
                    handleSubmit={handleUpdateUser} 
                    handleInputChange={handleInputChange} 
                    closeModal={() => setIsEditModalOpen(false)} 
                    title="Editar Usuário" 
                    submitButtonText="Atualizar Usuário"
                    currentUserRole={currentUser.role}
                />
            )}

            {isDeleteConfirmOpen && userToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">
                                    Excluir Usuário
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Tem certeza que deseja excluir o usuário "{userToDelete.name}"? Esta ação não pode ser desfeita.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button type="button" onClick={handleConfirmDelete} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:w-auto sm:text-sm">
                                Excluir
                            </button>
                            <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto sm:text-sm">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;