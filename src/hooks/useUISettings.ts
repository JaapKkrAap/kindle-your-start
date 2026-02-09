import { useState, useEffect } from 'react';
import type { UISettings } from '@/types';

export function useUISettings() {
    const [settings, setSettings] = useState<UISettings>(() => {
        const stored = localStorage.getItem('ui_settings');
        return stored ? JSON.parse(stored) : { showChatBackgrounds: true };
    });

    const updateSettings = (newSettings: Partial<UISettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('ui_settings', JSON.stringify(updated));
            return updated;
        });
    };

    return {
        settings,
        updateSettings
    };
}
