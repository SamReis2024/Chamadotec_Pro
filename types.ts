export enum Role {
    ADMIN = 'Administrador',
    MANAGER = 'Gestor',
    TECHNICIAN = 'Técnico',
}

export enum Status {
    OPEN = 'Aberto',
    IN_PROGRESS = 'Em Andamento',
    CLOSED = 'Fechado',
    PENDING = 'Pendente',
}

export enum Priority {
    LOW = 'Baixa',
    MEDIUM = 'Média',
    HIGH = 'Alta',
    URGENT = 'Urgente',
}

export enum AuditAction {
    CREATE = 'Criação',
    UPDATE = 'Atualização',
    DELETE = 'Exclusão',
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: Role;
    createdAt: Date;
}

export interface Client {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    createdAt: Date;
    agencyNumber?: string;
    agencyName?: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    clientId: string;
    technicianId: string | null;
    status: Status;
    priority: Priority;
    createdAt: Date;
    updatedAt: Date;
    location: string;
}

export interface AuditLog {
    id: string;
    userId: string;
    action: AuditAction;
    entity: string; // e.g., 'Ticket', 'Client', 'User'
    entityId: string;
    details: string; // e.g., "Ticket 'Printer not working' created."
    createdAt: Date;
}


export type Page = 'dashboard' | 'tickets' | 'clients' | 'users' | 'audit';