/**
 * AudioPlayer.utils.js - Funkcje pomocnicze dla odtwarzacza audio
 */

export class Utils {
    /**
     * Sprawdza wsparcie dla MediaSource API
     */
    static checkMediaSourceSupport() {
        return (typeof window !== 'undefined' &&
            window.MediaSource !== undefined &&
            typeof window.MediaSource.isTypeSupported === 'function' &&
            window.MediaSource.isTypeSupported('audio/mpeg'));
    }

    /**
     * Generuje unikalny identyfikator dla pliku audio
     */
    static generateAudioId(src) {
        if (!src) return 'default-audio';

        // Proste kodowanie URL as hash
        const cleanSrc = src.split('?')[0]; // Usuń parametry query
        return cleanSrc.split('/').pop() || 'audio-file';
    }

    /**
     * Formatowanie czasu w sekundy na format MM:SS
     */
    static formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * Bezpieczne wykonanie funkcji z obsługą błędów
     */
    static safeExecute(fn, errorMessage = 'Error executing function') {
        try {
            return fn();
        } catch (e) {
            console.error(errorMessage, e);
            return null;
        }
    }

    /**
     * Generuje unikalne ID dla elementów DOM
     */
    static generateUniqueId(prefix = 'element') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sprawdza, czy element jest podłączony do DOM
     */
    static isElementConnected(element) {
        return element && element.isConnected;
    }

    /**
     * Opóźnione wykonanie funkcji
     */
    static debounce(func, wait) {
        let timeout;
        return function (...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}