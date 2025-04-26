/**
 * player-loader.js - Skrypt pomocniczy do ładowania AudioPlayer
 * Ten plik zapewnia kompatybilność z przeglądarkami, które nie obsługują modułów ES
 */

(function () {
    // Funkcja ładująca skrypty w odpowiedniej kolejności
    function loadScripts(scripts, callback) {
        var loadedCount = 0;

        function loadScript(url) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.onload = function () {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    loadScript(scripts[loadedCount]);
                }
            };
            script.onerror = function () {
                console.error('Błąd ładowania skryptu:', url);
                loadedCount++;
                if (loadedCount === scripts.length) {
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    loadScript(scripts[loadedCount]);
                }
            };
            document.head.appendChild(script);
        }

        if (scripts.length > 0) {
            loadScript(scripts[0]);
        } else {
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    // Sprawdź, czy przeglądarki obsługuje moduły ES
    var supportsModules = false;
    try {
        new Function('import("")');
        supportsModules = true;
    } catch (err) {
        supportsModules = false;
    }

    // Lista skryptów do załadowania
    var scripts = [
        'AudioPlayer.utils.js',
        'AudioPlayer.ui.js',
        'AudioPlayer.storage.js',
        'AudioPlayer.events.js',
        'AudioPlayer.core.js',
        'AudioPlayer.js'
    ];

    // Jeśli przeglądarka nie obsługuje modułów ES, załącz skrypty ręcznie
    if (!supportsModules) {
        // Dodaj atrybut nomodule do skryptu modułowego
        var moduleScripts = document.querySelectorAll('script[type="module"]');
        for (var i = 0; i < moduleScripts.length; i++) {
            moduleScripts[i].setAttribute('nomodule', '');
        }

        // Załaduj skrypty w odpowiedniej kolejności
        loadScripts(scripts, function () {
            console.log('AudioPlayer został załadowany (tryb kompatybilności)');

            // Wywołaj funkcję inicjalizującą odtwarzacz, jeśli istnieje
            if (typeof window.initAudioPlayers === 'function') {
                window.initAudioPlayers();
            }
        });
    } else {
        console.log('AudioPlayer będzie załadowany jako moduł ES');
    }
})();