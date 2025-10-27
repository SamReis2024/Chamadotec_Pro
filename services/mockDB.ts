import { User, Client, Ticket, Role, Status, Priority, AuditLog, AuditAction } from '../types';

const DB_KEY = 'helpdesk_pro_db';

interface Database {
    users: User[];
    clients: Client[];
    tickets: Ticket[];
    auditLogs: AuditLog[];
}

const getInitialData = (): Database => ({
    users: [
        { id: 'user-1', name: 'Admin User', email: 'admin@helpdesk.com', password: 'password123', role: Role.ADMIN, createdAt: new Date('2023-01-01') },
        { id: 'user-2', name: 'Manager User', email: 'manager@helpdesk.com', password: 'password123', role: Role.MANAGER, createdAt: new Date('2023-01-02') },
        { id: 'user-3', name: 'Alice Johnson', email: 'alice@helpdesk.com', password: 'password123', role: Role.TECHNICIAN, createdAt: new Date('2023-01-03') },
        { id: 'user-4', name: 'Bob Williams', email: 'bob@helpdesk.com', password: 'password123', role: Role.TECHNICIAN, createdAt: new Date('2023-01-04') },
        { id: 'user-5', name: 'Charlie Brown', email: 'charlie@helpdesk.com', password: 'password123', role: Role.TECHNICIAN, createdAt: new Date('2023-01-05') },
    ],
    clients: [
        { id: 'client-1', name: 'Innovate Corp', contactPerson: 'John Doe', email: 'john@innovate.com', phone: '123-456-7890', address: '123 Tech Street', city: 'São Paulo', state: 'SP', createdAt: new Date('2023-02-01') },
        { id: 'client-2', name: 'Solutions Inc', contactPerson: 'Jane Smith', email: 'jane@solutions.com', phone: '098-765-4321', address: '456 Business Ave', city: 'Rio de Janeiro', state: 'RJ', createdAt: new Date('2023-02-05') },
        { id: 'client-3', name: 'MegaHoldings', contactPerson: 'Peter Jones', email: 'peter@megahold.com', phone: '555-555-5555', address: '789 Enterprise Blvd', city: 'Belo Horizonte', state: 'MG', createdAt: new Date('2023-02-10') },
    ],
    tickets: [
        { id: 'ticket-1', title: 'Printer not working', description: 'The main office printer is not responding.', clientId: 'client-1', technicianId: 'user-3', status: Status.IN_PROGRESS, priority: Priority.HIGH, createdAt: new Date(), updatedAt: new Date(), location: 'São Paulo' },
        { id: 'ticket-2', title: 'Cannot access email', description: 'User Jane Smith from Solutions Inc cannot access her email account.', clientId: 'client-2', technicianId: 'user-4', status: Status.OPEN, priority: Priority.URGENT, createdAt: new Date(), updatedAt: new Date(), location: 'Rio de Janeiro' },
        { id: 'ticket-3', title: 'Software installation request', description: 'Install new accounting software on 5 machines.', clientId: 'client-1', technicianId: 'user-3', status: Status.CLOSED, priority: Priority.MEDIUM, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), updatedAt: new Date(), location: 'São Paulo' },
        { id: 'ticket-4', title: 'Network is slow', description: 'The entire network at MegaHoldings is running slow since this morning.', clientId: 'client-3', technicianId: null, status: Status.OPEN, priority: Priority.HIGH, createdAt: new Date(), updatedAt: new Date(), location: 'Belo Horizonte' },
        { id: 'ticket-5', title: 'Request new mouse', description: 'The mouse for the front desk computer is broken.', clientId: 'client-2', technicianId: 'user-4', status: Status.PENDING, priority: Priority.LOW, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), updatedAt: new Date(), location: 'Rio de Janeiro' },
    ],
    auditLogs: [],
});

class MockDB {
    private db: Database;
    private currentUserId: string | null = null;

    constructor() {
        const savedDb = localStorage.getItem(DB_KEY);
        if (savedDb) {
            this.db = JSON.parse(savedDb, (key, value) => {
                if (key.endsWith('At') && value) {
                    return new Date(value);
                }
                return value;
            });
             // Ensure auditLogs is an array
            if (!Array.isArray(this.db.auditLogs)) {
                this.db.auditLogs = [];
            }
        } else {
            this.db = getInitialData();
            this.save();
        }
    }

    public setCurrentUserId(userId: string | null) {
        this.currentUserId = userId;
    }
    
    public clearCurrentUserId() {
        this.currentUserId = null;
    }

    private save() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.db));
    }

    private logAction(action: AuditAction, entity: string, entityId: string, details: string) {
        if (!this.currentUserId) {
            console.warn('Cannot log action: currentUserId is not set.');
            return;
        }
        const logEntry: AuditLog = {
            id: `log-${Date.now()}`,
            userId: this.currentUserId,
            action,
            entity,
            entityId,
            details,
            createdAt: new Date(),
        };
        this.db.auditLogs.unshift(logEntry); // Add to the beginning of the array
    }
    
    // Generic CRUD
    private getAll<T extends keyof Database>(table: T): Database[T] {
        return this.db[table];
    }
    
    private getById<T extends keyof Database>(table: T, id: string): Database[T][number] | undefined {
        return this.db[table].find((item: any) => item.id === id);
    }
    
    private create<T extends keyof Database>(table: T, item: Omit<Database[T][number], 'id' | 'createdAt' | 'updatedAt'>): Database[T][number] {
        const newItem = {
            ...item,
            id: `${table.slice(0, -1)}-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Database[T][number];
        (this.db[table] as any).push(newItem);
        // Logging is handled by public methods
        this.save();
        return newItem;
    }

    private update<T extends keyof Database>(table: T, id: string, updates: Partial<Database[T][number]>): Database[T][number] | undefined {
        const itemIndex = this.db[table].findIndex((item: any) => item.id === id);
        if (itemIndex > -1) {
            this.db[table][itemIndex] = { ...this.db[table][itemIndex], ...updates, updatedAt: new Date() };
            // Logging is handled by public methods
            this.save();
            return this.db[table][itemIndex];
        }
        return undefined;
    }
    
    private delete<T extends keyof Database>(table: T, id: string): boolean {
        const initialLength = this.db[table].length;
        this.db[table] = this.db[table].filter((item: any) => item.id !== id) as any;
        if (this.db[table].length < initialLength) {
            // Logging is handled by public methods
            this.save();
            return true;
        }
        return false;
    }

    // User-specific methods
    public getUsers = () => this.getAll('users');
    public getUserById = (id: string) => this.getById('users', id);
    public getUserByEmail = (email: string) => this.db.users.find(u => u.email === email);
    public createUser = (user: Omit<User, 'id'|'createdAt'>) => {
        const newUser = this.create('users', user);
        this.logAction(AuditAction.CREATE, 'Usuário', newUser.id, `Usuário '${newUser.name}' criado.`);
        return newUser;
    }
    public updateUser = (id: string, updates: Partial<User>) => {
        const updatedUser = this.update('users', id, updates);
        if(updatedUser) {
            this.logAction(AuditAction.UPDATE, 'Usuário', id, `Usuário '${updatedUser.name}' atualizado.`);
        }
        return updatedUser;
    }
    public deleteUser = (id: string) => {
        const userToDelete = this.getUserById(id);
        if(userToDelete) {
             const result = this.delete('users', id);
             if(result){
                 this.logAction(AuditAction.DELETE, 'Usuário', id, `Usuário '${userToDelete.name}' excluído.`);
             }
             return result;
        }
        return false;
    }
    
    // Client-specific methods
    public getClients = () => this.getAll('clients');
    public getClientById = (id: string) => this.getById('clients', id);
    public createClient = (client: Omit<Client, 'id'|'createdAt'>) => {
        const newClient = this.create('clients', client);
        this.logAction(AuditAction.CREATE, 'Cliente', newClient.id, `Cliente '${newClient.name}' criado.`);
        return newClient;
    }
    public updateClient = (id: string, updates: Partial<Client>) => {
        const updatedClient = this.update('clients', id, updates);
        if(updatedClient) {
            this.logAction(AuditAction.UPDATE, 'Cliente', id, `Cliente '${updatedClient.name}' atualizado.`);
        }
        return updatedClient;
    }
    public deleteClient = (id: string) => {
        const clientToDelete = this.getClientById(id);
        if(clientToDelete) {
            const result = this.delete('clients', id);
            if(result){
                this.logAction(AuditAction.DELETE, 'Cliente', id, `Cliente '${clientToDelete.name}' excluído.`);
            }
            return result;
        }
        return false;
    }

    // Ticket-specific methods
    public getTickets = () => this.getAll('tickets');
    public getTicketById = (id: string) => this.getById('tickets', id);
    public createTicket = (ticket: Omit<Ticket, 'id'|'createdAt'|'updatedAt'>) => {
        const newTicket = this.create('tickets', ticket);
        this.logAction(AuditAction.CREATE, 'Chamado', newTicket.id, `Chamado '${newTicket.title}' criado.`);
        return newTicket;
    }
    public updateTicket = (id: string, updates: Partial<Ticket>) => {
        const updatedTicket = this.update('tickets', id, updates);
        if(updatedTicket) {
             this.logAction(AuditAction.UPDATE, 'Chamado', id, `Chamado '${updatedTicket.title}' atualizado.`);
        }
        return updatedTicket;
    }
    public deleteTicket = (id: string) => {
        const ticketToDelete = this.getTicketById(id);
        if (ticketToDelete) {
            const result = this.delete('tickets', id);
            if(result) {
                this.logAction(AuditAction.DELETE, 'Chamado', id, `Chamado '${ticketToDelete.title}' excluído.`);
            }
            return result;
        }
        return false;
    }
    
    // AuditLog-specific methods
    public getAuditLogs = () => this.getAll('auditLogs');
}

export const db = new MockDB();