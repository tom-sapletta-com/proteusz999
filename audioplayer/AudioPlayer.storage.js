/**
 * AudioPlayer.storage.js - Obsługa przechowywania i przywracania pozycji odtwarzania
 */

export class StorageManager {
    constructor(player) {
        this.player = player;
    }

    /**
     * Zapisanie pozycji odtwarzania w localStorage
     */
    savePlaybackPosition() {
        if (!this.player.audioElement ||
            !this.player.audioId ||
            this.player.audioElement.currentTime <= 0 ||
            !this.player.audioElement.duration) return;

        try {
            const position = this.player.audioElement.currentTime;
            const storageKey = `${this.player.options.storagePrefix}${this.player.audioId}`;
            localStorage.setItem(storageKey, position.toString());
        } catch (e) {
            console.warn('Failed to save playback position:', e);
        }
    }

    /**
     * Przywrócenie pozycji odtwarzania z localStorage
     */
    restorePlaybackPosition() {
        if (!this.player.audioElement || !this.player.audioId) return;

        try {
            const position = this.getPlaybackPositionFromStorage();
            if (position !== null && !isNaN(position) && position > 0) {
                // Sprawdź czy audio jest gotowe do odtwarzania
                const setPosition = () => {
                    if (this.player.audioElement) {
                        this.player.audioElement.currentTime = position;
                        if (this.player.ui) {
                            this.player.ui.updateProgress();
                        }
                    }
                };

                if (this.player.audioElement.readyState >= 1) {
                    setPosition();
                } else {
                    // Jeśli audio nie jest gotowe, ustaw nasłuchiwanie na zdarzenie canplay
                    const setPositionOnCanPlay = () => {
                        setPosition();
                        if (this.player.audioElement) {
                            this.player.audioElement.removeEventListener('canplay', setPositionOnCanPlay);
                        }
                    };
                    this.player.audioElement.addEventListener('canplay', setPositionOnCanPlay);
                }
            }
        } catch (e) {
            console.warn('Failed to restore playback position:', e);
        }
    }

    /**
     * Pobranie pozycji odtwarzania z localStorage
     */
    getPlaybackPositionFromStorage() {
        if (!this.player.audioId) return null;

        try {
            const storageKey = `${this.player.options.storagePrefix}${this.player.audioId}`;
            const positionStr = localStorage.getItem(storageKey);
            return positionStr ? parseFloat(positionStr) : null;
        } catch (e) {
            console.warn('Failed to get playback position from storage:', e);
            return null;
        }
    }

    /**
     * Wyczyszczenie zapisanej pozycji odtwarzania
     */
    clearPlaybackPosition() {
        if (!this.player.audioId) return;

        try {
            const storageKey = `${this.player.options.storagePrefix}${this.player.audioId}`;
            localStorage.removeItem(storageKey);
        } catch (e) {
            console.warn('Failed to clear playback position:', e);
        }
    }

    /**
     * Wyczyszczenie wszystkich zapisanych pozycji odtwarzania
     */
    clearAllPositions() {
        try {
            const prefix = this.player.options.storagePrefix;

            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('Failed to clear all playback positions:', e);
        }
    }

    /**
     * Pobiera wszystkie zapisane pliki audio
     */
    getAllSavedAudio() {
        try {
            const prefix = this.player.options.storagePrefix;
            const result = [];

            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(prefix)) {
                    const audioId = key.substring(prefix.length);
                    const position = parseFloat(localStorage.getItem(key));

                    result.push({
                        id: audioId,
                        position: position,
                        formattedPosition: this.formatTime(position)
                    });
                }
            });

            return result;
        } catch (e) {
            console.warn('Failed to get all saved audio:', e);
            return [];
        }
    }

    /**
     * Formatowanie czasu
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}