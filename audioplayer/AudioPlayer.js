/**
 * AudioPlayer.js - Simple audio player library
 * Creates a customizable audio player for MP3/WAV files
 */
class AudioPlayer {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'audio-player-container',
      audioSrc: options.audioSrc || '',
      autoplay: options.autoplay || false,
      showWaveform: options.showWaveform || false,
      theme: options.theme || 'dark', // 'dark' or 'light'
      ...options
    };

    this.isPlaying = false;
    this.audioElement = null;
    this.progressInterval = null;

    this.initialize();
  }

  initialize() {
    // Get or create container
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = this.options.containerId;
      document.body.appendChild(this.container);
    }

    // Create HTML structure
    this.createPlayerElements();

    // Apply CSS
    this.applyStyles();

    // Add event listeners
    this.addEventListeners();
  }

  createPlayerElements() {
    const playerHTML = `
      <div class="audio-player ${this.options.theme}">
        <div class="player-header">
          <div class="track-info">
            <span class="track-title">${this.options.title || 'Audio Track'}</span>
            <span class="track-artist">${this.options.artist || ''}</span>
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
              </div>
              ${this.options.showWaveform ? '<div class="waveform"></div>' : ''}
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
        <audio id="audio-element" src="${this.options.audioSrc}" ${this.options.autoplay ? 'autoplay' : ''}></audio>
      </div>
    `;

    this.container.innerHTML = playerHTML;
    this.audioElement = this.container.querySelector('#audio-element');
    this.playPauseBtn = this.container.querySelector('.play-pause-btn');
    this.progressBar = this.container.querySelector('.progress-bar');
    this.progressFill = this.container.querySelector('.progress-fill');
    this.currentTimeDisplay = this.container.querySelector('.current-time');
    this.durationDisplay = this.container.querySelector('.duration');
    this.volumeBtn = this.container.querySelector('.volume-btn');
    this.volumeSlider = this.container.querySelector('.volume-slider');
    this.volumeSliderFill = this.container.querySelector('.volume-slider-fill');

    if (this.options.showWaveform) {
      this.waveformElement = this.container.querySelector('.waveform');
    }
  }

  applyStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      #${this.options.containerId} {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
      }
      
      .audio-player {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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

  addEventListeners() {
    // Play/Pause
    this.playPauseBtn.addEventListener('click', () => {
      this.togglePlay();
    });

    // Update progress
    this.audioElement.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    // Set duration
    this.audioElement.addEventListener('loadedmetadata', () => {
      this.durationDisplay.textContent = this.formatTime(this.audioElement.duration);
    });

    // Click on progress bar
    this.progressBar.addEventListener('click', (e) => {
      const rect = this.progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.audioElement.currentTime = pos * this.audioElement.duration;
    });

    // Volume control
    this.volumeBtn.addEventListener('click', () => {
      this.toggleMute();
    });

    this.volumeSlider.addEventListener('click', (e) => {
      const rect = this.volumeSlider.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.setVolume(pos);
    });

    // Track ended
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayPauseUI();
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.audioElement.pause();
    } else {
      this.audioElement.play();
    }
    this.isPlaying = !this.isPlaying;
    this.updatePlayPauseUI();
  }

  updatePlayPauseUI() {
    const playIcon = this.container.querySelector('.play-icon');
    const pauseIcon = this.container.querySelector('.pause-icon');

    if (this.isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  }

  updateProgress() {
    if (!this.audioElement.duration) return;

    const currentTime = this.audioElement.currentTime;
    const duration = this.audioElement.duration;
    const progressPercent = (currentTime / duration) * 100;

    this.progressFill.style.width = `${progressPercent}%`;
    this.currentTimeDisplay.textContent = this.formatTime(currentTime);

    if (this.options.showWaveform && this.waveformElement) {
      // Simple waveform visualization could be added here
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  toggleMute() {
    this.audioElement.muted = !this.audioElement.muted;
    this.updateVolumeUI();
  }

  setVolume(value) {
    const volume = Math.max(0, Math.min(1, value));
    this.audioElement.volume = volume;
    this.volumeSliderFill.style.width = `${volume * 100}%`;

    if (volume === 0) {
      this.audioElement.muted = true;
    } else {
      this.audioElement.muted = false;
    }

    this.updateVolumeUI();
  }

  updateVolumeUI() {
    const volumeIcon = this.container.querySelector('.volume-icon');
    const muteIcon = this.container.querySelector('.mute-icon');

    if (this.audioElement.muted || this.audioElement.volume === 0) {
      volumeIcon.style.display = 'none';
      muteIcon.style.display = 'block';
    } else {
      volumeIcon.style.display = 'block';
      muteIcon.style.display = 'none';
    }
  }

  // Public methods
  load(audioSrc) {
    this.audioElement.src = audioSrc;
    this.audioElement.load();
  }

  play() {
    this.audioElement.play();
    this.isPlaying = true;
    this.updatePlayPauseUI();
  }

  pause() {
    this.audioElement.pause();
    this.isPlaying = false;
    this.updatePlayPauseUI();
  }

  setTrackInfo(title, artist) {
    const titleElement = this.container.querySelector('.track-title');
    const artistElement = this.container.querySelector('.track-artist');

    if (titleElement) titleElement.textContent = title || 'Audio Track';
    if (artistElement) artistElement.textContent = artist || '';
  }
}

// Export the AudioPlayer class for use in other scripts
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = AudioPlayer;
} else {
  window.AudioPlayer = AudioPlayer;
}