/**
 * AudioPlayer.core.js - Główna klasa odtwarzacza audio
 */

import { StorageManager } from './AudioPlayer.storage.js';
import { UIManager } from './AudioPlayer.ui.js';
import { EventManager } from './AudioPlayer.events.js';
import { Utils } from './AudioPlayer.utils.js';

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

    // Inicjalizacja odtwarzacza
    this.initialize();
  }

  /**
   * Inicjalizacja odtwarzacza
   */
  initialize() {
    // Pobierz lub utwórz kontener
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = this.options.containerId;
      document.body.appendChild(this.container);
    }

    // Inicjalizacja menedżerów w odpowiedniej kolejności
    // 1. Najpierw UI - tworzy elementy HTML
    this.ui = new UIManager(this);
    this.ui.createPlayerElements();
    this.ui.applyStyles();

    // 2. Następnie storage - zarządza przechowywaniem danych
    this.storage = new StorageManager(this);

    // 3. Na końcu events - dodaje obsługę zdarzeń do już utworzonych elementów
    this.events = new EventManager(this);

    // Dodaj nasłuchiwanie zdarzeń po utworzeniu elementów
    setTimeout(() => {
      if (this.audioElement) {
        this.events.addEventListeners();
      } else {
        console.error('Audio element not initialized correctly');
      }

      // Przywróć zapisaną pozycję, jeśli opcja jest włączona
      if (this.options.rememberPosition && this.storage && this.audioElement) {
        this.storage.restorePlaybackPosition();
      }
    }, 100);
  }

  /**
   * Przełączanie odtwarzania/pauzy
   */
  togglePlay() {
    if (!this.audioElement) return;

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Rozpoczęcie odtwarzania
   */
  play() {
    if (!this.audioElement) return;

    // Ustaw źródło jeśli nie jest ustawione
    if (!this.audioElement.src && this.options.audioSrc) {
      this.audioElement.src = this.options.audioSrc;
      this.audioElement.load();
    }

    try {
      const playPromise = this.audioElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.ui.updatePlayPauseUI();
          })
          .catch(error => {
            console.error('Error playing audio:', error);

            // Handling autoplay policy
            if (error.name === 'NotAllowedError') {
              console.warn('Autoplay was prevented. User interaction required.');
            }
          });
      } else {
        this.isPlaying = true;
        this.ui.updatePlayPauseUI();
      }
    } catch (e) {
      console.error('Error while trying to play audio:', e);
    }
  }

  /**
   * Zatrzymanie odtwarzania
   */
  pause() {
    if (!this.audioElement) return;

    try {
      this.audioElement.pause();
      this.isPlaying = false;
      this.ui.updatePlayPauseUI();

      // Zapisz pozycję przy zatrzymaniu
      if (this.options.rememberPosition) {
        this.storage.savePlaybackPosition();
      }
    } catch (e) {
      console.error('Error while trying to pause audio:', e);
    }
  }

  /**
   * Załadowanie nowego pliku audio
   */
  load(audioSrc) {
    if (!audioSrc || !this.audioElement) return;

    // Aktualizuj ID audio dla nowego źródła
    this.audioId = Utils.generateAudioId(audioSrc);
    this.options.audioSrc = audioSrc;

    // Zatrzymaj odtwarzanie i wyczyść źródło
    this.pause();

    try {
      // Ustaw nowe źródło
      this.audioElement.src = audioSrc;
      this.audioElement.load();
    } catch (e) {
      console.error('Error loading audio source:', e);
    }
  }

  /**
   * Ustawienie informacji o utworze
   */
  setTrackInfo(title, artist) {
    this.ui.setTrackInfo(title, artist);
  }

  /**
   * Ustawienie głośności
   */
  setVolume(value) {
    if (!this.audioElement) return;

    const volume = Math.max(0, Math.min(1, value));
    this.audioElement.volume = volume;

    if (this.ui.volumeSliderFill) {
      this.ui.volumeSliderFill.style.width = `${volume * 100}%`;
    }

    if (volume === 0) {
      this.audioElement.muted = true;
    } else if (this.audioElement.muted) {
      this.audioElement.muted = false;
    }

    this.ui.updateVolumeUI();
  }

  /**
   * Przełączanie wyciszenia
   */
  toggleMute() {
    if (!this.audioElement) return;

    this.audioElement.muted = !this.audioElement.muted;
    this.ui.updateVolumeUI();
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
    if (!enable) {
      this.storage.clearPlaybackPosition();
    }
  }

  /**
   * Pobierz aktualny stan odtwarzacza
   */
  getPlayerState() {
    if (!this.audioElement) {
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        muted: false,
        src: this.options.audioSrc || ''
      };
    }

    return {
      isPlaying: this.isPlaying,
      currentTime: this.audioElement.currentTime || 0,
      duration: this.audioElement.duration || 0,
      volume: this.audioElement.volume || 1,
      muted: this.audioElement.muted || false,
      src: this.options.audioSrc || this.audioElement.src || ''
    };
  }

  /**
   * Zniszczenie odtwarzacza i wyczyszczenie zasobów
   */
  destroy() {
    // Zatrzymaj odtwarzanie
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.src = '';
        this.audioElement.load();
      } catch (e) {
        console.warn('Error while cleaning up audio element:', e);
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

    // Usuń kontener
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Wyczyść referencje
    this.ui = null;
    this.storage = null;
    this.events = null;
    this.audioElement = null;
  }
}

// Eksport klasy AudioPlayer do użycia w innych skryptach
export default AudioPlayer;