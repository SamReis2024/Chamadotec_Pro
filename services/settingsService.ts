import { PrintHeaderSettings } from '../types';

const SETTINGS_KEY = 'helpdesk_pro_print_settings';

class SettingsService {
    public getPrintHeaderSettings(): PrintHeaderSettings {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            companyName: '',
            cnpj: '',
            phone: '',
            address: '',
            logo: null,
        };
    }

    public savePrintHeaderSettings(settings: PrintHeaderSettings): void {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
}

export const settingsService = new SettingsService();

