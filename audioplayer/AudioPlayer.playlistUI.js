/**
 * AudioPlayer.playlistUI.js - Interfejs użytkownika dla playlisty
 */

import {Utils} from './AudioPlayer.utils.js';

export class PlaylistUIManager {
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

        if (this.player.options.debug) {
            this.player.debug.log('PlaylistUI initialized');
        }
    }

    /**
     * Tworzy przycisk przełączania widoczności playlisty
     * @private
     */
    _createPlaylistToggleButton() {
        const controlsContainer = this.player.container.querySelector('.player-controls');

        if (!controlsContainer) {
            if (this.player.options.debug) {
                this.player.debug.log('Controls container not found');
            }
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

        // Dodaj style dla nowych przycisków
        this._addPlaylistUIStyles();
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
     * Dodaje style CSS dla interfejsu playlisty
     * @private
     */
    _addPlaylistUIStyles() {
        const styleId = 'audio-player-playlist-styles';

        if (document.getElementById(styleId)) {
            return;
        }

        const styleElement = document.createElement('style');
        styleElement.id = styleId;

        styleElement.textContent = `
      /* Przyciski nawigacji */
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
      
      /* Kontener playlisty */
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
      
      .playlist-controls {
        display: flex;
        align-items: center;
      }
      
      .playlist-controls button {
        background: none;
        border: none;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin-left: 5px;
      }
      
      .playlist-controls button svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }
      
      .active-control {
        color: #1DB954;
      }
      
      /* Lista utworów */
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
      
      .track-index {
        width: 24px;
        text-align: center;
        margin-right: 8px;
        opacity: 0.5;
        font-size: 12px;
      }
      
      .track-info-container {
        flex: 1;
        min-width: 0;
      }
      
      .track-title-text {
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .track-artist-text {
        font-size: 12px;
        opacity: 0.7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .track-duration {
        font-size: 12px;
        opacity: 0.7;
        margin-left: 8px;
      }
      
      .track-actions {
        opacity: 0;
        transition: opacity 0.2s;
        margin-left: 8px;
        display: flex;
      }
      
      .track-item:hover .track-actions {
        opacity: 1;
      }
      
      .track-action-btn {
        background: none;
        border: none;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      
      .track-action-btn:hover {
        opacity: 1;
      }
      
      .track-action-btn svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }
      
      /* Footer playlisty */
      .playlist-footer {
        padding: 10px 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .light .playlist-footer {
        border-top-color: rgba(0, 0, 0, 0.1);
      }
      
      .playlist-actions {
        display: flex;
        justify-content: space-between;
      }
      
      .playlist-actions button {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        padding: 5px 8px;
        border-radius: 3px;
        font-size: 12px;
        cursor: pointer;
        color: inherit;
        transition: background-color 0.2s;
      }
      
      .light .playlist-actions button {
        background: rgba(0, 0, 0, 0.1);
      }
      
      .playlist-actions button:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .light .playlist-actions button:hover {
        background: rgba(0, 0, 0, 0.2);
      }
      
      /* Elementy przeciągania */
      .track-item.dragging {
        opacity: 0.5;
        background-color: rgba(29, 185, 84, 0.1);
      }
      
      .track-item.drag-over {
        border-top: 2px solid #1DB954;
      }
      
      /* Dialogi */
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      
      .dialog-container {
        background-color: #fff;
        border-radius: 8px;
        padding: 20px;
        width: 300px;
        max-width: 90%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .dialog-header {
        margin-bottom: 15px;
      }
      
      .dialog-title {
        font-weight: bold;
        font-size: 16px;
        color: #333;
      }
      
      .dialog-content {
        margin-bottom: 20px;
      }
      
      .dialog-content input,
      .dialog-content select {
        width: 100%;
        padding: 8px;
        margin-bottom: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
      }
      
      .dialog-actions button {
        padding: 8px 12px;
        margin-left: 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .dialog-actions .cancel-btn {
        background-color: #f0f0f0;
        color: #333;
      }
      
      .dialog-actions .confirm-btn {
        background-color: #1DB954;
        color: white;
      }
    `;

        document.head.appendChild(styleElement);
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
        const {tracks, currentTrack, loop, shuffle} = playlistData;
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
     */
    _updateControlButtons(loop, shuffle) {
        const playlistControls = this.playlistContainer.querySelector('.playlist-controls');
        if (!playlistControls) return;

        // Sprawdź, czy przyciski już istnieją
        if (playlistControls.children.length === 0) {
            playlistControls.innerHTML = `
        <button class="loop-btn" title="Loop playlist">
          <svg viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        </button>
        <button class="shuffle-btn" title="Shuffle playlist">
          <svg viewBox="0 0 24 24">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          </svg>
        </button>
      `;

            // Dodaj obsługę zdarzeń
            const loopBtn = playlistControls.querySelector('.loop-btn');
            const shuffleBtn = playlistControls.querySelector('.shuffle-btn');

            if (loopBtn) {
                loopBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.player.playlist) {
                        this.player.playlist.toggleLoop();
                    }
                });
            }

            if (shuffleBtn) {
                shuffleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.player.playlist) {
                        this.player.playlist.toggleShuffle();
                    }
                });
            }
        }

        // Aktualizuj stan przycisków
        const loopBtn = playlistControls.querySelector('.loop-btn');
        const shuffleBtn = playlistControls.querySelector('.shuffle-btn');

        if (loopBtn) {
            if (loop) {
                loopBtn.classList.add('active-control');
            } else {
                loopBtn.classList.remove('active-control');
            }
        }

        if (shuffleBtn) {
            if (shuffle) {
                shuffleBtn.classList.add('active-control');
            } else {
                shuffleBtn.classList.remove('active-control');
            }
        }
    }

    /**
     * Konfiguruje obsługę przeciągania i upuszczania dla elementu listy
     * @param {HTMLElement} trackItem - element listy
     * @private
     */
    _setupDragAndDrop(trackItem) {
        trackItem.draggable = true;

        trackItem.addEventListener('dragstart', (e) => {
            this.draggedItem = trackItem;
            setTimeout(() => {
                trackItem.classList.add('dragging');
            }, 0);
        });

        trackItem.addEventListener('dragend', () => {
            trackItem.classList.remove('dragging');
            this.draggedItem = null;

            // Wyczyść wszystkie znaczniki przeciągania
            const allTrackItems = this.playlistContainer.querySelectorAll('.track-item');
            allTrackItems.forEach(item => {
                item.classList.remove('drag-over');
            });
        });

        trackItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!this.draggedItem || this.draggedItem === trackItem) return;

            trackItem.classList.add('drag-over');
        });

        trackItem.addEventListener('dragleave', () => {
            trackItem.classList.remove('drag-over');
        });

        trackItem.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!this.draggedItem || this.draggedItem === trackItem) return;

            const fromIndex = parseInt(this.draggedItem.dataset.index);
            const toIndex = parseInt(trackItem.dataset.index);

            if (fromIndex !== toIndex && this.player.playlist) {
                // Przenieś utwór w playliście
                this._moveTrack(fromIndex, toIndex);
            }
        });
    }

    /**
     * Przenosi utwór z jednej pozycji na drugą
     * @param {Number} fromIndex - indeks źródłowy
     * @param {Number} toIndex - indeks docelowy
     * @private
     */
    _moveTrack(fromIndex, toIndex) {
        if (!this.player.playlist) return;

        const tracks = this.player.playlist.getPlaylist();
        const currentTrack = this.player.playlist.getCurrentTrack();

        // Zapisz indeks aktualnie odtwarzanego utworu
        const currentTrackIndex = currentTrack ? currentTrack.index : -1;

        // Przenoszony utwór
        const movedTrack = tracks[fromIndex];

        // Usuń utwór z oryginalnej pozycji
        tracks.splice(fromIndex, 1);

        // Wstaw utwór na nową pozycję
        tracks.splice(toIndex, 0, movedTrack);

        // Zaktualizuj playlistę
        this.player.playlist.setPlaylist(tracks);

        // Jeśli był odtwarzany jakiś utwór, wznów odtwarzanie odpowiedniego
        if (currentTrackIndex !== -1) {
            let newIndex = currentTrackIndex;

            // Zaktualizuj indeks odtwarzanego utworu
            if (currentTrackIndex === fromIndex) {
                // Przenoszony był aktualnie odtwarzany
                newIndex = toIndex;
            } else if (fromIndex < currentTrackIndex && toIndex >= currentTrackIndex) {
                // Przenoszony był przed aktualnie odtwarzanym i przesunięty za niego
                newIndex = currentTrackIndex - 1;
            } else if (fromIndex > currentTrackIndex && toIndex <= currentTrackIndex) {
                // Przenoszony był za aktualnie odtwarzanym i przesunięty przed niego
                newIndex = currentTrackIndex + 1;
            }

            this.player.playlist.playTrack(newIndex);
        }
    }

    /**
     * Przełącza widoczność playlisty
     */
    togglePlaylistVisibility() {
        if (!this.playlistContainer) return;

        this.playlistVisible = !this.playlistVisible;

        if (this.playlistVisible) {
            this.playlistContainer.style.display = 'flex';

            // Jeśli mamy dane playlisty, zaktualizuj widok
            if (this.player.playlist) {
                const currentTrack = this.player.playlist.getCurrentTrack();
                const tracks = this.player.playlist.getPlaylist();
                const loop = this.player.playlist.loop;
                const shuffle = this.player.playlist.shuffle;

                this._renderPlaylist({
                    tracks,
                    currentTrack,
                    loop,
                    shuffle
                });
            }
        } else {
            this.playlistContainer.style.display = 'none';
        }

        if (this.player.options.debug) {
            this.player.debug.log(`Playlist visibility: ${this.playlistVisible ? 'shown' : 'hidden'}`);
        }
    }

    /**
     * Wyświetla dialog dodawania utworu
     * @private
     */
    _showAddTrackDialog() {
        const dialog = this._createDialog({
            title: 'Add Track',
            content: `
        <div>
          <label for="track-url">Audio URL:</label>
          <input type="text" id="track-url" placeholder="Enter audio URL">
        </div>
        <div>
          <label for="track-title">Title (optional):</label>
          <input type="text" id="track-title" placeholder="Enter track title">
        </div>
        <div>
          <label for="track-artist">Artist (optional):</label>
          <input type="text" id="track-artist" placeholder="Enter artist name">
        </div>
      `,
            confirmText: 'Add',
            onConfirm: (dialog) => {
                const url = dialog.querySelector('#track-url').value.trim();
                const title = dialog.querySelector('#track-title').value.trim();
                const artist = dialog.querySelector('#track-artist').value.trim();

                if (!url) {
                    alert('Please enter a valid audio URL');
                    return;
                }

                if (this.player.playlist) {
                    const track = {src: url};
                    if (title) track.title = title;
                    if (artist) track.artist = artist;

                    this.player.playlist.addTrack(track);
                }

                this._closeDialog(dialog);
            }
        });
    }

    /**
     * Wyświetla dialog zapisywania playlisty
     * @private
     */
    _showSavePlaylistDialog() {
        if (!this.player.playlist || this.player.playlist.tracks.length === 0) {
            alert('Playlist is empty. Add some tracks first.');
            return;
        }

        const dialog = this._createDialog({
            title: 'Save Playlist',
            content: `
        <div>
          <label for="playlist-name">Playlist Name:</label>
          <input type="text" id="playlist-name" placeholder="Enter playlist name">
        </div>
      `,
            confirmText: 'Save',
            onConfirm: (dialog) => {
                const name = dialog.querySelector('#playlist-name').value.trim();

                if (!name) {
                    alert('Please enter a playlist name');
                    return;
                }

                if (this.player.playlist) {
                    const success = this.player.playlist.savePlaylist(name);
                    if (success) {
                        alert(`Playlist "${name}" saved successfully.`);
                    } else {
                        alert('Failed to save playlist. Please try again.');
                    }
                }

                this._closeDialog(dialog);
            }
        });
    }

    /**
     * Wyświetla dialog wczytywania playlisty
     * @private
     */
    _showLoadPlaylistDialog() {
        if (!this.player.playlist) return;

        const savedPlaylists = this.player.playlist.getSavedPlaylists();

        if (savedPlaylists.length === 0) {
            alert('No saved playlists found.');
            return;
        }

        let optionsHTML = '';
        savedPlaylists.forEach(name => {
            optionsHTML += `<option value="${name}">${name}</option>`;
        });

        const dialog = this._createDialog({
            title: 'Load Playlist',
            content: `
        <div>
          <label for="playlist-select">Select Playlist:</label>
          <select id="playlist-select">
            ${optionsHTML}
          </select>
        </div>
        <div>
          <label>
            <input type="checkbox" id="autoplay-checkbox">
            Start playing after loading
          </label>
        </div>
      `,
            confirmText: 'Load',
            onConfirm: (dialog) => {
                const name = dialog.querySelector('#playlist-select').value;
                const autoplay = dialog.querySelector('#autoplay-checkbox').checked;

                if (!name) {
                    alert('Please select a playlist');
                    return;
                }

                if (this.player.playlist) {
                    const success = this.player.playlist.loadPlaylist(name, autoplay);
                    if (!success) {
                        alert('Failed to load playlist. It may be corrupted or deleted.');
                    }
                }

                this._closeDialog(dialog);
            }
        });
    }

    /**
     * Tworzy i wyświetla dialog
     * @param {Object} options - opcje dialogu
     * @private
     */
    _createDialog({title, content, confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel}) {
        // Usuń istniejący dialog, jeśli istnieje
        const existingDialog = document.querySelector('.dialog-overlay');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Utwórz nowy dialog
        const dialogOverlay = document.createElement('div');
        dialogOverlay.className = 'dialog-overlay';

        dialogOverlay.innerHTML = `
      <div class="dialog-container">
        <div class="dialog-header">
          <div class="dialog-title">${title}</div>
        </div>
        <div class="dialog-content">
          ${content}
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn">${cancelText}</button>
          <button class="confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;

        // Dodaj do dokumentu
        document.body.appendChild(dialogOverlay);

        // Pobierz przyciski
        const confirmBtn = dialogOverlay.querySelector('.confirm-btn');
        const cancelBtn = dialogOverlay.querySelector('.cancel-btn');

        // Dodaj obsługę zdarzeń
        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel(dialogOverlay);
            this._closeDialog(dialogOverlay);
        });

        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm(dialogOverlay);
        });

        // Zamknij po kliknięciu na overlay
        dialogOverlay.addEventListener('click', (e) => {
            if (e.target === dialogOverlay) {
                this._closeDialog(dialogOverlay);
            }
        });

        return dialogOverlay;
    }

    /**
     * Zamyka dialog
     * @param {HTMLElement} dialog - element dialogu
     * @private
     */
    _closeDialog(dialog) {
        dialog.remove();
    }

    /**
     * Tworzy przyciski sterujące playlistą
     * @private
     */
    _createPlaylistControls() {
        // Przyciski są już tworzone w _updateControlButtons
    }
}