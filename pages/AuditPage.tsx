import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDB';
import { AuditLog, User, AuditAction, Client, Ticket } from '../types';

const actionColors: Record<AuditAction, string> = {
    [AuditAction.CREATE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [AuditAction.UPDATE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AuditAction.DELETE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const AuditPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [entityDetails, setEntityDetails] = useState<User | Client | Ticket | null>(null);

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            try {
                const [logsData, usersData] = await Promise.all([
                    db.getAuditLogs(),
                    db.getUsers(),
                ]);

                if (!active) {
                    return;
                }

                setLogs(logsData);
                setUsers(usersData);
            } catch (error) {
                console.error('Erro ao carregar auditoria:', error);
            }
        };

        loadData();

        return () => {
            active = false;
        };
    }, []);

    const getUserName = (userId: string | null) => {
        if (!userId) {
            return 'Usuário Desconhecido';
        }
        return users.find(u => u.id === userId)?.name || 'Usuário Desconhecido';
    };

    const fetchEntityDetails = async (log: AuditLog) => {
        if (!log.entityId) {
            setEntityDetails(null);
            setDetailsError('Este registro não possui um identificador associado.');
            return;
        }

        setIsLoadingDetails(true);
        setDetailsError(null);
        try {
            let data: User | Client | Ticket | null = null;
            if (log.entity === 'Usuário') {
                data = await db.getUserById(log.entityId);
            } else if (log.entity === 'Cliente') {
                data = await db.getClientById(log.entityId);
            } else if (log.entity === 'Chamado') {
                data = await db.getTicketById(log.entityId);
            }

            if (!data) {
                setDetailsError('Registro não encontrado (pode ter sido removido).');
                setEntityDetails(null);
                return;
            }
            setEntityDetails(data);
        } catch (error) {
            console.error('Erro ao carregar detalhes da entidade:', error);
            setDetailsError('Não foi possível carregar os detalhes deste registro.');
            setEntityDetails(null);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleOpenDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setEntityDetails(null);
        setDetailsError(null);
        setIsDetailsOpen(true);
        if (log.entityId) {
            fetchEntityDetails(log);
        } else {
            setDetailsError('Este registro não possui um identificador associado.');
        }
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedLog(null);
        setEntityDetails(null);
        setDetailsError(null);
        setIsLoadingDetails(false);
    };

    const renderEntityDetails = () => {
        if (detailsError) {
            return <p className="text-sm text-red-500">{detailsError}</p>;
        }

        if (isLoadingDetails) {
            return <p className="text-sm text-slate-500">Carregando detalhes...</p>;
        }

        if (!entityDetails || !selectedLog) {
            return <p className="text-sm text-slate-500">Nenhum detalhe disponível.</p>;
        }

        switch (selectedLog.entity) {
            case 'Usuário': {
                const user = entityDetails as User;
                return (
                    <dl className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                            <dt className="font-medium text-slate-700">Nome</dt>
                            <dd className="text-slate-600">{user.name}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Email</dt>
                            <dd className="text-slate-600">{user.email}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Função</dt>
                            <dd className="text-slate-600">{user.role}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Criado em</dt>
                            <dd className="text-slate-600">{new Date(user.createdAt).toLocaleString()}</dd>
                        </div>
                    </dl>
                );
            }
            case 'Cliente': {
                const client = entityDetails as Client;
                return (
                    <dl className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                            <dt className="font-medium text-slate-700">Nome</dt>
                            <dd className="text-slate-600">{client.name}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Contato</dt>
                            <dd className="text-slate-600">{client.contactPerson}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Localização</dt>
                            <dd className="text-slate-600">{client.city}, {client.state}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Email</dt>
                            <dd className="text-slate-600">{client.email}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Telefone</dt>
                            <dd className="text-slate-600">{client.phone}</dd>
                        </div>
                    </dl>
                );
            }
            case 'Chamado': {
                const ticket = entityDetails as Ticket;
                return (
                    <dl className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                            <dt className="font-medium text-slate-700">Título</dt>
                            <dd className="text-slate-600">{ticket.title}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Código</dt>
                            <dd className="text-slate-600">{ticket.code}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Status / Prioridade</dt>
                            <dd className="text-slate-600">{ticket.status} / {ticket.priority}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Localidade</dt>
                            <dd className="text-slate-600">{ticket.location}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Descrição</dt>
                            <dd className="text-slate-600 whitespace-pre-wrap">{ticket.description}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-700">Criado em</dt>
                            <dd className="text-slate-600">{new Date(ticket.createdAt).toLocaleString()}</dd>
                        </div>
                    </dl>
                );
            }
            default:
                return <p className="text-sm text-slate-500">Tipo de entidade não suportado.</p>;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Histórico de Auditoria</h1>
            
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Usuário</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Ação</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Entidade</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Detalhes</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{getUserName(log.userId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${actionColors[log.action]}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{log.entity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 max-w-sm truncate">{log.details}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleOpenDetails(log)}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium"
                                        >
                                            Ver detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                    Nenhum registro de auditoria encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {isDetailsOpen && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" role="dialog" aria-modal="true">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Detalhes da Auditoria</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Visualize as informações completas da atualização realizada.
                                </p>
                            </div>
                            <button
                                onClick={handleCloseDetails}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                aria-label="Fechar modal"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Usuário</p>
                                <p className="font-medium text-slate-800 dark:text-slate-100">{getUserName(selectedLog.userId)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Ação</p>
                                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedLog.action}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Entidade</p>
                                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedLog.entity}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Data</p>
                                <p className="font-medium text-slate-800 dark:text-slate-100">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-slate-500 dark:text-slate-400">Detalhes</p>
                                <p className="font-medium text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{selectedLog.details}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Registro associado</h3>
                            <div className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                                {renderEntityDetails()}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleCloseDetails}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditPage;
