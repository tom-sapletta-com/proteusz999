/**
 * AudioPlayer.playlist.js - Zarządzanie playlistami
 */

export class PlaylistManager {
    constructor(player) {
        this.player = player;
        this.tracks = [];
        this.currentTrackIndex = -1;
        this.loop = false;
        this.shuffle = false;
        this.shuffledIndices = [];
        this.historyIndices = [];
        this.historyPosition = -1;
    }

    /**
     * Ustawia playlistę jako tablicę utworów
     * @param {Array} tracks - tablica utworów [{src, title, artist, ...}]
     * @param {Boolean} autoplay - czy rozpocząć odtwarzanie automatycznie
     */
    setPlaylist(tracks, autoplay = false) {
        if (!Array.isArray(tracks) || tracks.length === 0) {
            console.error('Invalid playlist: tracks must be a non-empty array');
            if (this.player.options.debug) {
                this.player.debug.log('Invalid playlist provided', tracks);
            }
            return false;
        }

        // Zapisz nową playlistę
        this.tracks = tracks.map(track => this._normalizeTrackObject(track));
        this.currentTrackIndex = -1;
        this.historyIndices = [];
        this.historyPosition = -1;

        // Jeśli włączone tasowanie, przygotuj tablicę tasowania
        if (this.shuffle) {
            this._generateShuffledIndices();
        }

        // Aktualizuj interfejs użytkownika, jeśli istnieje
        this._updatePlaylistUI();

        if (this.player.options.debug) {
            this.player.debug.log('Playlist set', {
                tracks: this.tracks,
                count: this.tracks.length
            });
        }

        // Odtwórz pierwszy utwór, jeśli autoplay jest włączony
        if (autoplay && this.tracks.length > 0) {
            this.playTrack(0);
        }

        return true;
    }

    /**
     * Dodaje utwór do playlisty
     * @param {Object} track - obiekt utworu {src, title, artist, ...}
     * @param {Number} position - opcjonalna pozycja, na którą dodać utwór
     * @returns {Number} - indeks dodanego utworu
     */
    addTrack(track, position = null) {
        const normalizedTrack = this._normalizeTrackObject(track);

        if (position !== null && position >= 0 && position <= this.tracks.length) {
            this.tracks.splice(position, 0, normalizedTrack);

            // Zaktualizuj currentTrackIndex, jeśli dodano przed bieżącym utworem
            if (this.currentTrackIndex >= position) {
                this.currentTrackIndex++;
            }
        } else {
            this.tracks.push(normalizedTrack);
        }

        // Jeśli włączone tasowanie, zaktualizuj tablicę tasowania
        if (this.shuffle) {
            this._generateShuffledIndices();
        }

        // Aktualizuj interfejs użytkownika
        this._updatePlaylistUI();

        if (this.player.options.debug) {
            this.player.debug.log('Track added to playlist', {
                track: normalizedTrack,
                position: position !== null ? position : this.tracks.length - 1
            });
        }

        return position !== null ? position : this.tracks.length - 1;
    }

    /**
     * Usuwa utwór z playlisty
     * @param {Number} index - indeks utworu do usunięcia
     */
    removeTrack(index) {
        if (index < 0 || index >= this.tracks.length) {
            console.error(`Invalid track index: ${index}`);
            return false;
        }

        // Zapisz czy usuwany jest aktualnie odtwarzany utwór
        const isCurrentTrack = (index === this.currentTrackIndex);

        // Usuń utwór
        this.tracks.splice(index, 1);

        // Zaktualizuj currentTrackIndex
        if (isCurrentTrack) {
            // Jeśli usunięto aktualnie odtwarzany utwór, zatrzymaj odtwarzanie
            // lub przejdź do następnego, jeśli jest dostępny
            if (this.tracks.length === 0) {
                this.currentTrackIndex = -1;
                this.player.pause();
                this.player.audioElement.src = '';
            } else if (this.shuffle) {
                // Podczas tasowania, po prostu przejdź do następnego utworu
                this._generateShuffledIndices();
                this.playNext();
            } else if (index < this.tracks.length) {
                // Odtwarzaj następny utwór na tej samej pozycji
                this.playTrack(index);
            } else {
                // Jeśli usunięto ostatni utwór, odtwarzaj poprzedni
                this.playTrack(index - 1);
            }
        } else if (index < this.currentTrackIndex) {
            // Jeśli usunięto utwór przed aktualnie odtwarzanym, zaktualizuj indeks
            this.currentTrackIndex--;
        }

        // Jeśli włączone tasowanie, zaktualizuj tablicę tasowania
        if (this.shuffle) {
            this._generateShuffledIndices();
        }

        // Aktualizuj interfejs użytkownika
        this._updatePlaylistUI();

        if (this.player.options.debug) {
            this.player.debug.log('Track removed from playlist', {
                index,
                isCurrentTrack,
                remainingTracks: this.tracks.length
            });
        }

        return true;
    }

    /**
     * Odtwarza konkretny utwór z playlisty
     * @param {Number} index - indeks utworu do odtworzenia
     */
    playTrack(index) {
        if (index < 0 || index >= this.tracks.length) {
            console.error(`Invalid track index: ${index}`);
            return false;
        }

        const track = this.tracks[index];

        // Załaduj i odtwórz utwór
        this.currentTrackIndex = index;

        if (this.player.options.debug) {
            this.player.debug.log('Playing track', {
                index,
                track: track
            });
        }

        // Zaktualizuj historię odtwarzania
        this._updateHistory(index);

        try {
            // Ustaw informacje o utworze
            this.player.setTrackInfo(track.title, track.artist);

            // Załaduj i odtwórz utwór
            this.player.load(track.src);
            this.player.play();

            // Aktualizuj aktywny utwór w interfejsie playlisty
            this._updatePlaylistUI();

            return true;
        } catch (error) {
            console.error(`Error playing track: ${error.message}`);
            if (this.player.options.debug) {
                this.player.debug.log('Error playing track', error);
            }
            return false;
        }
    }

    /**
     * Odtwarza następny utwór z playlisty
     */
    playNext() {
        if (this.tracks.length === 0) {
            return false;
        }

        let nextIndex;

        if (this.shuffle) {
            // Użyj następnego indeksu z tasowanej tablicy
            const currentShuffleIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
            if (currentShuffleIndex === -1 || currentShuffleIndex === this.shuffledIndices.length - 1) {
                // Jeśli jesteśmy na końcu, albo rozpocznij od nowa albo zatrzymaj
                if (this.loop) {
                    nextIndex = this.shuffledIndices[0];
                } else {
                    this.player.pause();
                    return false;
                }
            } else {
                nextIndex = this.shuffledIndices[currentShuffleIndex + 1];
            }
        } else {
            // Standardowe odtwarzanie sekwencyjne
            if (this.currentTrackIndex >= this.tracks.length - 1) {
                // Jeśli jesteśmy na końcu, albo rozpocznij od nowa albo zatrzymaj
                if (this.loop) {
                    nextIndex = 0;
                } else {
                    this.player.pause();
                    return false;
                }
            } else {
                nextIndex = this.currentTrackIndex + 1;
            }
        }

        return this.playTrack(nextIndex);
    }

    /**
     * Odtwarza poprzedni utwór z playlisty
     */
    playPrevious() {
        if (this.tracks.length === 0) {
            return false;
        }

        // Sprawdź najpierw czy możemy wrócić w historii
        if (this.historyIndices.length > 1 && this.historyPosition > 0) {
            this.historyPosition--;
            const prevIndex = this.historyIndices[this.historyPosition];
            return this.playTrack(prevIndex);
        }

        // Jeśli nie ma historii lub jesteśmy na początku, użyj standardowej logiki
        let prevIndex;

        if (this.shuffle) {
            // Użyj poprzedniego indeksu z tasowanej tablicy
            const currentShuffleIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
            if (currentShuffleIndex <= 0) {
                // Jeśli jesteśmy na początku, albo przejdź na koniec albo zostań
                if (this.loop) {
                    prevIndex = this.shuffledIndices[this.shuffledIndices.length - 1];
                } else {
                    // Rozpocznij aktualny utwór od początku
                    if (this.player.audioElement) {
                        this.player.audioElement.currentTime = 0;
                    }
                    return false;
                }
            } else {
                prevIndex = this.shuffledIndices[currentShuffleIndex - 1];
            }
        } else {
            // Standardowe odtwarzanie sekwencyjne
            if (this.currentTrackIndex <= 0) {
                // Jeśli jesteśmy na początku, albo przejdź na koniec albo zostań
                if (this.loop) {
                    prevIndex = this.tracks.length - 1;
                } else {
                    // Rozpocznij aktualny utwór od początku
                    if (this.player.audioElement) {
                        this.player.audioElement.currentTime = 0;
                    }
                    return false;
                }
            } else {
                prevIndex = this.currentTrackIndex - 1;
            }
        }

        return this.playTrack(prevIndex);
    }

    /**
     * Włącza/wyłącza zapętlenie playlisty
     * @param {Boolean} enable - czy włączyć zapętlenie
     */
    toggleLoop(enable = null) {
        if (enable !== null) {
            this.loop = !!enable;
        } else {
            this.loop = !this.loop;
        }

        // Aktualizuj interfejs użytkownika
        this._updatePlaylistUI();

        if (this.player.options.debug) {
            this.player.debug.log(`Loop ${this.loop ? 'enabled' : 'disabled'}`);
        }

        return this.loop;
    }

    /**
     * Włącza/wyłącza tasowanie playlisty
     * @param {Boolean} enable - czy włączyć tasowanie
     */
    toggleShuffle(enable = null) {
        if (enable !== null) {
            this.shuffle = !!enable;
        } else {
            this.shuffle = !this.shuffle;
        }

        if (this.shuffle) {
            this._generateShuffledIndices();
        }

        // Aktualizuj interfejs użytkownika
        this._updatePlaylistUI();

        if (this.player.options.debug) {
            this.player.debug.log(`Shuffle ${this.shuffle ? 'enabled' : 'disabled'}`);
        }

        return this.shuffle;
    }

    /**
     * Pobiera informacje o aktualnie odtwarzanym utworze
     * @returns {Object|null} - obiekt utworu lub null, jeśli nic nie jest odtwarzane
     */
    getCurrentTrack() {
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.tracks.length) {
            return {...this.tracks[this.currentTrackIndex], index: this.currentTrackIndex};
        }
        return null;
    }

    /**
     * Pobiera całą playlistę
     * @returns {Array} - tablica utworów
     */
    getPlaylist() {
        return [...this.tracks];
    }

    /**
     * Czyści playlistę
     */
    clear() {
        this.tracks = [];
        this.currentTrackIndex = -1;
        this.shuffledIndices = [];
        this.historyIndices = [];
        this.historyPosition = -1;

        this.player.pause();
        if (this.player.audioElement) {
            this.player.audioElement.src = '';
        }

        // Aktualizuj interfejs użytkownika
        this._updatePlaylistUI();

        if (this.player.options.debug) {
            this.player.debug.log('Playlist cleared');
        }

        return true;
    }

    /**
     * Zapisuje playlistę pod wskazaną nazwą
     * @param {String} name - nazwa playlisty
     */
    savePlaylist(name) {
        if (!name) {
            console.error('Playlist name is required');
            return false;
        }

        try {
            const storageKey = `${this.player.options.storagePrefix}playlist_${name}`;
            const playlistData = JSON.stringify(this.tracks);
            localStorage.setItem(storageKey, playlistData);

            if (this.player.options.debug) {
                this.player.debug.log(`Playlist saved as "${name}"`, {
                    tracks: this.tracks.length
                });
            }

            return true;
        } catch (error) {
            console.error(`Error saving playlist: ${error.message}`);
            if (this.player.options.debug) {
                this.player.debug.log('Error saving playlist', error);
            }
            return false;
        }
    }

    /**
     * Wczytuje playlistę o wskazanej nazwie
     * @param {String} name - nazwa playlisty
     * @param {Boolean} autoplay - czy rozpocząć odtwarzanie automatycznie
     */
    loadPlaylist(name, autoplay = false) {
        if (!name) {
            console.error('Playlist name is required');
            return false;
        }

        try {
            const storageKey = `${this.player.options.storagePrefix}playlist_${name}`;
            const playlistData = localStorage.getItem(storageKey);

            if (!playlistData) {
                console.error(`Playlist "${name}" not found`);
                return false;
            }

            const tracks = JSON.parse(playlistData);
            return this.setPlaylist(tracks, autoplay);
        } catch (error) {
            console.error(`Error loading playlist: ${error.message}`);
            if (this.player.options.debug) {
                this.player.debug.log('Error loading playlist', error);
            }
            return false;
        }
    }

    /**
     * Pobiera listę zapisanych playlist
     * @returns {Array} - tablica nazw playlist
     */
    getSavedPlaylists() {
        try {
            const prefix = `${this.player.options.storagePrefix}playlist_`;
            const playlists = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    playlists.push(key.substring(prefix.length));
                }
            }

            return playlists;
        } catch (error) {
            console.error(`Error getting saved playlists: ${error.message}`);
            if (this.player.options.debug) {
                this.player.debug.log('Error getting saved playlists', error);
            }
            return [];
        }
    }

    /**
     * Usuwa zapisaną playlistę
     * @param {String} name - nazwa playlisty do usunięcia
     */
    deleteSavedPlaylist(name) {
        if (!name) {
            console.error('Playlist name is required');
            return false;
        }

        try {
            const storageKey = `${this.player.options.storagePrefix}playlist_${name}`;
            localStorage.removeItem(storageKey);

            if (this.player.options.debug) {
                this.player.debug.log(`Playlist "${name}" deleted`);
            }

            return true;
        } catch (error) {
            console.error(`Error deleting playlist: ${error.message}`);
            if (this.player.options.debug) {
                this.player.debug.log('Error deleting playlist', error);
            }
            return false;
        }
    }

    /**
     * Normalizuje obiekt utworu, dodając brakujące pola
     * @private
     */
    _normalizeTrackObject(track) {
        // Jeśli przekazano string, potraktuj go jako URL
        if (typeof track === 'string') {
            track = {src: track};
        }

        // Podstawowa walidacja
        if (!track || typeof track !== 'object') {
            throw new Error('Invalid track object');
        }

        if (!track.src) {
            throw new Error('Track must have a src property');
        }

        // Uzupełnij brakujące pola
        return {
            src: track.src,
            title: track.title || this._extractFilename(track.src),
            artist: track.artist || '',
            album: track.album || '',
            duration: track.duration || 0,
            thumbnail: track.thumbnail || null,
            ...track
        };
    }

    /**
     * Aktualizuje interfejs użytkownika playlisty
     * @private
     */
    _updatePlaylistUI() {
        // Ta metoda zostanie pełniej zaimplementowana po dodaniu UI dla playlisty
        const event = new CustomEvent('playlistUpdated', {
            detail: {
                tracks: this.tracks,
                currentTrack: this.getCurrentTrack(),
                loop: this.loop,
                shuffle: this.shuffle
            }
        });

        this.player.container.dispatchEvent(event);
    }

    /**
     * Generuje tablicę potasowanych indeksów
     * @private
     */
    _generateShuffledIndices() {
        // Utwórz tablicę indeksów
        this.shuffledIndices = Array.from({length: this.tracks.length}, (_, i) => i);

        // Tasuj tablicę (algorytm Fisher-Yates)
        for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledIndices[i], this.shuffledIndices[j]] = [this.shuffledIndices[j], this.shuffledIndices[i]];
        }

        // Upewnij się, że aktualnie odtwarzany utwór jest na początku, jeśli istnieje
        if (this.currentTrackIndex !== -1) {
            const currentIndex = this.shuffledIndices.indexOf(this.currentTrackIndex);
            if (currentIndex !== -1) {
                this.shuffledIndices.splice(currentIndex, 1);
                this.shuffledIndices.unshift(this.currentTrackIndex);
            }
        }
    }

    /**
     * Aktualizuje historię odtwarzania
     * @private
     */
    _updateHistory(trackIndex) {
        // Jeśli cofnęliśmy się w historii, usuń wszystko od bieżącej pozycji do końca
        if (this.historyPosition >= 0 && this.historyPosition < this.historyIndices.length - 1) {
            this.historyIndices = this.historyIndices.slice(0, this.historyPosition + 1);
        }

        // Dodaj nowy indeks do historii
        this.historyIndices.push(trackIndex);
        this.historyPosition = this.historyIndices.length - 1;

        // Ogranicz rozmiar historii
        const MAX_HISTORY = 50;
        if (this.historyIndices.length > MAX_HISTORY) {
            this.historyIndices = this.historyIndices.slice(-MAX_HISTORY);
            this.historyPosition = this.historyIndices.length - 1;
        }
    }

    /**
     * Wyodrębnia nazwę pliku z URL
     * @private
     */
    _extractFilename(url) {
        if (!url) return 'Unknown Track';

        try {
            // Usuń parametry zapytania
            const path = url.split('?')[0];

            // Pobierz ostatnią część ścieżki
            const filename = path.split('/').pop();

            // Usuń rozszerzenie pliku
            const name = filename.split('.').slice(0, -1).join('.');

            // Zamień podkreślenia i myślniki na spacje, zastąp %20 itp.
            return decodeURIComponent(name).replace(/[_-]/g, ' ');
        } catch (e) {
            return 'Unknown Track';
        }
    }
}