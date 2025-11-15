import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/mockDB';
import { settingsService } from '../services/settingsService';
import { Ticket, User, Client, Role, Status, Priority } from '../types';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, PrinterIcon } from '@heroicons/react/24/outline';
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
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{ticket.title}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Código: {ticket.code}</span>
                </div>
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
    const initialNewTicketState: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'code'> = {
        title: '',
        description: '',
        clientId: '',
        technicianId: null,
        status: Status.OPEN,
        priority: Priority.MEDIUM,
        location: '',
        foundDefect: '',
        executedServices: '',
        technicianNotes: '',
        clientNotes: '',
        equipmentInfo: '',
        underWarranty: false,
        working: false,
        serviceCompleted: false,
        verifiedByClient: false,
        technicianSignature: '',
        clientSignature: '',
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
        let active = true;

        const loadData = async () => {
            try {
                const [ticketsData, usersData, clientsData] = await Promise.all([
                    db.getTickets(),
                    db.getUsers(),
                    db.getClients(),
                ]);

                if (!active) {
                    return;
                }

                setTickets(ticketsData);
                setUsers(usersData);
                setClients(clientsData);
            } catch (error) {
                console.error('Erro ao carregar dados iniciais:', error);
            }
        };

        loadData();

        return () => {
            active = false;
        };
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
                const q = debouncedSearchTerm.toLowerCase();
                const techName = getUserName(ticket.technicianId).toLowerCase();
                const clientName = getClientName(ticket.clientId).toLowerCase();
                const haystack = [
                    ticket.code,
                    ticket.title,
                    ticket.description,
                    clientName,
                    techName,
                    ticket.location,
                    ticket.foundDefect || '',
                    ticket.executedServices || '',
                    ticket.technicianNotes || '',
                    ticket.clientNotes || '',
                    ticket.equipmentInfo || '',
                ].join(' ').toLowerCase();
                return haystack.includes(q);
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

    function getUserName(id: string | null) {
        return users.find(u => u.id === id)?.name || 'Não atribuído';
    }
    function getClientName(id: string) {
        return clients.find(c => c.id === id)?.name || 'Desconhecido';
    }

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
            const booleanFields = new Set(['underWarranty','working','serviceCompleted','verifiedByClient']);
            setNewTicket(prev => ({
                ...prev,
                [name]: name === 'technicianId' ? (value === '' ? null : value) : (booleanFields.has(name) ? value === 'true' : value)
            }));
        }
    };

    const refreshTickets = async () => {
        const freshTickets = await db.getTickets();
        setTickets(freshTickets);
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicket.title || !newTicket.description || !newTicket.clientId) {
            alert('Por favor, preencha o título, descrição e cliente.');
            return;
        }
        try {
            await db.createTicket(newTicket);
            await refreshTickets();
            setIsCreateModalOpen(false);
            setNewTicket(initialNewTicketState);
        } catch (error) {
            console.error('Erro ao criar chamado:', error);
            alert('Não foi possível criar o chamado.');
        }
    };

    const escapeHtml = (text: string | undefined | null): string => {
        if (!text) return '-';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const printTicket = (ticket: Partial<Ticket> & Pick<Ticket, 'title' | 'description' | 'clientId' | 'status' | 'priority' | 'location'>) => {
        const selectedClient = clients.find(c => c.id === ticket.clientId);
        const selectedTechnician = technicians.find(t => t.id === ticket.technicianId);
        const now = new Date();
        const printSettings = settingsService.getPrintHeaderSettings();

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Chamado - ${escapeHtml(ticket.title || 'Novo Chamado')}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 0.8cm;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 9pt;
                        line-height: 1.2;
                        color: #000;
                        padding: 0.3cm;
                    }
                    .header {
                        border-bottom: 2px solid #000;
                        padding-bottom: 6px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .header-left {
                        flex: 1;
                    }
                    .header-center {
                        flex: 2;
                        text-align: center;
                    }
                    .header-right {
                        flex: 1;
                        text-align: right;
                    }
                    .header-logo {
                        max-height: 90px;
                        max-width: 225px;
                        object-fit: contain;
                    }
                    .header h1 {
                        font-size: 16pt;
                        margin-bottom: 2px;
                        line-height: 1.2;
                    }
                    .header p {
                        font-size: 8pt;
                        margin: 1px 0;
                        line-height: 1.2;
                    }
                    .header-info {
                        font-size: 7pt;
                        line-height: 1.2;
                    }
                    .section {
                        margin-bottom: 6px;
                        page-break-inside: avoid;
                    }
                    .section-title {
                        font-weight: bold;
                        font-size: 10pt;
                        border-bottom: 1px solid #000;
                        margin-bottom: 3px;
                        padding-bottom: 1px;
                    }
                    .row {
                        display: flex;
                        margin-bottom: 4px;
                        page-break-inside: avoid;
                    }
                    .col {
                        flex: 1;
                        padding: 0 3px;
                    }
                    .col-2 {
                        flex: 2;
                    }
                    .label {
                        font-weight: bold;
                        margin-bottom: 1px;
                        font-size: 8pt;
                    }
                    .value {
                        border-bottom: 1px solid #ccc;
                        min-height: 14px;
                        padding: 1px 3px;
                        font-size: 8pt;
                    }
                    .textarea-value {
                        border: 1px solid #ccc;
                        min-height: 25px;
                        padding: 3px;
                        font-size: 8pt;
                        white-space: pre-wrap;
                        line-height: 1.2;
                    }
                    .checkbox-group {
                        display: flex;
                        gap: 10px;
                        margin-top: 2px;
                    }
                    .checkbox-item {
                        display: flex;
                        align-items: center;
                        gap: 3px;
                        font-size: 8pt;
                    }
                    .signature-box {
                        border: 1px solid #000;
                        min-height: 35px;
                        padding: 3px;
                        margin-top: 2px;
                        font-size: 8pt;
                    }
                    .footer {
                        margin-top: 8px;
                        padding-top: 5px;
                        border-top: 1px solid #000;
                        font-size: 7pt;
                        text-align: center;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .no-print {
                            display: none;
                        }
                        @page {
                            size: A4;
                            margin: 0.8cm;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        ${printSettings.logo ? `<img src="${printSettings.logo}" alt="Logo" class="header-logo" />` : ''}
                    </div>
                    <div class="header-center">
                        <h1>${escapeHtml(printSettings.companyName || 'ORDEM DE SERVIÇO')}</h1>
                        ${printSettings.cnpj ? `<p class="header-info">CNPJ: ${escapeHtml(printSettings.cnpj)}</p>` : ''}
                        ${printSettings.phone ? `<p class="header-info">${escapeHtml(printSettings.phone)}</p>` : ''}
                        ${printSettings.address ? `<p class="header-info">${escapeHtml(printSettings.address)}</p>` : ''}
                    </div>
                    <div class="header-right">
                        <p class="header-info">${now.toLocaleDateString('pt-BR')}</p>
                        <p class="header-info">${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">DADOS DO CHAMADO</div>
                    <div class="row">
                        <div class="col">
                            <div class="label">Código:</div>
                            <div class="value">${escapeHtml(ticket.code || '-')}</div>
                        </div>
                        <div class="col">
                            <div class="label">Título:</div>
                            <div class="value">${escapeHtml(ticket.title)}</div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <div class="label">Status:</div>
                            <div class="value">${escapeHtml(ticket.status)}</div>
                        </div>
                        <div class="col">
                            <div class="label">Prioridade:</div>
                            <div class="value">${escapeHtml(ticket.priority)}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">CLIENTE</div>
                    <div class="row">
                        <div class="col-2">
                            <div class="label">Nome:</div>
                            <div class="value">${escapeHtml(selectedClient?.name)}</div>
                        </div>
                        <div class="col">
                            <div class="label">Localidade:</div>
                            <div class="value">${escapeHtml(ticket.location)}</div>
                        </div>
                    </div>
                    ${selectedClient ? `
                    <div class="row">
                        <div class="col">
                            <div class="label">Contato:</div>
                            <div class="value">${escapeHtml(selectedClient.contactPerson)}</div>
                        </div>
                        <div class="col">
                            <div class="label">Email:</div>
                            <div class="value">${escapeHtml(selectedClient.email)}</div>
                        </div>
                        <div class="col">
                            <div class="label">Telefone:</div>
                            <div class="value">${escapeHtml(selectedClient.phone)}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="section">
                    <div class="section-title">TÉCNICO</div>
                    <div class="row">
                        <div class="col">
                            <div class="label">Nome:</div>
                            <div class="value">${escapeHtml(selectedTechnician?.name || 'Não atribuído')}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">DEFEITO INFORMADO</div>
                    <div class="textarea-value">${escapeHtml(ticket.description)}</div>
                </div>

                <div class="section">
                    <div class="section-title">DEFEITO CONSTATADO</div>
                    <div class="textarea-value">${escapeHtml(ticket.foundDefect)}</div>
                </div>

                <div class="section">
                    <div class="section-title">SERVIÇOS EXECUTADOS</div>
                    <div class="textarea-value">${escapeHtml(ticket.executedServices)}</div>
                </div>

                <div class="section">
                    <div class="section-title">OBSERVAÇÕES</div>
                    <div class="row">
                        <div class="col">
                            <div class="label">Observações do Técnico:</div>
                            <div class="textarea-value">${escapeHtml(ticket.technicianNotes)}</div>
                        </div>
                        <div class="col">
                            <div class="label">Observações do Cliente:</div>
                            <div class="textarea-value">${escapeHtml(ticket.clientNotes)}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">INFORMAÇÕES DO EQUIPAMENTO</div>
                    <div class="textarea-value">${escapeHtml(ticket.equipmentInfo)}</div>
                </div>

                <div class="section">
                    <div class="section-title">STATUS DO SERVIÇO</div>
                    <div class="row">
                        <div class="col">
                            <span>Em Garantia:</span> <span>${ticket.underWarranty ? '☑ Sim' : '☑ Não'}</span>
                        </div>
                        <div class="col">
                            <span>Em Funcionamento:</span> <span>${ticket.working ? '☑ Sim' : '☑ Não'}</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <span>Concluído:</span> <span>${ticket.serviceCompleted ? '☑ Sim' : '☑ Não'}</span>
                        </div>
                        <div class="col">
                            <span>Verificado pelo Cliente:</span> <span>${ticket.verifiedByClient ? '☑ Sim' : '☑ Não'}</span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">ASSINATURAS</div>
                    <div class="row">
                        <div class="col">
                            <div class="label">Assinatura do Técnico:</div>
                            <div class="signature-box">${ticket.technicianSignature ? escapeHtml(ticket.technicianSignature) : '_________________________'}</div>
                        </div>
                        <div class="col">
                            <div class="label">Assinatura do Cliente:</div>
                            <div class="signature-box">${ticket.clientSignature ? escapeHtml(ticket.clientSignature) : '_________________________'}</div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p>Documento gerado em ${now.toLocaleString('pt-BR')}</p>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 250);
    };

    const handlePrintTicket = () => {
        printTicket(newTicket);
    };

    const handlePrintExistingTicket = () => {
        if (!editingTicket) return;
        printTicket(editingTicket);
    };

    const handleOpenEditModal = (ticket: Ticket) => {
        setEditingTicket({ ...ticket });
        setIsEditModalOpen(true);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editingTicket) return;
        const { name, value } = e.target;
        
        const booleanFields = new Set(['underWarranty','working','serviceCompleted','verifiedByClient']);
        const newEditingTicket = { ...editingTicket, [name]: name === 'technicianId' ? (value === '' ? null : value) : (booleanFields.has(name) ? value === 'true' : value) } as Ticket;

        if (name === 'clientId') {
            const selectedClient = clients.find(c => c.id === value);
            if(selectedClient){
                 newEditingTicket.location = `${selectedClient.city}, ${selectedClient.state}`;
            }
        }
        
        setEditingTicket(newEditingTicket);
    };

    const handleUpdateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTicket) return;
        try {
            await db.updateTicket(editingTicket.id, editingTicket);
            await refreshTickets();
            setIsEditModalOpen(false);
            setEditingTicket(null);
        } catch (error) {
            console.error('Erro ao atualizar chamado:', error);
            alert('Não foi possível atualizar o chamado.');
        }
    };
    
    const handleOpenDeleteConfirm = (ticket: Ticket) => {
        setTicketToDelete(ticket);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!ticketToDelete) return;
        try {
            await db.deleteTicket(ticketToDelete.id);
            await refreshTickets();
            setIsDeleteConfirmOpen(false);
            setTicketToDelete(null);
            setShowDeleteToast(true);
        } catch (error) {
            console.error('Erro ao excluir chamado:', error);
            alert('Não foi possível excluir o chamado.');
        }
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
                                <label htmlFor="description-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Defeito Informado</label>
                                <textarea name="description" id="description-create" value={newTicket.description} onChange={handleCreateInputChange} required rows={4} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="foundDefect-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Defeito Constatado</label>
                                <textarea name="foundDefect" id="foundDefect-create" value={newTicket.foundDefect} onChange={handleCreateInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="executedServices-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Serviços Executado</label>
                                <textarea name="executedServices" id="executedServices-create" value={newTicket.executedServices} onChange={handleCreateInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="technicianNotes-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observações do Técnico</label>
                                <textarea name="technicianNotes" id="technicianNotes-create" value={newTicket.technicianNotes} onChange={handleCreateInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="clientNotes-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observações do Cliente</label>
                                <textarea name="clientNotes" id="clientNotes-create" value={newTicket.clientNotes} onChange={handleCreateInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="equipmentInfo-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Informações do Equipamento</label>
                                <textarea name="equipmentInfo" id="equipmentInfo-create" value={newTicket.equipmentInfo} onChange={handleCreateInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Em Garantia</legend>
                                    <div className="mt-1 flex gap-4">
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="underWarranty" value="true" checked={newTicket.underWarranty === true} onChange={handleCreateInputChange}/> <span>Sim</span></label>
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="underWarranty" value="false" checked={newTicket.underWarranty === false} onChange={handleCreateInputChange}/> <span>Não</span></label>
                                    </div>
                                </fieldset>
                                <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Em Funcionamento</legend>
                                    <div className="mt-1 flex gap-4">
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="working" value="true" checked={newTicket.working === true} onChange={handleCreateInputChange}/> <span>Sim</span></label>
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="working" value="false" checked={newTicket.working === false} onChange={handleCreateInputChange}/> <span>Não</span></label>
                                    </div>
                                </fieldset>
                                <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Concluído</legend>
                                    <div className="mt-1 flex gap-4">
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="serviceCompleted" value="true" checked={newTicket.serviceCompleted === true} onChange={handleCreateInputChange}/> <span>Sim</span></label>
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="serviceCompleted" value="false" checked={newTicket.serviceCompleted === false} onChange={handleCreateInputChange}/> <span>Não</span></label>
                                    </div>
                                </fieldset>
                                <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Verificado pelo Cliente</legend>
                                    <div className="mt-1 flex gap-4">
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="verifiedByClient" value="true" checked={newTicket.verifiedByClient === true} onChange={handleCreateInputChange}/> <span>Sim</span></label>
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="verifiedByClient" value="false" checked={newTicket.verifiedByClient === false} onChange={handleCreateInputChange}/> <span>Não</span></label>
                                    </div>
                                </fieldset>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="technicianSignature-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assinatura do Técnico</label>
                                    <input type="text" name="technicianSignature" id="technicianSignature-create" value={newTicket.technicianSignature} onChange={handleCreateInputChange} placeholder="(Assinatura)" className="mt-1 block w-full border-dashed border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md py-6 text-slate-500"/>
                                </div>
                                <div>
                                    <label htmlFor="clientSignature-create" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assinatura do Cliente</label>
                                    <input type="text" name="clientSignature" id="clientSignature-create" value={newTicket.clientSignature} onChange={handleCreateInputChange} placeholder="(Assinatura)" className="mt-1 block w-full border-dashed border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md py-6 text-slate-500"/>
                                </div>
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
                                <button type="button" onClick={handlePrintTicket} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                                    <PrinterIcon className="h-5 w-5" />
                                    Imprimir
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
                                <label htmlFor="description-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Defeito Informado</label>
                                <textarea name="description" id="description-edit" value={editingTicket.description} onChange={handleEditInputChange} required rows={4} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="foundDefect-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Defeito Constatado</label>
                                <textarea name="foundDefect" id="foundDefect-edit" value={editingTicket.foundDefect || ''} onChange={handleEditInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="executedServices-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Serviços Executado</label>
                                <textarea name="executedServices" id="executedServices-edit" value={editingTicket.executedServices || ''} onChange={handleEditInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="technicianNotes-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observações do Técnico</label>
                                <textarea name="technicianNotes" id="technicianNotes-edit" value={editingTicket.technicianNotes || ''} onChange={handleEditInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="clientNotes-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observações do Cliente</label>
                                <textarea name="clientNotes" id="clientNotes-edit" value={editingTicket.clientNotes || ''} onChange={handleEditInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div>
                                <label htmlFor="equipmentInfo-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Informações do Equipamento</label>
                                <textarea name="equipmentInfo" id="equipmentInfo-edit" value={editingTicket.equipmentInfo || ''} onChange={handleEditInputChange} rows={3} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Em Garantia</legend>
                                    <div className="mt-1 flex gap-4">
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="underWarranty" value="true" checked={editingTicket.underWarranty === true} onChange={handleEditInputChange}/> <span>Sim</span></label>
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="underWarranty" value="false" checked={editingTicket.underWarranty === false} onChange={handleEditInputChange}/> <span>Não</span></label>
                                    </div>
                                </fieldset>
                                <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Em Funcionamento</legend>
                                    <div className="mt-1 flex gap-4">
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="working" value="true" checked={editingTicket.working === true} onChange={handleEditInputChange}/> <span>Sim</span></label>
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="working" value="false" checked={editingTicket.working === false} onChange={handleEditInputChange}/> <span>Não</span></label>
                                    </div>
                                </fieldset>
                                <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Concluído</legend>
                                    <div className="mt-1 flex gap-4">
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="serviceCompleted" value="true" checked={editingTicket.serviceCompleted === true} onChange={handleEditInputChange}/> <span>Sim</span></label>
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="serviceCompleted" value="false" checked={editingTicket.serviceCompleted === false} onChange={handleEditInputChange}/> <span>Não</span></label>
                                    </div>
                                </fieldset>
                                <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">Verificado pelo Cliente</legend>
                                    <div className="mt-1 flex gap-4">
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="verifiedByClient" value="true" checked={editingTicket.verifiedByClient === true} onChange={handleEditInputChange}/> <span>Sim</span></label>
                                        <label className="inline-flex items-center gap-2"><input type="radio" name="verifiedByClient" value="false" checked={editingTicket.verifiedByClient === false} onChange={handleEditInputChange}/> <span>Não</span></label>
                                    </div>
                                </fieldset>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="technicianSignature-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assinatura do Técnico</label>
                                    <input type="text" name="technicianSignature" id="technicianSignature-edit" value={editingTicket.technicianSignature || ''} onChange={handleEditInputChange} placeholder="(Assinatura)" className="mt-1 block w-full border-dashed border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md py-6 text-slate-500"/>
                                </div>
                                <div>
                                    <label htmlFor="clientSignature-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assinatura do Cliente</label>
                                    <input type="text" name="clientSignature" id="clientSignature-edit" value={editingTicket.clientSignature || ''} onChange={handleEditInputChange} placeholder="(Assinatura)" className="mt-1 block w-full border-dashed border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md py-6 text-slate-500"/>
                                </div>
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
                                <button type="button" onClick={handlePrintExistingTicket} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                                    <PrinterIcon className="h-5 w-5" />
                                    Imprimir
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