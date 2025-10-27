
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDB';
import { Ticket, Status } from '../types';
import DashboardChart from '../components/DashboardChart';
import { TicketIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        setTickets(db.getTickets());
    }, []);

    const openTickets = tickets.filter(t => t.status === Status.OPEN).length;
    const inProgressTickets = tickets.filter(t => t.status === Status.IN_PROGRESS).length;
    const closedTickets = tickets.filter(t => t.status === Status.CLOSED).length;
    const totalTickets = tickets.length;

    const stats = [
        { name: 'Total de Chamados', stat: totalTickets, icon: TicketIcon, color: 'bg-blue-500' },
        { name: 'Em Andamento', stat: inProgressTickets, icon: ClockIcon, color: 'bg-amber-500' },
        { name: 'Fechados', stat: closedTickets, icon: CheckCircleIcon, color: 'bg-green-500' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((item) => (
                    <div key={item.name} className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 ${item.color} rounded-md p-3`}>
                                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{item.name}</dt>
                                        <dd className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{item.stat}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <DashboardChart tickets={tickets} />
        </div>
    );
};

export default DashboardPage;
