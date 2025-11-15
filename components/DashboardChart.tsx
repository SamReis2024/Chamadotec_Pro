
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Ticket, Status } from '../types';

interface DashboardChartProps {
    tickets: Ticket[];
}

const DashboardChart: React.FC<DashboardChartProps> = ({ tickets }) => {
    const statusCounts = tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
    }, {} as Record<Status, number>);

    const data = Object.values(Status).map(status => ({
        name: status,
        Chamados: statusCounts[status] || 0,
    }));
    
    const colors: Record<Status, string> = {
        [Status.OPEN]: '#3b82f6', // blue-500
        [Status.IN_PROGRESS]: '#f59e0b', // amber-500
        [Status.CLOSED]: '#22c55e', // green-500
        [Status.PENDING]: '#a855f7', // purple-500
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-96">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Chamados por Status</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" stroke="rgb(100 116 139)" />
                    <YAxis allowDecimals={false} stroke="rgb(100 116 139)" />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                            borderColor: 'rgb(51 65 85)',
                            color: '#fff'
                        }}
                    />
                    <Legend />
                    <Bar dataKey="Chamados" fill="#8884d8">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[entry.name as Status]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DashboardChart;
