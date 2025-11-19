import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../services/mockDB';
import { Client, Role, Status, Ticket, User } from '../types';

const ReportsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [technicianId, setTechnicianId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [ticketsData, usersData, clientsData] = await Promise.all([
          db.getTickets(),
          db.getUsers(),
          db.getClients(),
        ]);

        if (!active) return;

        setTickets(ticketsData);
        setUsers(usersData);
        setClients(clientsData);
      } catch (error) {
        console.error('Erro ao carregar dados de relatórios:', error);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const technicians = useMemo(() => users.filter(u => u.role === Role.TECHNICIAN), [users]);

  const filteredTickets = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + 'T23:59:59.999') : null;
    return tickets.filter(t => {
      const created = new Date(t.createdAt);
      if (start && created < start) return false;
      if (end && created > end) return false;
      if (technicianId && t.technicianId !== technicianId) return false;
      if (clientId && t.clientId !== clientId) return false;
      return true;
    });
  }, [tickets, startDate, endDate, technicianId, clientId]);

  const totalTickets = filteredTickets.length;

  const avgCompletionHours = useMemo(() => {
    const completed = filteredTickets.filter(t => t.status === Status.CLOSED);
    if (completed.length === 0) return 0;
    const sumMs = completed.reduce((acc, t) => acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0);
    const avgMs = sumMs / completed.length;
    return Math.round(avgMs / 36e5);
  }, [filteredTickets]);

  const mostCommonStatus = useMemo(() => {
    if (filteredTickets.length === 0) return '-';
    const map = new Map<string, number>();
    filteredTickets.forEach(t => map.set(t.status, (map.get(t.status) || 0) + 1));
    let best: string = '-';
    let bestCount = -1;
    map.forEach((count, status) => {
      if (count > bestCount) {
        best = status;
        bestCount = count;
      }
    });
    return best;
  }, [filteredTickets]);

  const getUserName = (id: string | null) => users.find(u => u.id === id)?.name || 'Não atribuído';
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconhecido';

  const handlePrintPdf = () => {
    const win = window.open('', 'PRINT', 'height=1000,width=1200');
    if (!win) return;
    const now = new Date();
    const rows = filteredTickets.map(t => `
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb;">${t.code}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${getClientName(t.clientId)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${getUserName(t.technicianId)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${t.title}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${t.status}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${new Date(t.createdAt).toLocaleDateString()}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${new Date(t.updatedAt).toLocaleDateString()}</td>
      </tr>
    `).join('');

    win.document.write(`
      <html>
        <head>
          <title>Relatório de Chamados</title>
          <style>
            body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; color:#0f172a; }
            .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
            .title { font-size:20px; font-weight:700; }
            .muted { color:#475569; font-size:12px; }
            .summary { display:flex; gap:16px; margin:16px 0; }
            .card { border:1px solid #e2e8f0; border-radius:8px; padding:12px; }
            table { width:100%; border-collapse:collapse; font-size:12px; }
            th, td { padding:8px; border:1px solid #e5e7eb; text-align:left; }
            th { background:#f1f5f9; }
            .footer { margin-top:24px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#475569; }
            .sign { border-top:1px solid #e2e8f0; width:240px; padding-top:8px; text-align:center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Relatório de Chamados</div>
              <div class="muted">Geração: ${now.toLocaleString()}</div>
            </div>
            <div class="muted">HelpDesk Pro</div>
          </div>
          <div class="summary">
            <div class="card">Total de chamados: <strong>${totalTickets}</strong></div>
            <div class="card">Tempo médio de conclusão: <strong>${avgCompletionHours}h</strong></div>
            <div class="card">Status mais comum: <strong>${mostCommonStatus}</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Tipo/Serviço</th>
                <th>Status</th>
                <th>Criação</th>
                <th>Última atualização</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="footer">
            <div>Período: ${startDate || '--'} até ${endDate || '--'} | Técnico: ${technicianId ? getUserName(technicianId) : 'Todos'} | Cliente: ${clientId ? getClientName(clientId) : 'Todos'}</div>
            <div class="sign">Assinatura</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Relatórios</h1>
        <button onClick={handlePrintPdf} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Gerar PDF</button>
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data inicial</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data final</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Técnico</label>
            <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="">Todos</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="">Todos</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.city}, {c.state}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-300">Total de chamados</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalTickets}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-300">Tempo médio de conclusão</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{avgCompletionHours}h</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-300">Status mais comum</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{mostCommonStatus}</div>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow text-slate-600 dark:text-slate-300">Nenhum registro encontrado para o período e filtros selecionados.</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nº</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Técnico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Tipo/Serviço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Criação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Última atualização</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{t.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{getClientName(t.clientId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{getUserName(t.technicianId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{t.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{t.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{new Date(t.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
