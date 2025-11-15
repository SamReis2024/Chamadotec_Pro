import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDB';
import { Client } from '../types';
import { PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ClientForm from '../components/ClientForm';

const ClientsPage: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const initialNewClientState: Omit<Client, 'id' | 'createdAt'> = {
        name: '', contactPerson: '', agencyNumber: '', agencyName: '', email: '', phone: '', address: '', city: '', state: '',
    };
    const [newClient, setNewClient] = useState(initialNewClientState);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    useEffect(() => {
        let active = true;

        const loadClients = async () => {
            try {
                const data = await db.getClients();
                if (active) {
                    setClients(data);
                }
            } catch (error) {
                console.error('Erro ao carregar clientes:', error);
            }
        };

        loadClients();

        return () => {
            active = false;
        };
    }, []);

    const refreshClients = async () => {
        const data = await db.getClients();
        setClients(data);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (isEditModalOpen && editingClient) {
            setEditingClient({ ...editingClient, [name]: value });
        } else {
            setNewClient(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClient.name || !newClient.email) {
            alert('Por favor, preencha o nome e o email do cliente.');
            return;
        }
        try {
            await db.createClient(newClient);
            await refreshClients();
            setIsCreateModalOpen(false);
            setNewClient(initialNewClientState);
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            alert('Não foi possível criar o cliente.');
        }
    };

    const handleOpenEditModal = (client: Client) => {
        setEditingClient({ ...client });
        setIsEditModalOpen(true);
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;
        try {
            await db.updateClient(editingClient.id, editingClient);
            await refreshClients();
            setIsEditModalOpen(false);
            setEditingClient(null);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            alert('Não foi possível atualizar o cliente.');
        }
    };

    const handleOpenDeleteConfirm = (client: Client) => {
        setClientToDelete(client);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;
        try {
            await db.deleteClient(clientToDelete.id);
            await refreshClients();
            setIsDeleteConfirmOpen(false);
            setClientToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            alert('Não foi possível excluir o cliente.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Clientes</h1>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Adicionar Cliente
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Contato</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Localização</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{client.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{client.contactPerson}<br/>{client.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{client.city}, {client.state}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                    <button onClick={() => handleOpenEditModal(client)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleOpenDeleteConfirm(client)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isCreateModalOpen && (
                <ClientForm
                    client={newClient}
                    handleSubmit={handleCreateClient}
                    handleInputChange={handleInputChange}
                    closeModal={() => setIsCreateModalOpen(false)}
                    title="Novo Cliente"
                    submitButtonText="Salvar Cliente"
                />
            )}
            
            {isEditModalOpen && editingClient && (
                 <ClientForm
                    client={editingClient}
                    handleSubmit={handleUpdateClient}
                    handleInputChange={handleInputChange}
                    closeModal={() => setIsEditModalOpen(false)}
                    title="Editar Cliente"
                    submitButtonText="Atualizar Cliente"
                />
            )}

            {isDeleteConfirmOpen && clientToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="modal-title-delete">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white" id="modal-title-delete">
                                    Excluir Cliente
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Tem certeza que deseja excluir o cliente "{clientToDelete.name}"? Esta ação não pode ser desfeita.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button type="button" onClick={handleConfirmDelete} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm">
                                Excluir
                            </button>
                            <button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsPage;