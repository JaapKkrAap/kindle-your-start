/**
 * Avatar utility functions for consistent avatar generation across the app
 */

/**
 * Generates a consistent color based on a name string
 * @param name - The name to generate a color for
 * @returns HSL color string
 */
export function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate a hue between 0-360
    const hue = Math.abs(hash) % 360;

    // Use consistent saturation and lightness for better visual harmony
    return `hsl(${hue}, 55%, 45%)`;
}

/**
 * Generates initials from a name
 * @param name - The full name
 * @param maxLength - Maximum number of initials (default: 2)
 * @returns Uppercase initials
 */
export function getAvatarInitials(name: string, maxLength: number = 2): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, maxLength);
}

/**
 * Gets avatar display properties for a given name
 * @param name - The name to generate properties for
 * @returns Object containing color and initials
 */
export function getAvatarProps(name: string) {
    return {
        color: getAvatarColor(name),
        initials: getAvatarInitials(name),
    };
}
