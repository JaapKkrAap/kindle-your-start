import { useMemo } from 'react';
import type { WorldState } from '@/types';

// Fallback gradients based on mood/time/location
const getFallbackGradient = (state: WorldState): string => {
    const { mood, timeOfDay, location } = state;

    // Base colors for time
    const isNight = timeOfDay === 'night';

    // Mood overlays
    switch (mood) {
        case 'romantic':
            return isNight
                ? 'linear-gradient(to bottom, #2c1628, #5c2e47)' // Deep romantic night
                : 'linear-gradient(to bottom, #ffd1dc, #ff9a9e)'; // Soft romantic day
        case 'tense':
            return isNight
                ? 'linear-gradient(to bottom, #0f0f0f, #2a0a0a)' // Dark tense night
                : 'linear-gradient(to bottom, #4a4a4a, #7a2828)'; // Tense cloudy day
        case 'mysterious':
            return isNight
                ? 'linear-gradient(to bottom, #050510, #1a1a40)' // Deep mysterious night
                : 'linear-gradient(to bottom, #2c3e50, #bdc3c7)'; // Foggy mysterious day
        case 'peaceful':
            return isNight
                ? 'linear-gradient(to bottom, #0b1026, #2b32b2)' // Peaceful night
                : 'linear-gradient(to bottom, #83a4d4, #b6fbff)'; // Peaceful day
        default: // neutral
            if (location === 'nature') return isNight ? '#0a1a0f' : '#e0f7fa';
            if (location === 'urban') return isNight ? '#1a1a1a' : '#f5f5f5';
            return isNight ? '#121212' : '#f0f0f0';
    }
};

export function useBackgroundSelector(worldState: WorldState) {
    const backgroundUrl = useMemo(() => {
        // Construct expected filename
        // Format: location-time-mood.webp (or jpg, we'll try webp)
        const filename = `${worldState.location}-${worldState.timeOfDay}-${worldState.mood}.webp`;
        return `/backgrounds/${filename}`;
    }, [worldState]);

    const fallbackBackground = useMemo(() => {
        return getFallbackGradient(worldState);
    }, [worldState]);

    return {
        backgroundUrl,
        fallbackBackground
    };
}
