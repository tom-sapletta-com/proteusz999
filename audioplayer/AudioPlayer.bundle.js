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
      }

      // Inicjalizacja menedżerów w odpowiedniej kolejności
      // 1. Najpierw UI - tworzy elementy HTML
      this.ui = new UIManager(this);
      const uiInitialized = this.ui.createPlayerElements();

      if (!uiInitialized) {
        console.error('UI initialization failed. Cannot create audio element.');
        return;
      }

      this.ui.applyStyles();

      // Dodatkowe sprawdzenie czy element audio został poprawnie utworzony
      if (!this.audioElement) {
        console.error('Audio element not initialized correctly');
        return;
      }

      // 2. Następnie storage - zarządza przechowywaniem danych
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
        return;
      }

      // Dodaj nasłuchiwanie zdarzeń
      this.events.addEventListeners();

      // Jeśli jest przekazany audioSrc, dodajmy go jako pierwszy utwór do playlisty
      if (this.options.audioSrc && this.playlist) {
        this.playlist.addTrack(this.options.audioSrc);
      }

      // Podłącz obsługę zakończenia utworu
      this.audioElement.addEventListener('ended', () => {
        if (this.playlist) {
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
            });
          }
        } catch (e) {
          console.warn('Error during autoplay:', e);
        }
      }
    } catch (error) {
      console.error('Error initializing player functions:', error);
    }
  }

  /**
   * Przełączanie odtwarzania/pauzy
   */
  togglePlay() {
    if (!this.audioElement) {
      return;
    }

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
    if (!this.audioElement) {
      return;
    }

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
            if (this.ui) {
              this.ui.updatePlayPauseUI();
            }
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
        if (this.ui) {
          this.ui.updatePlayPauseUI();
        }
      }
    } catch (e) {
      console.error('Error while trying to play audio:', e);
    }
  }

  /**
   * Zatrzymanie odtwarzania
   */
  pause() {
    if (!this.audioElement) {
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
    } catch (e) {
      console.error('Error while trying to pause audio:', e);
    }
  }

  /**
   * Załadowanie nowego pliku audio
   */
  load(audioSrc) {
    if (!audioSrc || !this.audioElement) {
      return;
    }

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
    if (this.ui) {
      this.ui.setTrackInfo(title, artist);
    }
  }

  /**
   * Ustawienie głośności
   */
  setVolume(value) {
    if (!this.audioElement) {
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
  }

  /**
   * Przełączanie wyciszenia
   */
  toggleMute() {
    if (!this.audioElement) {
      return;
    }

    this.audioElement.muted = !this.audioElement.muted;

    if (this.ui) {
      this.ui.updateVolumeUI();
    }
  }

  /**
   * Włączenie/wyłączenie zapamiętywania pozycji
   */
  enablePositionMemory(enable = true) {
    this.options.rememberPosition = enable;
    if (!enable && this.storage) {
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
   * Dodaje utwór lub utwory do playlisty
   * @param {String|Object|Array} tracks - URL lub obiekt utworu lub tablica utworów
   * @param {Boolean} autoplay - czy rozpocząć odtwarzanie automatycznie
   */
  addToPlaylist(tracks, autoplay = false) {
    if (!this.playlist) {
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
      return false;
    }

    return this.playlist.savePlaylist(name);
  }

  /**
   * Odtwarza następny utwór z playlisty
   */
  playNext() {
    if (!this.playlist) {
      return false;
    }

    return this.playlist.playNext();
  }

  /**
   * Odtwarza poprzedni utwór z playlisty
   */
  playPrevious() {
    if (!this.playlist) {
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
      return false;
    }

    return this.playlist.toggleShuffle(enable);
  }

  /**
   * Pobiera listę utworów z playlisty
   */
  getPlaylist() {
    if (!this.playlist) {
      return [];
    }

    return this.playlist.getPlaylist();
  }

  /**
   * Pobiera aktualnie odtwarzany utwór
   */
  getCurrentTrack() {
    if (!this.playlist) {
      return null;
    }

    return this.playlist.getCurrentTrack();
  }

  /**
   * Przełącza widoczność panelu playlisty
   */
  togglePlaylistPanel() {
    if (!this.playlistUI) {
      return false;
    }

    this.playlistUI.togglePlaylistVisibility();
    return true;
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

    // Wyczyść playlist
    if (this.playlist) {
      this.playlist.clear();
    }

    // Usuń kontener
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Wyczyść referencje
    this.ui = null;
    this.storage = null;
    this.events = null;
    this.playlist = null;
    this.playlistUI = null;
    this.audioElement = null;
  }
}

// Eksport jako obiekt globalny
if (typeof window !== 'undefined') {
  window.AudioPlayer = AudioPlayer;
}// Klasa interfejsu playlisty
class PlaylistUIManager {
  constructor(player) {
    this.player = player;
    this.playlistContainer = null;
    this.playlistVisible = false;
    this.draggedItem = null;
    this.draggedOverItem = null;
  }

  /**
   * Inicjalizuje interfejs playlisty
   */
  initialize() {
    // Utwórz i dodaj przycisk przełączania playlisty do kontrolek odtwarzacza
    this._createPlaylistToggleButton();

    // Utwórz kontener playlisty (domyślnie ukryty)
    this._createPlaylistContainer();

    // Nasłuchuj zdarzeń aktualizacji playlisty
    this._listenForPlaylistEvents();

    // Dodaj przyciski sterujące playlistą
    this._createPlaylistControls();
  }

  /**
   * Tworzy przycisk przełączania widoczności playlisty
   * @private
   */
  _createPlaylistToggleButton() {
    const controlsContainer = this.player.container.querySelector('.player-controls');

    if (!controlsContainer) {
      return;
    }

    // Utwórz dodatkowy div dla przycisków transportu (prev, next)
    const transportControls = document.createElement('div');
    transportControls.className = 'transport-controls';
    transportControls.innerHTML = `
      <button class="prev-btn" title="Previous track">
        <svg viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
        </svg>
      </button>
      <button class="next-btn" title="Next track">
        <svg viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>
      <button class="playlist-toggle-btn" title="Show/hide playlist">
        <svg viewBox="0 0 24 24">
          <path d="M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3z"/>
        </svg>
      </button>
    `;

    // Wstaw przed przyciskiem play/pause
    const playPauseBtn = controlsContainer.querySelector('.play-pause-btn');
    if (playPauseBtn && playPauseBtn.parentNode) {
      playPauseBtn.parentNode.insertBefore(transportControls, playPauseBtn);
    } else {
      controlsContainer.appendChild(transportControls);
    }

    // Dodaj nasłuchiwanie zdarzeń
    const prevBtn = transportControls.querySelector('.prev-btn');
    const nextBtn = transportControls.querySelector('.next-btn');
    const playlistToggleBtn = transportControls.querySelector('.playlist-toggle-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.player.playlist) {
          this.player.playlist.playPrevious();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.player.playlist) {
          this.player.playlist.playNext();
        }
      });
    }

    if (playlistToggleBtn) {
      playlistToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePlaylistVisibility();
      });
    }
  }

  /**
   * Tworzy kontener playlisty
   * @private
   */
  _createPlaylistContainer() {
    // Sprawdź, czy kontener już istnieje
    let playlistContainer = this.player.container.querySelector('.playlist-container');

    if (!playlistContainer) {
      playlistContainer = document.createElement('div');
      playlistContainer.className = 'playlist-container';
      playlistContainer.innerHTML = `
        <div class="playlist-header">
          <div class="playlist-title">Playlist</div>
          <div class="playlist-controls"></div>
        </div>
        <div class="playlist-tracks">
          <ul class="track-list"></ul>
        </div>
        <div class="playlist-footer">
          <div class="playlist-actions">
            <button class="add-track-btn">Add Track</button>
            <button class="save-playlist-btn">Save Playlist</button>
            <button class="load-playlist-btn">Load Playlist</button>
          </div>
        </div>
      `;

      // Domyślnie ukryty
      playlistContainer.style.display = 'none';

      // Dodaj po kontrolkach odtwarzacza
      const audioPlayer = this.player.container.querySelector('.audio-player');
      if (audioPlayer) {
        audioPlayer.appendChild(playlistContainer);
      } else {
        this.player.container.appendChild(playlistContainer);
      }
    }

    this.playlistContainer = playlistContainer;
    this._setupPlaylistActions();
  }

  /**
   * Konfiguruje przyciski akcji playlisty
   * @private
   */
  _setupPlaylistActions() {
    if (!this.playlistContainer) return;

    const addTrackBtn = this.playlistContainer.querySelector('.add-track-btn');
    const savePlaylistBtn = this.playlistContainer.querySelector('.save-playlist-btn');
    const loadPlaylistBtn = this.playlistContainer.querySelector('.load-playlist-btn');

    if (addTrackBtn) {
      addTrackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this._showAddTrackDialog();
      });
    }

    if (savePlaylistBtn) {
      savePlaylistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this._showSavePlaylistDialog();
      });
    }

    if (loadPlaylistBtn) {
      loadPlaylistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this._showLoadPlaylistDialog();
      });
    }
  }

  /**
   * Nasłuchuje zdarzeń aktualizacji playlisty
   * @private
   */
  _listenForPlaylistEvents() {
    this.player.container.addEventListener('playlistUpdated', (event) => {
      this._renderPlaylist(event.detail);
    });
  }

  /**
   * Renderuje listę utworów w playliście
   * @param {Object} playlistData - dane playlisty
   * @private
   */
  _renderPlaylist(playlistData) {
    if (!this.playlistContainer) return;

    const trackList = this.playlistContainer.querySelector('.track-list');
    if (!trackList) return;

    // Pobierz dane
    const { tracks, currentTrack, loop, shuffle } = playlistData;
    const currentTrackIndex = currentTrack ? currentTrack.index : -1;

    // Wyczyść listę
    trackList.innerHTML = '';

    // Aktualizuj przyciski kontrolne (loop, shuffle)
    this._updateControlButtons(loop, shuffle);

    // Jeśli nie ma utworów, wyświetl komunikat
    if (!tracks || tracks.length === 0) {
      trackList.innerHTML = '<li class="empty-playlist">No tracks in playlist</li>';
      return;
    }

    // Renderuj każdy utwór
    tracks.forEach((track, index) => {
      const trackItem = document.createElement('li');
      trackItem.className = 'track-item';
      trackItem.dataset.index = index;

      if (index === currentTrackIndex) {
        trackItem.classList.add('active');
      }

      // Format czasu trwania
      const duration = track.duration ? Utils.formatTime(track.duration) : '--:--';

      trackItem.innerHTML = `
        <div class="track-index">${index + 1}</div>
        <div class="track-info-container">
          <div class="track-title-text">${track.title}</div>
          <div class="track-artist-text">${track.artist || ''}</div>
        </div>
        <div class="track-duration">${duration}</div>
        <div class="track-actions">
          <button class="track-action-btn remove-track" title="Remove track">
            <svg viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      `;

      // Dodaj obsługę zdarzenia kliknięcia
      trackItem.addEventListener('click', (e) => {
        // Ignoruj kliknięcia na przyciskach akcji
        if (e.target.closest('.track-actions')) return;

        if (this.player.playlist) {
          this.player.playlist.playTrack(index);
        }
      });

      // Dodaj obsługę usuwania utworu
      const removeBtn = trackItem.querySelector('.remove-track');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (this.player.playlist) {
            this.player.playlist.removeTrack(index);
          }
        });
      }

      // Dodaj obsługę przeciągania dla zmiany kolejności
      this._setupDragAndDrop(trackItem);

      trackList.appendChild(trackItem);
    });
  }

  /**
   * Aktualizuje przyciski kontrolne playlisty
   * @param {Boolean} loop - stan pętli
   * @param {Boolean} shuffle - stan tasowania
   * @private
   */// Klasa zarządzająca zdarzeniami
class EventManager {
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
        this.player.ui.durationDisplay.textContent = Utils.formatTime(this.player.audioElement.duration);
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

      // Odtwórz następny utwór, jeśli playlista jest dostępna
      if (this.player.playlist) {
        this.player.playlist.playNext();
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

    ///**
 * AudioPlayer.bundle.js - Wersja niemoduława (wszystko w jednym pliku)
 * Używaj tej wersji, jeśli masz problemy z modułami ES6
 */

// Funkcje pomocnicze
const Utils = {
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
        console.log('Error creating player elements', error);
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
    }
  }

  /**
   * Sprawdza, czy wszystkie wymagane elementy zostały znalezione
   */
  _validateElements() {
    const requiredElements = [
      { name: 'audioElement', ref: this.player.audioElement },
      { name: 'playPauseBtn', ref: this.playPauseBtn },
      { name: 'progressBar', ref: this.progressBar },
      { name: 'progressFill', ref: this.progressFill },
      { name: 'currentTimeDisplay', ref: this.currentTimeDisplay },
      { name: 'durationDisplay', ref: this.durationDisplay }
    ];

    const missingElements = requiredElements.filter(element => !element.ref);

    if (missingElements.length > 0) {
      const missingNames = missingElements.map(element => element.name).join(', ');
      console.error(`Missing required elements: ${missingNames}`);
      return false;
    }

    // Dodatkowe sprawdzenie elementu audio
    if (this.player.audioElement) {
      if (typeof this.player.audioElement.play !== 'function') {
        console.error('Audio element does not have play method');
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
        
        /* Playlist styles */
        .transport-controls {
          display: flex;
          align-items: center;
          margin-right: 10px;
        }
        
        .prev-btn, .next-btn, .playlist-toggle-btn {
          background: none;
          border: none;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.2s;
          margin: 0 2px;
        }
        
        .prev-btn svg, .next-btn svg, .playlist-toggle-btn svg {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }
        
        .dark .prev-btn svg, .dark .next-btn svg, .dark .playlist-toggle-btn svg {
          fill: #fff;
        }
        
        .light .prev-btn svg, .light .next-btn svg, .light .playlist-toggle-btn svg {
          fill: #333;
        }
        
        .prev-btn:hover, .next-btn:hover, .playlist-toggle-btn:hover {
          color: #1DB954;
        }
        
        .playlist-container {
          background: inherit;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          max-height: 300px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .light .playlist-container {
          border-top-color: rgba(0, 0, 0, 0.1);
        }
        
        .playlist-header {
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .playlist-header {
          border-bottom-color: rgba(0, 0, 0, 0.1);
        }
        
        .playlist-title {
          font-weight: bold;
          font-size: 14px;
        }
        
        .playlist-tracks {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }
        
        .track-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .track-item {
          padding: 8px 15px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .light .track-item {
          border-bottom-color: rgba(0, 0, 0, 0.05);
        }
        
        .track-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .light .track-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .track-item.active {
          background-color: rgba(29, 185, 84, 0.1);
          border-left: 3px solid #1DB954;
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
      console.warn('Error updating buffer progress', error);
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
    }
  }
}
   * Sprawdza wsparcie dla MediaSource API
   */
  checkMediaSourceSupport() {
    return (typeof window !== 'undefined' &&
            window.MediaSource !== undefined &&
            typeof window.MediaSource.isTypeSupported === 'function' &&
            window.MediaSource.isTypeSupported('audio/mpeg'));
  },

  /**
   * Generuje unikalny identyfikator dla pliku audio
   */
  generateAudioId(src) {
    if (!src) return 'default-audio';

    // Proste kodowanie URL as hash
    const cleanSrc = src.split('?')[0]; // Usuń parametry query
    return cleanSrc.split('/').pop() || 'audio-file';
  },

  /**
   * Formatowanie czasu w sekundy na format MM:SS
   */
  formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  },

  /**
   * Bezpieczne wykonanie funkcji z obsługą błędów
   */
  safeExecute(fn, errorMessage = 'Error executing function') {
    try {
      return fn();
    } catch (e) {
      console.error(errorMessage, e);
      return null;
    }
  }
};

// Klasa obsługująca pamięć lokalną
class StorageManager {
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
}

// Klasa zarządzająca interfejsem użytkownika
class UIManager {
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