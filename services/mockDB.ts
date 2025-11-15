import { supabase } from './supabaseClient';
import { User, Client, Ticket, Role, Status, Priority, AuditLog, AuditAction } from '../types';

type UserRow = {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    created_at: string;
};

type ClientRow = {
    id: string;
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    agency_number: string | null;
    agency_name: string | null;
    created_at: string;
    updated_at: string;
};

type TicketRow = {
    id: string;
    code: string;
    title: string;
    description: string;
    client_id: string;
    technician_id: string | null;
    status: Status;
    priority: Priority;
    location: string;
    found_defect: string | null;
    executed_services: string | null;
    technician_notes: string | null;
    client_notes: string | null;
    equipment_info: string | null;
    under_warranty: boolean;
    working: boolean;
    service_completed: boolean;
    verified_by_client: boolean;
    technician_signature: string | null;
    client_signature: string | null;
    created_at: string;
    updated_at: string;
};

type AuditLogRow = {
    id: string;
    user_id: string | null;
    action: AuditAction;
    entity: string;
    entity_id: string | null;
    details: string;
    created_at: string;
};

const mapUser = (row: UserRow): User => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: new Date(row.created_at),
});

const mapClient = (row: ClientRow): Client => ({
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    agencyNumber: row.agency_number ?? undefined,
    agencyName: row.agency_name ?? undefined,
    createdAt: new Date(row.created_at),
});

const mapTicket = (row: TicketRow): Ticket => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    clientId: row.client_id,
    technicianId: row.technician_id,
    status: row.status,
    priority: row.priority,
    location: row.location,
    foundDefect: row.found_defect ?? undefined,
    executedServices: row.executed_services ?? undefined,
    technicianNotes: row.technician_notes ?? undefined,
    clientNotes: row.client_notes ?? undefined,
    equipmentInfo: row.equipment_info ?? undefined,
    underWarranty: row.under_warranty,
    working: row.working,
    serviceCompleted: row.service_completed,
    verifiedByClient: row.verified_by_client,
    technicianSignature: row.technician_signature ?? undefined,
    clientSignature: row.client_signature ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
});

const mapAuditLog = (row: AuditLogRow): AuditLog => ({
    id: row.id,
    userId: row.user_id,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    details: row.details,
    createdAt: new Date(row.created_at),
});

class SupabaseDB {
    private currentUserId: string | null = null;

    public setCurrentUserId(userId: string | null) {
        this.currentUserId = userId;
    }
    
    public clearCurrentUserId() {
        this.currentUserId = null;
    }

    private async logAction(action: AuditAction, entity: string, entityId: string, details: string) {
        if (!this.currentUserId) {
            console.warn('Não é possível registrar auditoria sem usuário autenticado.');
            return;
        }

        const { error } = await supabase.from('audit_logs').insert({
            user_id: this.currentUserId,
            action,
            entity,
            entity_id: entityId,
            details,
        });

        if (error) {
            console.error('Falha ao registrar auditoria:', error);
        }
    }
    
    // Users
    public async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Erro ao carregar usuários: ${error.message}`);
        }

        return (data ?? []).map(row => mapUser(row as UserRow));
    }

    public async getUserById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            throw new Error(`Erro ao buscar usuário: ${error.message}`);
        }

        return data ? mapUser(data) : null;
    }
    
    public async getUserByEmail(email: string): Promise<(User & { password?: string }) | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (error) {
            throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return {
            ...mapUser(data),
            password: data.password,
        };
    }

    public async createUser(user: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .insert({
                name: user.name,
                email: user.email.toLowerCase(),
                password: user.password,
                role: user.role,
            })
            .select('*')
            .single();

        if (error) {
            throw new Error(`Erro ao criar usuário: ${error.message}`);
        }

        const row = data as UserRow;
        await this.logAction(AuditAction.CREATE, 'Usuário', row.id, `Usuário '${row.name}' criado.`);
        return mapUser(row);
    }

    public async updateUser(id: string, updates: Partial<User>): Promise<User> {
        const payload: Partial<UserRow> = {};

        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.email !== undefined) payload.email = updates.email.toLowerCase();
        if (updates.role !== undefined) payload.role = updates.role;

        const { data, error } = await supabase
            .from('users')
            .update(payload)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Erro ao atualizar usuário: ${error.message}`);
        }

        const row = data as UserRow;
        await this.logAction(AuditAction.UPDATE, 'Usuário', id, `Usuário '${row.name}' atualizado.`);
        return mapUser(row);
    }

    public async deleteUser(id: string): Promise<void> {
        const user = await this.getUserById(id);
        const { error } = await supabase.from('users').delete().eq('id', id);

        if (error) {
            throw new Error(`Erro ao excluir usuário: ${error.message}`);
        }

        if (user) {
            await this.logAction(AuditAction.DELETE, 'Usuário', id, `Usuário '${user.name}' excluído.`);
             }
    }

    // Clients
    public async getClients(): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Erro ao carregar clientes: ${error.message}`);
        }

        return (data ?? []).map(row => mapClient(row as ClientRow));
    }

    public async getClientById(id: string): Promise<Client | null> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            throw new Error(`Erro ao buscar cliente: ${error.message}`);
        }

        return data ? mapClient(data) : null;
    }

    public async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .insert({
                name: client.name,
                contact_person: client.contactPerson,
                email: client.email,
                phone: client.phone,
                address: client.address,
                city: client.city,
                state: client.state,
                agency_number: client.agencyNumber ?? null,
                agency_name: client.agencyName ?? null,
            })
            .select('*')
            .single();

        if (error) {
            throw new Error(`Erro ao criar cliente: ${error.message}`);
        }

        const row = data as ClientRow;
        await this.logAction(AuditAction.CREATE, 'Cliente', row.id, `Cliente '${row.name}' criado.`);
        return mapClient(row);
    }

    public async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
        const payload: Partial<ClientRow> = {};

        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.contactPerson !== undefined) payload.contact_person = updates.contactPerson;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.address !== undefined) payload.address = updates.address;
        if (updates.city !== undefined) payload.city = updates.city;
        if (updates.state !== undefined) payload.state = updates.state;
        if (updates.agencyNumber !== undefined) payload.agency_number = updates.agencyNumber ?? null;
        if (updates.agencyName !== undefined) payload.agency_name = updates.agencyName ?? null;

        const { data, error } = await supabase
            .from('clients')
            .update(payload)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Erro ao atualizar cliente: ${error.message}`);
        }

        const row = data as ClientRow;
        await this.logAction(AuditAction.UPDATE, 'Cliente', id, `Cliente '${row.name}' atualizado.`);
        return mapClient(row);
    }

    public async deleteClient(id: string): Promise<void> {
        const client = await this.getClientById(id);
        const { error } = await supabase.from('clients').delete().eq('id', id);

        if (error) {
            throw new Error(`Erro ao excluir cliente: ${error.message}`);
        }

        if (client) {
            await this.logAction(AuditAction.DELETE, 'Cliente', id, `Cliente '${client.name}' excluído.`);
            }
    }

    // Tickets
    public async getTickets(): Promise<Ticket[]> {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Erro ao carregar chamados: ${error.message}`);
        }

        return (data ?? []).map(row => mapTicket(row as TicketRow));
    }

    public async createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'code'>): Promise<Ticket> {
        const { data, error } = await supabase
            .from('tickets')
            .insert({
                title: ticket.title,
                description: ticket.description,
                client_id: ticket.clientId,
                technician_id: ticket.technicianId,
                status: ticket.status,
                priority: ticket.priority,
                location: ticket.location,
                found_defect: ticket.foundDefect ?? null,
                executed_services: ticket.executedServices ?? null,
                technician_notes: ticket.technicianNotes ?? null,
                client_notes: ticket.clientNotes ?? null,
                equipment_info: ticket.equipmentInfo ?? null,
                under_warranty: ticket.underWarranty ?? false,
                working: ticket.working ?? false,
                service_completed: ticket.serviceCompleted ?? false,
                verified_by_client: ticket.verifiedByClient ?? false,
                technician_signature: ticket.technicianSignature ?? null,
                client_signature: ticket.clientSignature ?? null,
            })
            .select('*')
            .single();

        if (error) {
            throw new Error(`Erro ao criar chamado: ${error.message}`);
        }

        const row = data as TicketRow;
        await this.logAction(AuditAction.CREATE, 'Chamado', row.id, `Chamado '${row.title}' criado.`);
        return mapTicket(row);
    }

    public async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
        const payload: Partial<TicketRow> = {};

        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.clientId !== undefined) payload.client_id = updates.clientId;
        if (updates.technicianId !== undefined) payload.technician_id = updates.technicianId;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.priority !== undefined) payload.priority = updates.priority;
        if (updates.location !== undefined) payload.location = updates.location;
        if (updates.foundDefect !== undefined) payload.found_defect = updates.foundDefect ?? null;
        if (updates.executedServices !== undefined) payload.executed_services = updates.executedServices ?? null;
        if (updates.technicianNotes !== undefined) payload.technician_notes = updates.technicianNotes ?? null;
        if (updates.clientNotes !== undefined) payload.client_notes = updates.clientNotes ?? null;
        if (updates.equipmentInfo !== undefined) payload.equipment_info = updates.equipmentInfo ?? null;
        if (updates.underWarranty !== undefined) payload.under_warranty = updates.underWarranty;
        if (updates.working !== undefined) payload.working = updates.working;
        if (updates.serviceCompleted !== undefined) payload.service_completed = updates.serviceCompleted;
        if (updates.verifiedByClient !== undefined) payload.verified_by_client = updates.verifiedByClient;
        if (updates.technicianSignature !== undefined) payload.technician_signature = updates.technicianSignature ?? null;
        if (updates.clientSignature !== undefined) payload.client_signature = updates.clientSignature ?? null;

        const { data, error } = await supabase
            .from('tickets')
            .update(payload)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Erro ao atualizar chamado: ${error.message}`);
        }

        const row = data as TicketRow;
        await this.logAction(AuditAction.UPDATE, 'Chamado', id, `Chamado '${row.title}' atualizado.`);
        return mapTicket(row);
    }

    public async deleteTicket(id: string): Promise<void> {
        const { data: ticketData, error: fetchError } = await supabase
            .from('tickets')
            .select('id, title')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            throw new Error(`Erro ao buscar chamado para exclusão: ${fetchError.message}`);
        }

        const { error } = await supabase.from('tickets').delete().eq('id', id);

        if (error) {
            throw new Error(`Erro ao excluir chamado: ${error.message}`);
        }

        if (ticketData) {
            await this.logAction(AuditAction.DELETE, 'Chamado', id, `Chamado '${ticketData.title}' excluído.`);
            }
    }

    // Audit logs
    public async getAuditLogs(): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Erro ao carregar auditoria: ${error.message}`);
        }

        return (data ?? []).map(row => mapAuditLog(row as AuditLogRow));
    }
}

export const db = new SupabaseDB();