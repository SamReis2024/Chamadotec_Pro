import React from 'react';
import { Client } from '../types';

type ClientFormValues = Partial<Client> & {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  agencyNumber?: string;
  agencyName?: string;
};

type Props = {
  client: ClientFormValues;
  handleSubmit: (e: React.FormEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  closeModal: () => void;
  title: string;
  submitButtonText: string;
};

export default function ClientForm({ client, handleSubmit, handleInputChange, closeModal, title, submitButtonText }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 sm:pt-20" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 id="modal-title" className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Empresa</label>
            <input type="text" name="name" id="name" value={client.name} onChange={handleInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pessoa de Contato</label>
            <input type="text" name="contactPerson" id="contactPerson" value={client.contactPerson} onChange={handleInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="agencyNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nº da Agência</label>
            <input type="text" name="agencyNumber" id="agencyNumber" value={client.agencyNumber || ''} onChange={handleInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="agencyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Agência</label>
            <input type="text" name="agencyName" id="agencyName" value={client.agencyName || ''} onChange={handleInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" name="email" id="email" value={client.email} onChange={handleInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
            <input type="tel" name="phone" id="phone" value={client.phone} onChange={handleInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</label>
            <input type="text" name="address" id="address" value={client.address} onChange={handleInputChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
              <input type="text" name="city" id="city" value={client.city} onChange={handleInputChange} required className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
              <input type="text" name="state" id="state" value={client.state} onChange={handleInputChange} required maxLength={2} className="mt-1 block w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
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
