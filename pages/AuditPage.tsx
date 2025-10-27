import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/mockDB';
import { AuditLog, User, AuditAction } from '../types';

const actionColors: Record<AuditAction, string> = {
    [AuditAction.CREATE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [AuditAction.UPDATE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [AuditAction.DELETE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const AuditPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        setLogs(db.getAuditLogs());
        setUsers(db.getUsers());
    }, []);

    const getUserName = (userId: string) => {
        return users.find(u => u.id === userId)?.name || 'Usuário Desconhecido';
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
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                    Nenhum registro de auditoria encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditPage;
