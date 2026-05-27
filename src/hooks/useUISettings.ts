import { useState } from 'react';
import type { UISettings } from '@/types';

const UI_SETTINGS_KEY = 'kindle-your-start:ui-settings:v1';

function loadUISettings(): UISettings {
    try {
        // Migrate from old un-namespaced key
        const legacy = localStorage.getItem('ui_settings');
        if (legacy) {
            localStorage.setItem(UI_SETTINGS_KEY, legacy);
            localStorage.removeItem('ui_settings');
            return JSON.parse(legacy) as UISettings;
        }
        const raw = localStorage.getItem(UI_SETTINGS_KEY);
        return raw ? (JSON.parse(raw) as UISettings) : { showChatBackgrounds: true };
    } catch {
        return { showChatBackgrounds: true };
    }
}

export function useUISettings() {
    const [settings, setSettings] = useState<UISettings>(loadUISettings);

    const updateSettings = (newSettings: Partial<UISettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            try {
                localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(updated));
            } catch {
                // Ignore quota/private browsing errors
            }
            return updated;
        });
    };

    return {
        settings,
        updateSettings
    };
}
