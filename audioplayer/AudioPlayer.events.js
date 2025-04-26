/**
 * AudioPlayer.events.js - Zarządzanie zdarzeniami odtwarzacza audio
 */

export class EventManager {
  constructor(player) {
    this.player = player;

    // Zapamiętanie funkcji obsługi zdarzeń dla łatwiejszego usuwania
    this._boundHandlers = {
      togglePlay: null,
      timeUpdate: null,
      metadataLoaded: null,
      progressBarClick: null,
      toggleMute: null,
      volumeChange: null,
      ended: null,
      bufferUpdate: null,
      error: null,
      beforeUnload: null
    };
  }

  /**
   * Dodanie wszystkich obsługiwanych zdarzeń
   */
  addEventListeners() {
    // Zabezpieczenie przed brakiem elementów
    if (!this.player.audioElement || !this.player.ui.playPauseBtn ||
        !this.player.ui.progressBar || !this.player.ui.volumeBtn ||
        !this.player.ui.volumeSlider) {
      console.warn('Audio player elements not initialized yet. Will try again later.');

      // Spróbuj ponownie za chwilę
      setTimeout(() => {
        if (this.player.audioElement && this.player.ui.playPauseBtn &&
            this.player.ui.progressBar && this.player.ui.volumeBtn &&
            this.player.ui.volumeSlider) {
          this.addEventListeners();
        } else {
          console.error('Audio player elements not found. Cannot add event listeners.');
        }
      }, 100);

      return;
    }

    // Play/Pause
    this._boundHandlers.togglePlay = () => this.player.togglePlay();
    this.player.ui.playPauseBtn.addEventListener('click', this._boundHandlers.togglePlay);

    // Aktualizacja postępu
    this._boundHandlers.timeUpdate = () => {
      this.player.ui.updateProgress();

      // Zapisz aktualną pozycję jeśli opcja jest włączona
      if (this.player.options.rememberPosition && !this.player.audioElement.paused) {
        this.player.storage.savePlaybackPosition();
      }
    };
    this.player.audioElement.addEventListener('timeupdate', this._boundHandlers.timeUpdate);

    // Ustaw czas trwania po załadowaniu metadanych
    this._boundHandlers.metadataLoaded = () => {
      if (this.player.ui.durationDisplay) {
        this.player.ui.durationDisplay.textContent = this._formatTime(this.player.audioElement.duration);
      }
    };
    this.player.audioElement.addEventListener('loadedmetadata', this._boundHandlers.metadataLoaded);

    // Kliknięcie na pasku postępu
    this._boundHandlers.progressBarClick = (e) => {
      const rect = this.player.ui.progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (this.player.audioElement.duration) {
        this.player.audioElement.currentTime = pos * this.player.audioElement.duration;
      }
    };
    this.player.ui.progressBar.addEventListener('click', this._boundHandlers.progressBarClick);

    // Kontrola głośności
    this._boundHandlers.toggleMute = () => this.player.toggleMute();
    this.player.ui.volumeBtn.addEventListener('click', this._boundHandlers.toggleMute);

    this._boundHandlers.volumeChange = (e) => {
      const rect = this.player.ui.volumeSlider.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.player.setVolume(pos);
    };
    this.player.ui.volumeSlider.addEventListener('click', this._boundHandlers.volumeChange);

    // Koniec utworu
    this._boundHandlers.ended = () => {
      this.player.isPlaying = false;
      this.player.ui.updatePlayPauseUI();

      // Wyczyść zapisaną pozycję po zakończeniu odtwarzania
      if (this.player.options.rememberPosition) {
        this.player.storage.clearPlaybackPosition();
      }
    };
    this.player.audioElement.addEventListener('ended', this._boundHandlers.ended);

    // Aktualizacja buforowania
    this._boundHandlers.bufferUpdate = () => {
      this.player.ui.updateBufferProgress();
    };
    this.player.audioElement.addEventListener('progress', this._boundHandlers.bufferUpdate);

    // Obsługa błędów
    this._boundHandlers.error = (e) => {
      console.error('Audio player error:', e);
      const errorCode = this.player.audioElement.error ? this.player.audioElement.error.code : 'unknown';
      console.error('Error code:', errorCode);

      // Spróbuj ponownie załadować plik, jeśli wystąpił błąd sieci lub dekodowania
      if (errorCode === 2 || errorCode === 3) {
        console.log('Trying to reload audio...');
        if (this.player.options.audioSrc) {
          this.player.load(this.player.options.audioSrc);
        }
      }
    };
    this.player.audioElement.addEventListener('error', this._boundHandlers.error);

    // Zapisz pozycję przed zamknięciem strony
    this._boundHandlers.beforeUnload = () => {
      if (this.player.options.rememberPosition &&
          this.player.audioElement &&
          !this.player.audioElement.paused) {
        this.player.storage.savePlaybackPosition();
      }
    };
    window.addEventListener('beforeunload', this._boundHandlers.beforeUnload);
  }

  /**
   * Usunięcie wszystkich obsługiwanych zdarzeń
   */
  removeEventListeners() {
    if (this.player.ui.playPauseBtn && this._boundHandlers.togglePlay) {
      this.player.ui.playPauseBtn.removeEventListener('click', this._boundHandlers.togglePlay);
    }

    if (this.player.audioElement) {
      if (this._boundHandlers.timeUpdate) {
        this.player.audioElement.removeEventListener('timeupdate', this._boundHandlers.timeUpdate);
      }
      if (this._boundHandlers.metadataLoaded) {
        this.player.audioElement.removeEventListener('loadedmetadata', this._boundHandlers.metadataLoaded);
      }
      if (this._boundHandlers.ended) {
        this.player.audioElement.removeEventListener('ended', this._boundHandlers.ended);
      }
      if (this._boundHandlers.bufferUpdate) {
        this.player.audioElement.removeEventListener('progress', this._boundHandlers.bufferUpdate);
      }
      if (this._boundHandlers.error) {
        this.player.audioElement.removeEventListener('error', this._boundHandlers.error);
      }
    }

    if (this.player.ui.progressBar && this._boundHandlers.progressBarClick) {
      this.player.ui.progressBar.removeEventListener('click', this._boundHandlers.progressBarClick);
    }

    if (this.player.ui.volumeBtn && this._boundHandlers.toggleMute) {
      this.player.ui.volumeBtn.removeEventListener('click', this._boundHandlers.toggleMute);
    }

    if (this.player.ui.volumeSlider && this._boundHandlers.volumeChange) {
      this.player.ui.volumeSlider.removeEventListener('click', this._boundHandlers.volumeChange);
    }

    if (this._boundHandlers.beforeUnload) {
      window.removeEventListener('beforeunload', this._boundHandlers.beforeUnload);
    }

    // Zerowanie funkcji obsługi zdarzeń
    for (const key in this._boundHandlers) {
      this._boundHandlers[key] = null;
    }
  }

  /**
   * Formatowanie czasu pomocnicza metoda
   */
  _formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}