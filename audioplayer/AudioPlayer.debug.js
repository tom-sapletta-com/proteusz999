/**
 * AudioPlayer.debug.js - Narzędzia diagnostyczne dla AudioPlayer
 */

export class DebugHelper {
    constructor(player) {
        this.player = player;
        this.debugEnabled = false;
        this.logHistory = [];
        this.maxLogHistory = 100;
    }

    /**
     * Włącza tryb debugowania
     */
    enable() {
        this.debugEnabled = true;
        this.log('Debug mode enabled');
        return this;
    }

    /**
     * Wyłącza tryb debugowania
     */
    disable() {
        this.log('Debug mode disabled');
        this.debugEnabled = false;
        return this;
    }

    /**
     * Zapisuje komunikat w historii logów i wyświetla go w konsoli
     */
    log(message, data = null) {
        if (!this.debugEnabled) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            data
        };

        this.logHistory.push(logEntry);

        // Ogranicz historię logów
        if (this.logHistory.length > this.maxLogHistory) {
            this.logHistory.shift();
        }

        // Wyświetl w konsoli
        if (data) {
            console.log(`[AudioPlayer Debug] ${timestamp} - ${message}`, data);
        } else {
            console.log(`[AudioPlayer Debug] ${timestamp} - ${message}`);
        }

        return this;
    }

    /**
     * Testuje, czy element audio jest poprawnie zainicjalizowany
     */
    testAudioElement() {
        this.log('Testing audio element...');

        if (!this.player.audioElement) {
            this.log('Audio element is null or undefined', {
                container: this.player.container,
                audioId: this.player.audioId,
                audioElementId: this.player._audioElementId
            });
            return false;
        }

        // Sprawdź, czy element audio ma wszystkie wymagane metody i właściwości
        const requiredMethods = ['play', 'pause', 'load'];
        const requiredProperties = ['currentTime', 'duration', 'volume', 'muted', 'paused'];

        const missingMethods = requiredMethods.filter(method =>
            typeof this.player.audioElement[method] !== 'function'
        );

        const missingProperties = requiredProperties.filter(prop =>
            typeof this.player.audioElement[prop] === 'undefined'
        );

        if (missingMethods.length > 0) {
            this.log('Audio element is missing required methods', {missingMethods});
        }

        if (missingProperties.length > 0) {
            this.log('Audio element is missing required properties', {missingProperties});
        }

        // Sprawdź typ obiektu
        this.log('Audio element type check', {
            isHTMLAudioElement: this.player.audioElement instanceof HTMLAudioElement,
            constructor: this.player.audioElement.constructor?.name,
            tagName: this.player.audioElement.tagName
        });

        // Sprawdź, czy element audio jest poprawnie podłączony do DOM
        if (!this.player.audioElement.isConnected) {
            this.log('Audio element is not connected to DOM');
            return false;
        }

        // Sprawdź, czy element audio ma ustawione źródło
        if (!this.player.audioElement.src) {
            this.log('Audio element has no source');
        }

        // Sprawdź stan gotowości elementu audio
        this.log('Audio element readiness', {
            readyState: this.player.audioElement.readyState,
            networkState: this.player.audioElement.networkState,
            error: this.player.audioElement.error
        });

        return missingMethods.length === 0 && missingProperties.length === 0;
    }

    /**
     * Testuje obsługę różnych formatów audio
     */
    testAudioFormats() {
        const formats = [
            {type: 'audio/mpeg', extension: 'mp3'},
            {type: 'audio/wav', extension: 'wav'},
            {type: 'audio/ogg', extension: 'ogg'},
            {type: 'audio/aac', extension: 'aac'},
            {type: 'audio/flac', extension: 'flac'}
        ];

        const results = {};
        const audio = document.createElement('audio');

        for (const format of formats) {
            const canPlay = audio.canPlayType(format.type);
            results[format.extension] = canPlay;
        }

        this.log('Audio format support test', results);
        return results;
    }

    /**
     * Dodaje panel debugowania do strony
     */
    createDebugPanel() {
        if (document.getElementById('audio-player-debug-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'audio-player-debug-panel';
        panel.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      font-family: monospace;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      max-height: 400px;
      overflow: auto;
      font-size: 12px;
    `;

        const header = document.createElement('div');
        header.textContent = 'AudioPlayer Debug';
        header.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #555;
    `;

        const content = document.createElement('div');
        content.id = 'audio-player-debug-content';

        const controls = document.createElement('div');
        controls.style.cssText = `
      margin-top: 10px;
      padding-top: 5px;
      border-top: 1px solid #555;
      display: flex;
      justify-content: space-between;
    `;

        const testButton = document.createElement('button');
        testButton.textContent = 'Test Audio';
        testButton.style.cssText = `
      background: #444;
      color: #fff;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
    `;
        testButton.addEventListener('click', () => {
            this.testAudioElement();
            this.updateDebugPanel();
        });

        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Log';
        clearButton.style.cssText = `
      background: #444;
      color: #fff;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
    `;
        clearButton.addEventListener('click', () => {
            this.logHistory = [];
            this.updateDebugPanel();
        });

        panel.appendChild(header);
        panel.appendChild(content);
        controls.appendChild(testButton);
        controls.appendChild(clearButton);
        panel.appendChild(controls);

        document.body.appendChild(panel);
        this.updateDebugPanel();
    }

    /**
     * Aktualizuje zawartość panelu debugowania
     */
    updateDebugPanel() {
        const content = document.getElementById('audio-player-debug-content');
        if (!content) return;

        content.innerHTML = '';

        // Informacje o stanie odtwarzacza
        const playerState = document.createElement('div');
        playerState.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div><b>Player state:</b> ${this.player.isPlaying ? 'Playing' : 'Paused'}</div>
        <div><b>Audio element:</b> ${this.player.audioElement ? 'Exists' : 'Missing'}</div>
        <div><b>Source:</b> ${this.player.audioElement?.src || 'Not set'}</div>
        <div><b>Current time:</b> ${this.player.audioElement?.currentTime.toFixed(2) || 0}s</div>
        <div><b>Duration:</b> ${this.player.audioElement?.duration.toFixed(2) || 0}s</div>
      </div>
    `;
        content.appendChild(playerState);

        // Ostatnie logi
        const logsContainer = document.createElement('div');
        logsContainer.innerHTML = '<b>Logs:</b>';

        const logsList = document.createElement('div');
        logsList.style.cssText = `
      max-height: 200px;
      overflow: auto;
      margin-top: 5px;
    `;

        const logs = [...this.logHistory].reverse();
        for (const log of logs) {
            const logEntry = document.createElement('div');
            logEntry.style.cssText = `
        border-bottom: 1px solid #333;
        padding: 3px 0;
        font-size: 11px;
      `;

            const time = new Date(log.timestamp).toLocaleTimeString();
            logEntry.innerHTML = `
        <div style="color: #aaa;">${time}</div>
        <div>${log.message}</div>
      `;

            logsList.appendChild(logEntry);
        }

        logsContainer.appendChild(logsList);
        content.appendChild(logsContainer);
    }

    /**
     * Generuje raport diagnostyczny
     */
    generateDiagnosticReport() {
        const playerInfo = {
            containerId: this.player.options.containerId,
            audioId: this.player.audioId,
            hasAudioElement: !!this.player.audioElement,
            isPlaying: this.player.isPlaying,
            options: {...this.player.options}
        };

        if (this.player.audioElement) {
            playerInfo.audioElement = {
                src: this.player.audioElement.src,
                readyState: this.player.audioElement.readyState,
                networkState: this.player.audioElement.networkState,
                error: this.player.audioElement.error ? {
                    code: this.player.audioElement.error.code,
                    message: this.player.audioElement.error.message
                } : null,
                duration: this.player.audioElement.duration,
                currentTime: this.player.audioElement.currentTime,
                paused: this.player.audioElement.paused,
                muted: this.player.audioElement.muted,
                volume: this.player.audioElement.volume
            };
        }

        const browserInfo = {
            userAgent: navigator.userAgent,
            vendor: navigator.vendor,
            audioFormats: this.testAudioFormats()
        };

        return {
            timestamp: new Date().toISOString(),
            player: playerInfo,
            browser: browserInfo,
            logs: this.logHistory
        };
    }
}