/**
 * AudioPlayer.ui.js - Zarządzanie interfejsem użytkownika odtwarzacza audio
 */

import {Utils} from './AudioPlayer.utils.js';

export class UIManager {
    constructor(player) {
        this.player = player;
        this.playPauseBtn = null;
        this.progressBar = null;
        this.progressFill = null;
        this.bufferProgress = null;
        this.currentTimeDisplay = null;
        this.durationDisplay = null;
        this.volumeBtn = null;
        this.volumeSlider = null;
        this.volumeSliderFill = null;
        this.waveformElement = null;
    }

    /**
     * Tworzenie elementów HTML odtwarzacza
     */
    createPlayerElements() {
        try {
            const streamingEnabled = this.player.options.streaming && this.player.hasMediaSourceSupport;

            // Generujemy unikalny identyfikator dla elementu audio, używając timestamp
            const audioElementId = `audio-element-${this.player.audioId}-${Date.now()}`;

            const playerHTML = `
        <div class="audio-player ${this.player.options.theme}">
          <div class="player-header">
            <div class="track-info">
              <span class="track-title">${this.player.options.title || 'Audio Track'}</span>
              <span class="track-artist">${this.player.options.artist || ''}</span>
            </div>
            <div class="streaming-indicator">
              ${streamingEnabled ? '<span class="streaming-badge">STREAMING</span>' : ''}
            </div>
          </div>
          <div class="player-controls">
            <button class="play-pause-btn">
              <svg class="play-icon" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg class="pause-icon" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            <div class="time-info">
              <span class="current-time">0:00</span>
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                  <div class="buffer-progress"></div>
                </div>
                ${this.player.options.showWaveform ? '<div class="waveform"></div>' : ''}
              </div>
              <span class="duration">0:00</span>
            </div>
            <div class="volume-control">
              <button class="volume-btn">
                <svg class="volume-icon" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                <svg class="mute-icon" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              </button>
              <div class="volume-slider">
                <div class="volume-slider-fill"></div>
              </div>
            </div>
          </div>
          <audio id="${audioElementId}" preload="auto" class="audio-element"></audio>
        </div>
      `;

            // Ustawiamy HTML kontenera
            this.player.container.innerHTML = playerHTML;

            // Zapisujemy ID elementu audio, aby później móc go łatwo zlokalizować
            this.player._audioElementId = audioElementId;

            // Pobieramy referencje do elementów DOM
            this._findAndAssignElements();

            // Sprawdzamy poprawność inicjalizacji
            if (!this._validateElements()) {
                return false;
            }

            // Ustaw źródło audio jeśli zostało podane
            if (this.player.audioElement && this.player.options.audioSrc) {
                this.player.audioElement.src = this.player.options.audioSrc;
            }

            return true;
        } catch (error) {
            console.error('Error creating player elements:', error);
            if (this.player.options.debug) {
                this.player.debug.log('Error creating player elements', error);
            }
            return false;
        }
    }

    /**
     * Pobiera i przypisuje referencje do elementów DOM
     */
    _findAndAssignElements() {
        try {
            // Najpierw próbujemy znaleźć element audio po ID
            this.player.audioElement = document.getElementById(this.player._audioElementId);

            // Jeśli nie udało się znaleźć po ID, szukamy po klasie
            if (!this.player.audioElement) {
                this.player.audioElement = this.player.container.querySelector('.audio-element');
            }

            // Przypisujemy pozostałe elementy DOM
            this.playPauseBtn = this.player.container.querySelector('.play-pause-btn');
            this.progressBar = this.player.container.querySelector('.progress-bar');
            this.progressFill = this.player.container.querySelector('.progress-fill');
            this.bufferProgress = this.player.container.querySelector('.buffer-progress');
            this.currentTimeDisplay = this.player.container.querySelector('.current-time');
            this.durationDisplay = this.player.container.querySelector('.duration');
            this.volumeBtn = this.player.container.querySelector('.volume-btn');
            this.volumeSlider = this.player.container.querySelector('.volume-slider');
            this.volumeSliderFill = this.player.container.querySelector('.volume-slider-fill');

            if (this.player.options.showWaveform) {
                this.waveformElement = this.player.container.querySelector('.waveform');
            }
        } catch (error) {
            console.error('Error finding and assigning elements:', error);
            if (this.player.options.debug) {
                this.player.debug.log('Error finding and assigning elements', error);
            }
        }
    }

    /**
     * Sprawdza, czy wszystkie wymagane elementy zostały znalezione
     */
    _validateElements() {
        const requiredElements = [
            {name: 'audioElement', ref: this.player.audioElement},
            {name: 'playPauseBtn', ref: this.playPauseBtn},
            {name: 'progressBar', ref: this.progressBar},
            {name: 'progressFill', ref: this.progressFill},
            {name: 'currentTimeDisplay', ref: this.currentTimeDisplay},
            {name: 'durationDisplay', ref: this.durationDisplay}
        ];

        const missingElements = requiredElements.filter(element => !element.ref);

        if (missingElements.length > 0) {
            const missingNames = missingElements.map(element => element.name).join(', ');
            console.error(`Missing required elements: ${missingNames}`);

            if (this.player.options.debug) {
                this.player.debug.log(`Missing required elements: ${missingNames}`);
            }

            return false;
        }

        // Dodatkowe sprawdzenie elementu audio
        if (this.player.audioElement) {
            if (typeof this.player.audioElement.play !== 'function') {
                console.error('Audio element does not have play method');

                if (this.player.options.debug) {
                    this.player.debug.log('Audio element does not have play method');
                }

                return false;
            }
        }

        return true;
    }

    /**
     * Zastosowanie stylów CSS
     */
    applyStyles() {
        const styleId = 'audio-player-styles';

        // Sprawdź, czy style zostały już dodane
        if (!document.getElementById(styleId)) {
            const styleElement = document.createElement('style');
            styleElement.id = styleId;

            styleElement.textContent = `
        .audio-player {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }
        
        .audio-player.dark {
          background-color: #222;
          color: #fff;
        }
        
        .audio-player.light {
          background-color: #f7f7f7;
          color: #333;
        }
        
        .player-header {
          padding: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .track-info {
          display: flex;
          flex-direction: column;
        }
        
        .track-title {
          font-weight: bold;
          font-size: 16px;
        }
        
        .track-artist {
          font-size: 13px;
          opacity: 0.8;
          margin-top: 4px;
        }
        
        .streaming-indicator {
          display: flex;
          align-items: center;
        }
        
        .streaming-badge {
          background-color: #1DB954;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 3px 6px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .player-controls {
          padding: 0 15px 15px;
        }
        
        .play-pause-btn {
          background: none;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 10px;
        }
        
        .dark .play-pause-btn {
          background-color: #444;
        }
        
        .light .play-pause-btn {
          background-color: #e0e0e0;
        }
        
        .dark .play-pause-btn:hover {
          background-color: #555;
        }
        
        .light .play-pause-btn:hover {
          background-color: #d0d0d0;
        }
        
        .play-pause-btn svg {
          width: 24px;
          height: 24px;
          fill: currentColor;
        }
        
        .dark .play-pause-btn svg {
          fill: #fff;
        }
        
        .light .play-pause-btn svg {
          fill: #333;
        }
        
        .pause-icon {
          display: none;
        }
        
        .time-info {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .current-time, .duration {
          font-size: 12px;
          min-width: 40px;
        }
        
        .progress-container {
          flex-grow: 1;
          margin: 0 10px;
          position: relative;
        }
        
        .progress-bar {
          background-color: rgba(255, 255, 255, 0.1);
          height: 6px;
          border-radius: 3px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .light .progress-bar {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .progress-fill {
          background-color: #1DB954;
          height: 100%;
          border-radius: 3px;
          width: 0;
          position: relative;
          z-index: 2;
        }
        
        .buffer-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          width: 0;
          z-index: 1;
        }
        
        .light .buffer-progress {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .progress-fill::after {
          content: '';
          position: absolute;
          right: -4px;
          top: -3px;
          width: 12px;
          height: 12px;
          background-color: #1DB954;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .progress-bar:hover .progress-fill::after {
          opacity: 1;
        }
        
        .waveform {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 30px;
          margin-top: 10px;
        }
        
        .volume-control {
          display: flex;
          align-items: center;
        }
        
        .volume-btn {
          background: none;
          border: none;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        .volume-btn svg {
          width: 20px;
          height: 20px;
          fill: currentColor;
        }
        
        .dark .volume-btn svg {
          fill: #fff;
        }
        
        .light .volume-btn svg {
          fill: #333;
        }
        
        .mute-icon {
          display: none;
        }
        
        .volume-slider {
          width: 60px;
          height: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          position: relative;
          cursor: pointer;
        }
        
        .light .volume-slider {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .volume-slider-fill {
          background-color: #1DB954;
          height: 100%;
          border-radius: 2px;
          width: 100%;
        }
      `;

            document.head.appendChild(styleElement);
        }
    }

    /**
     * Aktualizacja paska postępu
     */
    updateProgress() {
        try {
            if (!this.player.audioElement || !this.player.audioElement.duration || !this.progressFill || !this.currentTimeDisplay) {
                return;
            }

            const currentTime = this.player.audioElement.currentTime;
            const duration = this.player.audioElement.duration;
            const progressPercent = (currentTime / duration) * 100;

            this.progressFill.style.width = `${progressPercent}%`;
            this.currentTimeDisplay.textContent = Utils.formatTime(currentTime);

            if (this.player.options.showWaveform && this.waveformElement) {
                // Wizualizacja formy fali mogłaby być tutaj zaimplementowana
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            if (this.player.options.debug) {
                this.player.debug.log('Error updating progress', error);
            }
        }
    }

    /**
     * Aktualizacja paska buforowania
     */
    updateBufferProgress() {
        try {
            if (!this.player.audioElement || !this.bufferProgress ||
                !this.player.audioElement.buffered || this.player.audioElement.buffered.length === 0) {
                return;
            }

            const duration = this.player.audioElement.duration;
            if (!duration) return;

            // Pobierz czas końcowy ostatniego buforowanego zakresu
            const bufferedEnd = this.player.audioElement.buffered.end(this.player.audioElement.buffered.length - 1);
            const bufferPercent = (bufferedEnd / duration) * 100;

            this.bufferProgress.style.width = `${bufferPercent}%`;
        } catch (error) {
            // Ignorujemy błędy bufora, ponieważ są one niekrytyczne
            if (this.player.options.debug) {
                this.player.debug.log('Error updating buffer progress', error);
            }
        }
    }

    /**
     * Aktualizacja interfejsu przycisku odtwarzania/pauzy
     */
    updatePlayPauseUI() {
        try {
            const playIcon = this.player.container?.querySelector('.play-icon');
            const pauseIcon = this.player.container?.querySelector('.pause-icon');

            if (!playIcon || !pauseIcon) return;

            if (this.player.isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating play/pause UI:', error);
            if (this.player.options.debug) {
                this.player.debug.log('Error updating play/pause UI', error);
            }
        }
    }

    /**
     * Aktualizacja interfejsu głośności
     */
    updateVolumeUI() {
        try {
            const volumeIcon = this.player.container?.querySelector('.volume-icon');
            const muteIcon = this.player.container?.querySelector('.mute-icon');

            if (!volumeIcon || !muteIcon || !this.player.audioElement) return;

            if (this.player.audioElement.muted || this.player.audioElement.volume === 0) {
                volumeIcon.style.display = 'none';
                muteIcon.style.display = 'block';
            } else {
                volumeIcon.style.display = 'block';
                muteIcon.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating volume UI:', error);
            if (this.player.options.debug) {
                this.player.debug.log('Error updating volume UI', error);
            }
        }
    }

    /**
     * Ustawienie informacji o utworze
     */
    setTrackInfo(title, artist) {
        try {
            const titleElement = this.player.container?.querySelector('.track-title');
            const artistElement = this.player.container?.querySelector('.track-artist');

            if (titleElement) titleElement.textContent = title || 'Audio Track';
            if (artistElement) artistElement.textContent = artist || '';
        } catch (error) {
            console.error('Error setting track info:', error);
            if (this.player.options.debug) {
                this.player.debug.log('Error setting track info', error);
            }
        }
    }
}