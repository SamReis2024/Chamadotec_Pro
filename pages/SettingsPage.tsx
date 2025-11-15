import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { PrintHeaderSettings } from '../types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<PrintHeaderSettings>({
        companyName: '',
        cnpj: '',
        phone: '',
        address: '',
        logo: null,
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        const savedSettings = settingsService.getPrintHeaderSettings();
        setSettings(savedSettings);
        if (savedSettings.logo) {
            setLogoPreview(savedSettings.logo);
        }
    }, []);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setSettings(prev => ({ ...prev, logo: base64String }));
                setLogoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setSettings(prev => ({ ...prev, logo: null }));
        setLogoPreview(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        settingsService.savePrintHeaderSettings(settings);
        setShowSuccess(true);
    };

    return (
        <div className="space-y-6">
            {showSuccess && (
                <div className="fixed top-5 right-5 z-[100] bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg flex items-center animate-fade-in-out">
                    <CheckCircleIcon className="h-6 w-6 mr-2" />
                    <span>Configurações salvas com sucesso!</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Configurações de Impressão</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Cabeçalho da Impressão</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Configure as informações que aparecerão no cabeçalho dos documentos impressos.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nome da Empresa *
                        </label>
                        <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            value={settings.companyName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Digite o nome da empresa"
                        />
                    </div>

                    <div>
                        <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            CNPJ
                        </label>
                        <input
                            type="text"
                            id="cnpj"
                            name="cnpj"
                            value={settings.cnpj}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="00.000.000/0000-00"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Telefone
                        </label>
                        <input
                            type="text"
                            id="phone"
                            name="phone"
                            value={settings.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="(00) 0000-0000"
                        />
                    </div>

                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Endereço
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={settings.address}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Rua, número, bairro, cidade - Estado, CEP"
                        />
                    </div>

                    <div>
                        <label htmlFor="logo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Logo da Empresa
                        </label>
                        <div className="space-y-4">
                            {logoPreview && (
                                <div className="relative inline-block">
                                    <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        className="max-h-32 max-w-48 object-contain border border-slate-300 dark:border-slate-600 rounded-md p-2 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <div>
                                <input
                                    type="file"
                                    id="logo"
                                    name="logo"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-200"
                                />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 2MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Salvar Configurações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;

