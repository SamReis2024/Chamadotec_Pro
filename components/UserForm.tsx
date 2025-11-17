import React from 'react';
import { Role, User } from '../types';

type Props = {
  user: Partial<User> & { name: string; email: string; password?: string; role: Role };
  handleSubmit: (e: React.FormEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  closeModal: () => void;
  title: string;
  submitButtonText: string;
  currentUserRole?: Role;
};

export default function UserForm({ user, handleSubmit, handleInputChange, closeModal, title, submitButtonText, currentUserRole }: Props) {
  // Determinar quais roles podem ser selecionados baseado no usuário atual
  const getAvailableRoles = (): Role[] => {
    if (!currentUserRole) {
      return Object.values(Role);
    }
    
    if (currentUserRole === Role.ADMIN) {
      return [Role.ADMIN, Role.MANAGER_ADMIN, Role.MANAGER, Role.TECHNICIAN];
    } else if (currentUserRole === Role.MANAGER_ADMIN) {
      return [Role.MANAGER_ADMIN, Role.MANAGER, Role.TECHNICIAN];
    }
    
    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 sm:pt-20" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
            <input type="text" name="name" value={user.name} onChange={handleInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" name="email" value={user.email} onChange={handleInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          {!user.id && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
              <input type="password" name="password" value={user.password || ''} onChange={handleInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Função</label>
            <select name="role" value={user.role} onChange={handleInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              {availableRoles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{submitButtonText}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
