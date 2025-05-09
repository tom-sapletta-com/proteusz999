/**
 * AudioPlayer.core.js - Główna klasa odtwarzacza audio
 */

import { StorageManager } from './AudioPlayer.storage.js';
import { UIManager } from './AudioPlayer.ui.js';
import { EventManager } from './AudioPlayer.events.js';
import { Utils } from './AudioPlayer.utils.js';
import { DebugHelper } from './AudioPlayer.debug.js';
import { PlaylistManager } from './AudioPlayer.playlist.js';
import { PlaylistUIManager } from './AudioPlayer.playlistUI.js';

class AudioPlayer {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'audio-player-container',
      audioSrc: options.audioSrc || '',
      autoplay: options.autoplay || false,
      showWaveform: options.showWaveform || false,
      theme: options.theme || 'dark', // 'dark' lub 'light'
      rememberPosition: options.rememberPosition !== undefined ? options.rememberPosition : true,
      storagePrefix: options.storagePrefix || 'audioPlayer_',
      debug: options.debug || false,
      showPlaylist: options.showPlaylist !== undefined ? options.showPlaylist : true,
      ...options
    };

    this.isPlaying = false;
    this.audioElement = null;
    this.container = null;
    this.audioId = Utils.generateAudioId(this.options.audioSrc);
    this.hasMediaSourceSupport = Utils.checkMediaSourceSupport();

    // Menedżery funkcjonalności
    this.storage = null;
    this.ui = null;
    this.events = null;
    this.playlist = null;
    this.playlistUI = null;

    // Narzędzie do debugowania
    this.debug = new DebugHelper(this);
    if (this.options.debug) {
      this.debug.enable();
      this.debug.log('AudioPlayer initialized with options', this.options);
    }

    // Inicjalizacja odtwarzacza
    this.initialize();
  }

  /**
   * Inicjalizacja odtwarzacza
   */
  initialize() {
    try {
      // Pobierz lub utwórz kontener
      this.container = document.getElementById(this.options.containerId);
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = this.options.containerId;
        document.body.appendChild(this.container);

        if (this.options.debug) {
          this.debug.log('Container created dynamically', this.container);
        }
      } else if (this.options.debug) {
        this.debug.log('Using existing container', this.container);
      }

      // Inicjalizacja menedżerów w odpowiedniej kolejności
      // 1. Najpierw UI - tworzy elementy HTML
      this.ui = new UIManager(this);
      const uiInitialized = this.ui.createPlayerElements();

      if (!uiInitialized) {
        console.error('UI initialization failed. Cannot create audio element.');
        if (this.options.debug) {
          this.debug.log('UI initialization failed', { container: this.container });
          this.debug.createDebugPanel();
        }
        return;
      }

      if (this.options.debug) {
        this.debug.log('UI initialized successfully');
        this.debug.testAudioElement();
      }

      this.ui.applyStyles();

      // Dodatkowe sprawdzenie czy element audio został poprawnie utworzony
      if (!this.audioElement) {
        console.error('Audio element not initialized correctly');
        if (this.options.debug) {
          this.debug.log('Audio element not initialized correctly');
          this.debug.createDebugPanel();
        }
        return;
      }

      // 2. Najpierw storage - zarządza przechowywaniem danych
      this.storage = new StorageManager(this);

      // 3. Inicjalizacja playlist
      this.playlist = new PlaylistManager(this);

      // 4. UI dla playlisty (jeśli opcja jest włączona)
      if (this.options.showPlaylist) {
        this.playlistUI = new PlaylistUIManager(this);
        this.playlistUI.initialize();
      }

      // 5. Na końcu events - dodaje obsługę zdarzeń do już utworzonych elementów
      this.events = new EventManager(this);

      // Inicjalizacja zdarzeń po krótkim opóźnieniu
      setTimeout(() => {
        this._initializePlayerFunctions();
      }, 200);

    } catch (error) {
      console.error('Error initializing player:', error);
      if (this.options.debug) {
        this.debug.log('Error during initialization', error);
        this.debug.createDebugPanel();
      }
    }
  }

  /**
   * Inicjalizacja funkcji odtwarzacza (po załadowaniu elementów)
   * @private
   */
  _initializePlayerFunctions() {
    try {
      if (!this.audioElement) {
        console.error('Audio element not initialized correctly after waiting');
        if (this.options.debug) {
          this.debug.log('Audio element still not available after waiting');
          this.debug.createDebugPanel();
        }
        return;
      }

      // Dodaj nasłuchiwanie zdarzeń
      this.events.addEventListeners();

      // Jeśli jest przekazany audioSrc, dodajmy go jako pierwszy utwór do playlisty
      if (this.options.audioSrc && this.playlist) {
        this.playlist.addTrack(this.options.audioSrc);

        if (this.options.debug) {
          this.debug.log('Added initial track to playlist', { src: this.options.audioSrc });
        }
      }

      // Podłącz obsługę zakończenia utworu
      this.audioElement.addEventListener('ended', () => {
        if (this.playlist) {
          if (this.options.debug) {
            this.debug.log('Track ended, playing next');
          }
          this.playlist.playNext();
        }
      });

      // Przywróć zapisaną pozycję, jeśli opcja jest włączona
      if (this.options.rememberPosition && this.storage) {
        this.storage.restorePlaybackPosition();
      }

      // Sprawdź, czy możemy odtwarzać
      if (this.options.autoplay && typeof this.audioElement.play === 'function') {
        try {
          const playPromise = this.audioElement.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.warn('Autoplay prevented:', error);
              if (this.options.debug) {
                this.debug.log('Autoplay prevented', error);
              }
            });
          }
        } catch (e) {
          console.warn('Error during autoplay:', e);
          if (this.options.debug) {
            this.debug.log('Error during autoplay', e);
          }
        }
      }

      if (this.options.debug) {
        this.debug.log('Player fully initialized');
        this.debug.updateDebugPanel();
      }

    } catch (error) {
      console.error('Error initializing player functions:', error);
      if (this.options.debug) {
        this.debug.log('Error initializing player functions', error);
      }
    }
  }

  /**
   * Przełączanie odtwarzania/pauzy
   */
  togglePlay() {
    if (!this.audioElement) {
      if (this.options.debug) {
        this.debug.log('Cannot toggle play - audioElement is null');
      }
      return;
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }

    if (this.options.debug) {
      this.debug.log(`Toggled play state to: ${this.isPlaying ? 'playing' : 'paused'}`);
      this.debug.updateDebugPanel();
    }
  }

  /**
   * Rozpoczęcie odtwarzania
   */
  play() {
    if (!this.audioElement) {
      if (this.options.debug) {
        this.debug.log('Cannot play - audioElement is null');
      }
      return;
    }

    // Ustaw źródło jeśli nie jest ustawione
    if (!this.audioElement.src && this.options.audioSrc) {
      this.audioElement.src = this.options.audioSrc;
      if (this.options.debug) {
        this.debug.log(`Set audio source to: ${this.options.audioSrc}`);
      }
      this.audioElement.load();
    }

    try {
      const playPromise = this.audioElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            if (this.ui) {
              this.ui.updatePlayPauseUI();
            }
            if (this.options.debug) {
              this.debug.log('Playing successfully started');
              this.debug.updateDebugPanel();
            }
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            if (this.options.debug) {
              this.debug.log('Error playing audio', error);
              this.debug.updateDebugPanel();
            }

            // Handling autoplay policy
            if (error.name === 'NotAllowedError') {
              console.warn('Autoplay was prevented. User interaction required.');
              if (this.options.debug) {
                this.debug.log('Autoplay prevented by browser policy');
              }
            }
          });
      } else {
        this.isPlaying = true;
        if (this.ui) {
          this.ui.updatePlayPauseUI();
        }
        if (this.options.debug) {
          this.debug.log('Playing started (legacy mode)');
          this.debug.updateDebugPanel();
        }
      }
    } catch (e) {
      console.error('Error while trying to play audio:', e);
      if (this.options.debug) {
        this.debug.log('Exception while trying to play audio', e);
        this.debug.updateDebugPanel();
      }
    }
  }

  /**
   * Zatrzymanie odtwarzania
   */
  pause() {
    if (!this.audioElement) {
      if (this.options.debug) {
        this.debug.log('Cannot pause - audioElement is null');
      }
      return;
    }

    try {
      this.audioElement.pause();
      this.isPlaying = false;

      if (this.ui) {
        this.ui.updatePlayPauseUI();
      }

      // Zapisz pozycję przy zatrzymaniu
      if (this.options.rememberPosition && this.storage) {
        this.storage.savePlaybackPosition();
      }

      if (this.options.debug) {
        this.debug.log('Playback paused');
        this.debug.updateDebugPanel();
      }
    } catch (e) {
      console.error('Error while trying to pause audio:', e);
      if (this.options.debug) {
        this.debug.log('Exception while trying to pause audio', e);
      }
    }
  }

  /**
   * Załadowanie nowego pliku audio
   */
  load(audioSrc) {
    if (!audioSrc) {
      if (this.options.debug) {
        this.debug.log('Cannot load - audioSrc is empty');
      }
      return;
    }

    if (!this.audioElement) {
      if (this.options.debug) {
        this.debug.log('Cannot load - audioElement is null');
      }
      return;
    }

    // Aktualizuj ID audio dla nowego źródła
    this.audioId = Utils.generateAudioId(audioSrc);
    this.options.audioSrc = audioSrc;

    if (this.options.debug) {
      this.debug.log(`Loading new audio source: ${audioSrc}`);
    }

    // Zatrzymaj odtwarzanie i wyczyść źródło
    this.pause();

    try {
      // Ustaw nowe źródło
      this.audioElement.src = audioSrc;
      this.audioElement.load();

      if (this.options.debug) {
        this.debug.log('New audio source loaded successfully');
        this.debug.updateDebugPanel();
      }
    } catch (e) {
      console.error('Error loading audio source:', e);
      if (this.options.debug) {
        this.debug.log('Exception while loading audio source', e);
      }
    }
  }

  /**
   * Ustawienie informacji o utworze
   */
  setTrackInfo(title, artist) {
    if (this.ui) {
      this.ui.setTrackInfo(title, artist);
    }

    if (this.options.debug) {
      this.debug.log(`Track info updated - Title: ${title}, Artist: ${artist}`);
    }
  }

  /**
   * Ustawienie głośności
   */
  setVolume(value) {
    if (!this.audioElement) {
      if (this.options.debug) {
        this.debug.log('Cannot set volume - audioElement is null');
      }
      return;
    }

    const volume = Math.max(0, Math.min(1, value));
    this.audioElement.volume = volume;

    if (this.ui && this.ui.volumeSliderFill) {
      this.ui.volumeSliderFill.style.width = `${volume * 100}%`;
    }

    if (volume === 0) {
      this.audioElement.muted = true;
    } else if (this.audioElement.muted) {
      this.audioElement.muted = false;
    }

    if (this.ui) {
      this.ui.updateVolumeUI();
    }

    if (this.options.debug) {
      this.debug.log(`Volume set to: ${volume}`);
      this.debug.updateDebugPanel();
    }
  }

  /**
   * Przełączanie wyciszenia
   */
  toggleMute() {
    if (!this.audioElement) {
      if (this.options.debug) {
        this.debug.log('Cannot toggle mute - audioElement is null');
      }
      return;
    }

    this.audioElement.muted = !this.audioElement.muted;

    if (this.ui) {
      this.ui.updateVolumeUI();
    }

    if (this.options.debug) {
      this.debug.log(`Mute toggled to: ${this.audioElement.muted ? 'muted' : 'unmuted'}`);
      this.debug.updateDebugPanel();
    }
  }

  /**
   * Sprawdzenie czy odtwarzacz obsługuje strumieniowanie
   */
  supportsStreaming() {
    return this.hasMediaSourceSupport;
  }

  /**
   * Włączenie/wyłączenie zapamiętywania pozycji
   */
  enablePositionMemory(enable = true) {
    this.options.rememberPosition = enable;
    if (!enable && this.storage) {
      this.storage.clearPlaybackPosition();
    }

    if (this.options.debug) {
      this.debug.log(`Position memory ${enable ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Pobierz aktualny stan odtwarzacza
   */
  getPlayerState() {
    if (!this.audioElement) {
      if (this.options.debug) {
        this.debug.log('Cannot get player state - audioElement is null');
      }
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        muted: false,
        src: this.options.audioSrc || ''
      };
    }

    const state = {
      isPlaying: this.isPlaying,
      currentTime: this.audioElement.currentTime || 0,
      duration: this.audioElement.duration || 0,
      volume: this.audioElement.volume || 1,
      muted: this.audioElement.muted || false,
      src: this.options.audioSrc || this.audioElement.src || ''
    };

    if (this.options.debug) {
      this.debug.log('Retrieved player state', state);
    }

    return state;
  }

  /**
   * Włącz lub wyłącz tryb debugowania
   */
  setDebugMode(enable) {
    this.options.debug = enable;

    if (enable) {
      this.debug.enable();
      this.debug.log('Debug mode enabled');
      this.debug.createDebugPanel();
    } else {
      this.debug.log('Debug mode disabled');
      this.debug.disable();

      // Usuń panel debugowania, jeśli istnieje
      const panel = document.getElementById('audio-player-debug-panel');
      if (panel) {
        panel.remove();
      }
    }
  }

  /**
   * Generuje raport diagnostyczny
   */
  generateDiagnosticReport() {
    return this.debug.generateDiagnosticReport();
  }

  /**
   * Dodaje utwór lub utwory do playlisty
   * @param {String|Object|Array} tracks - URL lub obiekt utworu lub tablica utworów
   * @param {Boolean} autoplay - czy rozpocząć odtwarzanie automatycznie
   */
  addToPlaylist(tracks, autoplay = false) {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return false;
    }

    if (Array.isArray(tracks)) {
      // Jeśli to tablica utworów, przekazujemy ją do setPlaylist
      return this.playlist.setPlaylist(tracks, autoplay);
    } else {
      // Dodajemy pojedynczy utwór
      const index = this.playlist.addTrack(tracks);

      // Jeśli włączony autoplay i to pierwszy utwór, odtwórz go
      if (autoplay && this.playlist.tracks.length === 1) {
        this.playlist.playTrack(0);
      }

      return index >= 0;
    }
  }

  /**
   * Ustawia całą playlistę
   * @param {Array} tracks - tablica utworów
   * @param {Boolean} autoplay - czy rozpocząć odtwarzanie automatycznie
   */
  setPlaylist(tracks, autoplay = false) {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return false;
    }

    return this.playlist.setPlaylist(tracks, autoplay);
  }

  /**
   * Wczytuje zapisaną playlistę
   * @param {String} name - nazwa playlisty
   * @param {Boolean} autoplay - czy rozpocząć odtwarzanie automatycznie
   */
  loadPlaylist(name, autoplay = false) {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return false;
    }

    return this.playlist.loadPlaylist(name, autoplay);
  }

  /**
   * Zapisuje aktualną playlistę
   * @param {String} name - nazwa playlisty
   */
  savePlaylist(name) {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return false;
    }

    return this.playlist.savePlaylist(name);
  }

  /**
   * Odtwarza następny utwór z playlisty
   */
  playNext() {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return false;
    }

    return this.playlist.playNext();
  }

  /**
   * Odtwarza poprzedni utwór z playlisty
   */
  playPrevious() {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return false;
    }

    return this.playlist.playPrevious();
  }

  /**
   * Przełącza zapętlenie playlisty
   * @param {Boolean} enable - czy włączyć zapętlenie (opcjonalne)
   */
  toggleLoop(enable = null) {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return false;
    }

    return this.playlist.toggleLoop(enable);
  }

  /**
   * Przełącza tasowanie playlisty
   * @param {Boolean} enable - czy włączyć tasowanie (opcjonalne)
   */
  toggleShuffle(enable = null) {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return false;
    }

    return this.playlist.toggleShuffle(enable);
  }

  /**
   * Pobiera listę utworów z playlisty
   */
  getPlaylist() {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return [];
    }

    return this.playlist.getPlaylist();
  }

  /**
   * Pobiera aktualnie odtwarzany utwór
   */
  getCurrentTrack() {
    if (!this.playlist) {
      if (this.options.debug) {
        this.debug.log('Playlist manager not initialized');
      }
      return null;
    }

    return this.playlist.getCurrentTrack();
  }

  /**
   * Przełącza widoczność panelu playlisty
   */
  togglePlaylistPanel() {
    if (!this.playlistUI) {
      if (this.options.debug) {
        this.debug.log('Playlist UI manager not initialized');
      }
      return false;
    }

    this.playlistUI.togglePlaylistVisibility();
    return true;
  }

  /**
   * Zniszczenie odtwarzacza i wyczyszczenie zasobów
   */
  destroy() {
    if (this.options.debug) {
      this.debug.log('Destroying player');
    }

    // Zatrzymaj odtwarzanie
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.src = '';
        this.audioElement.load();
      } catch (e) {
        console.warn('Error while cleaning up audio element:', e);
        if (this.options.debug) {
          this.debug.log('Exception during cleanup', e);
        }
      }
    }

    // Zapisz aktualną pozycję jeśli opcja jest włączona
    if (this.options.rememberPosition && this.storage) {
      this.storage.savePlaybackPosition();
    }

    // Usuń nasłuchiwanie zdarzeń
    if (this.events) {
      this.events.removeEventListeners();
    }

    // Wyczyść playlist
    if (this.playlist) {
      this.playlist.clear();
    }

    // Usuń kontener
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Usuń panel debugowania, jeśli istnieje
    if (this.options.debug) {
      const panel = document.getElementById('audio-player-debug-panel');
      if (panel) {
        panel.remove();
      }
    }

    // Wyczyść referencje
    this.ui = null;
    this.storage = null;
    this.events = null;
    this.playlist = null;
    this.playlistUI = null;
    this.audioElement = null;

    if (this.options.debug) {
      this.debug.log('Player destroyed');
      this.debug = null;
    }
  }
}

// Eksport klasy AudioPlayer do użycia w innych skryptach
export default AudioPlayer;