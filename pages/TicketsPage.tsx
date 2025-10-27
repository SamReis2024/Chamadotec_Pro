import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/mockDB';
import { Ticket, User, Client, Role, Status, Priority } from '../types';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../hooks/useAuth';

const statusColors: Record<Status, string> = {
    [Status.OPEN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [Status.IN_PROGRESS]: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    [Status.CLOSED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [Status.PENDING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const priorityColors: Record<Priority, string> = {
    [Priority.LOW]: 'border-slate-500',
    [Priority.MEDIUM]: 'border-yellow-500',
    [Priority.HIGH]: 'border-orange-500',
    [Priority.URGENT]: 'border-red-500',
};

interface TicketCardProps {
    ticket: Ticket;
    technicianName: string;
    clientName: string;
    onEdit: () => void;
    onDelete: () => void;
    userRole: Role;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, technicianName, clientName, onEdit, onDelete, userRole }) => (
    <div className={`bg-white dark:bg-slate-800 shadow-md rounded-lg p-4 flex flex-col justify-between border-l-4 ${priorityColors[ticket.priority]}`}>
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{ticket.title}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[ticket.status]}`}>
                    {ticket.status}
                </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{clientName} - {ticket.location}</p>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-2 line-clamp-2">{ticket.description}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end text-sm text-slate-500 dark:text-slate-400">
            <div className="flex flex-col">
                <span>Técnico: {technicianName}</span>
                <span className="mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
                <button onClick={onEdit} className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" aria-label="Editar chamado">
                    <PencilIcon className="h-5 w-5" />
                </button>
                {(userRole === Role.ADMIN || userRole === Role.MANAGER) && (
                    <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label="Excluir chamado">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    </div>
);


const TicketsPage: React.FC = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [technicianFilter, setTechnicianFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('date-desc');
    
    const [showDeleteToast, setShowDeleteToast] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const initialNewTicketState: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
        title: '',
        description: '',
        clientId: '',
        technicianId: null,
        status: Status.OPEN,
        priority: Priority.MEDIUM,
        location: '',
    };
    const [newTicket, setNewTicket] = useState(initialNewTicketState);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
    
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);

    useEffect(() => {
        if (showDeleteToast) {
            const timer = setTimeout(() => setShowDeleteToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showDeleteToast]);

    useEffect(() => {
        setTickets(db.getTickets());
        setUsers(db.getUsers());
        setClients(db.getClients());
    }, []);

    const technicians = useMemo(() => users.filter(u => u.role === Role.TECHNICIAN), [users]);
    const locations = useMemo(() => [...new Set(tickets.map(t => t.location))], [tickets]);

    const filteredTickets = useMemo(() => {
        const priorityOrder: Record<Priority, number> = {
            [Priority.URGENT]: 4,
            [Priority.HIGH]: 3,
            [Priority.MEDIUM]: 2,
            [Priority.LOW]: 1,
        };

        return tickets
            .filter(ticket => {
                if (!debouncedSearchTerm) return true;
                const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
                return ticket.title.toLowerCase().includes(lowerCaseSearch) || ticket.description.toLowerCase().includes(lowerCaseSearch);
            })
            .filter(ticket => !technicianFilter || ticket.technicianId === technicianFilter)
            .filter(ticket => !locationFilter || ticket.location === locationFilter)
            .filter(ticket => !statusFilter || ticket.status === statusFilter)
            .filter(ticket => !priorityFilter || ticket.priority === priorityFilter)
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'date-asc':
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    case 'priority-desc':
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    case 'priority-asc':
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    case 'status-asc':
                        return a.status.localeCompare(b.status);
                    case 'date-desc':
                    default:
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
            });
    }, [tickets, debouncedSearchTerm, technicianFilter, locationFilter, statusFilter, priorityFilter, sortOrder]);
    
    const clearFilters = () => {
        setSearchTerm('');
        setTechnicianFilter('');
        setLocationFilter('');
        setStatusFilter('');
        setPriorityFilter('');
        setSortOrder('date-desc');
    };

    const getUserName = (id: string | null) => users.find(u => u.id === id)?.name || 'Não atribuído';
    const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconhecido';

    const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'clientId') {
            const selectedClient = clients.find(c => c.id === value);
            const location = selectedClient ? `${selectedClient.city}, ${selectedClient.state}` : '';
            setNewTicket(prev => ({
                ...prev,
                clientId: value,
                location: location
            }));
        } else {
            setNewTicket(prev => ({
                ...prev,
                [name]: name === 'technicianId' ? (value === '' ? null : value) : value
            }));
        }
    };

    const handleCreateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicket.title || !newTicket.description || !newTicket.clientId) {
            alert('Por favor, preencha o título, descrição e cliente.');
            return;
        }
        db.createTicket(newTicket);
        setTickets(db.getTickets());
        setIsCreateModalOpen(false);
        setNewTicket(initialNewTicketState);
    };

    const handleOpenEditModal = (ticket: Ticket) => {
        setEditingTicket({ ...ticket });
        setIsEditModalOpen(true);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editingTicket) return;
        const { name, value } = e.target;
        
        const newEditingTicket = { ...editingTicket, [name]: name === 'technicianId' ? (value === '' ? null : value) : value };

        if (name === 'clientId') {
            const selectedClient = clients.find(c => c.id === value);
            if(selectedClient){
                 newEditingTicket.location = `${selectedClient.city}, ${selectedClient.state}`;
            }
        }
        
        setEditingTicket(newEditingTicket);
    };

    const handleUpdateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTicket) return;
        db.updateTicket(editingTicket.id, editingTicket);
        setTickets(db.getTickets());
        setIsEditModalOpen(false);
        setEditingTicket(null);
    };
    
    const handleOpenDeleteConfirm = (ticket: Ticket) => {
        setTicketToDelete(ticket);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!ticketToDelete) return;
        db.deleteTicket(ticketToDelete.id);
        setTickets(db.getTickets());
        setIsDeleteConfirmOpen(false);
        setTicketToDelete(null);
        setShowDeleteToast(true);
    };


    return (
        <div className="space-y-6">
             {/* Success Toast */}
            {showDeleteToast && (
                 <div className="fixed top-5 right-5 z-[100] bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg flex items-center animate-fade-in-out">
                    <CheckCircleIcon className="h-6 w-6 mr-2" />
                    <span>Chamado excluído com sucesso!</span>
                </div>
            )}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gerenciar Chamados</h1>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Adicionar Chamado
                </button>
            </div>
            
            {/* Filters */}
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
                    {/* Search */}
                    <div className="relative sm:col-span-2 lg:col-span-4 xl:col-span-2">
                         <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pesquisar</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input 
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por título ou descrição..."
                                className="block w-full rounded-md border-slate-300 bg-white py-2 pl-10 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 sm:text-sm"
                            />
                        </div>
                    </div>
                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                        <select id="status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="">Todos</option>
                            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridade</label>
                        <select id="priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="">Todas</option>
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {/* Technician */}
                    <div>
                        <label htmlFor="technician" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Técnico</label>
                        <select id="technician" value={technicianFilter} onChange={e => setTechnicianFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="">Todos</option>
                            {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                        </select>
                    </div>
                    {/* Sort */}
                    <div>
                        <label htmlFor="sort" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ordenar por</label>
                        <select id="sort" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="date-desc">Data (Mais Recente)</option>
                            <option value="date-asc">Data (Mais Antigo)</option>
                            <option value="priority-desc">Prioridade (Maior)</option>
                            <option value="priority-asc">Prioridade (Menor)</option>
                            <option value="status-asc">Status (A-Z)</option>
                        </select>
                    </div>
                    {/* Clear Filters */}
                    <div>
                        <label className="block text-sm font-medium text-transparent dark:text-transparent">Limpar</label>
                         <button onClick={clearFilters} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Tickets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTickets.length > 0 ? (
                    filteredTickets.map(ticket => (
                        <TicketCard 
                            key={ticket.id} 
                            ticket={ticket} 
                            technicianName={getUserName(ticket.technicianId)}
                            clientName={getClientName(ticket.clientId)}
                            onEdit={() => handleOpenEditModal(ticket)}
                            onDelete={() => handleOpenDeleteConfirm(ticket)}
                            userRole={user!.role}
                        />
                    ))
                ) : (
                    <p className="col-span-full text-center text-slate-500 dark:text-slate-400">Nenhum chamado encontrado com os filtros selecionados.</p>
                )}
            </div>

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 sm:pt-20" role="dialog" aria-modal="true" aria-labelledby="modal-title-create">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 id="modal-title-create" className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Novo Chamado</h2>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label htmlFor="title-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
                                <input type="text" name="title" id="title-create" value={newTicket.title} onChange={handleCreateInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                            </div>
                             <div>
                                <label htmlFor="description-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
                                <textarea name="description" id="description-create" value={newTicket.description} onChange={handleCreateInputChange} required rows={4} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="clientId-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
                                <select name="clientId" id="clientId-create" value={newTicket.clientId} onChange={handleCreateInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option value="" disabled>Selecione um cliente</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="location-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Localidade</label>
                                <input type="text" name="location" id="location-create" value={newTicket.location} onChange={handleCreateInputChange} required placeholder="Selecione um cliente para preencher" className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="technicianId-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Técnico</label>
                                <select name="technicianId" id="technicianId-create" value={newTicket.technicianId || ''} onChange={handleCreateInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option value="">Não atribuído</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="priority-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridade</label>
                                    <select name="priority" id="priority-create" value={newTicket.priority} onChange={handleCreateInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="status-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                                    <select name="status" id="status-create" value={newTicket.status} onChange={handleCreateInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                        {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                    Salvar Chamado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Ticket Modal */}
            {isEditModalOpen && editingTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 sm:pt-20" role="dialog" aria-modal="true" aria-labelledby="modal-title-edit">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 id="modal-title-edit" className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Editar Chamado</h2>
                        <form onSubmit={handleUpdateTicket} className="space-y-4">
                            <div>
                                <label htmlFor="title-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
                                <input type="text" name="title" id="title-edit" value={editingTicket.title} onChange={handleEditInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="description-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
                                <textarea name="description" id="description-edit" value={editingTicket.description} onChange={handleEditInputChange} required rows={4} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="clientId-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
                                <select name="clientId" id="clientId-edit" value={editingTicket.clientId} onChange={handleEditInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option value="" disabled>Selecione um cliente</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="location-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Localidade</label>
                                <input type="text" name="location" id="location-edit" value={editingTicket.location} onChange={handleEditInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="technicianId-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Técnico</label>
                                <select name="technicianId" id="technicianId-edit" value={editingTicket.technicianId || ''} onChange={handleEditInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option value="">Não atribuído</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="priority-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridade</label>
                                    <select name="priority" id="priority-edit" value={editingTicket.priority} onChange={handleEditInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="status-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                                    <select name="status" id="status-edit" value={editingTicket.status} onChange={handleEditInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                        {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                    Atualizar Chamado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && ticketToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="modal-title-delete">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white" id="modal-title-delete">
                                    Excluir Chamado
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Tem certeza que deseja excluir o chamado "{ticketToDelete.title}"? Esta ação não pode ser desfeita.
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

export default TicketsPage;