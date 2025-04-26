# AudioPlayer v2.0


Wersja zintegrowaną (bundle) wszystkich modułów w jednym pliku dla lepszej kompatybilności ze starszymi środowiskami.

### Struktura plików

1. **AudioPlayer.js** - Główny plik eksportujący, punkt wejścia biblioteki
2. **AudioPlayer.core.js** - Rdzeń biblioteki z główną klasą AudioPlayer
3. **AudioPlayer.ui.js** - Zarządzanie interfejsem użytkownika
4. **AudioPlayer.storage.js** - Obsługa zapisywania i odczytu pozycji odtwarzania
5. **AudioPlayer.events.js** - Obsługa zdarzeń odtwarzacza
6. **AudioPlayer.utils.js** - Funkcje pomocnicze
7. **AudioPlayer.playlist.js** - Zarządzanie playlistą
8. **AudioPlayer.playlistUI.js** - Interfejs użytkownika dla playlisty
9. **AudioPlayer.debug.js** - Narzędzia diagnostyczne i debugowanie
10. **AudioPlayer.bundle.js** - Wszystkie moduły połączone w jeden plik

### Nowe funkcje playlisty

1. **Zarządzanie utworami**
   - Dodawanie pojedynczych utworów lub całych playlist
   - Usuwanie utworów
   - Zmiana kolejności przez przeciąganie i upuszczanie

2. **Tryby odtwarzania**
   - Odtwarzanie sekwencyjne
   - Zapętlanie playlisty
   - Tasowanie utworów (shuffle)
   - Historia odtwarzanych utworów

3. **Zapisywanie i wczytywanie**
   - Zapisywanie playlist w localStorage
   - Wczytywanie zapisanych playlist
   - Zarządzanie zapisanymi playlistami

4. **Intuicyjny interfejs**
   - Panel z listą utworów
   - Aktywny utwór jest wyróżniony
   - Przyciski do sterowania playlistą
   - Dialogi do zarządzania playlistami

### Jak korzystać z nowych funkcji playlisty

```javascript
// Inicjalizacja z włączoną playlistą
const player = new AudioPlayer({
  containerId: 'player-container',
  showPlaylist: true
});

// Dodawanie utworów do playlisty
player.addToPlaylist({
  src: 'sciezka/do/utworu.mp3',
  title: 'Tytuł utworu',
  artist: 'Wykonawca'
});

// Dodawanie wielu utworów
player.setPlaylist([
  { src: 'utwor1.mp3', title: 'Utwór 1', artist: 'Wykonawca 1' },
  { src: 'utwor2.mp3', title: 'Utwór 2', artist: 'Wykonawca 2' }
]);

// Sterowanie odtwarzaniem
player.playNext();        // Następny utwór
player.playPrevious();    // Poprzedni utwór
player.toggleLoop(true);  // Włącz zapętlenie
player.toggleShuffle();   // Przełącz tasowanie

// Zapisywanie i wczytywanie playlist
player.savePlaylist('moja-playlista');
player.loadPlaylist('moja-playlista', true); // true = autoplay
```

### Zintegrowana wersja (Bundle)

Dla wygody i kompatybilności z różnymi środowiskami, stworzyłem również wersję **AudioPlayer.bundle.js**, która zawiera wszystkie moduły w jednym pliku. Ta wersja:

1. Nie wymaga obsługi modułów ES6 ani narzędzi budowania (webpack itp.)
2. Może być po prostu dołączona jako pojedynczy plik JavaScript
3. Działa w starszych przeglądarkach i środowiskach
4. Zawiera całą funkcjonalność włączając obsługę playlist

```html
<!-- Użycie wersji bundle -->
<script src="AudioPlayer.bundle.js"></script>
<script>
  const player = new AudioPlayer({
    containerId: 'player-container'
  });
</script>
```




# AudioPlayer v1.0

### 1. Nowe moduły:

1. **AudioPlayer.playlist.js**
   - Zarządzanie listą utworów
   - Dodawanie, usuwanie i zmiana kolejności utworów
   - Funkcje odtwarzania (następny/poprzedni)
   - Obsługa zapętlenia i tasowania
   - Zapisywanie i ładowanie playlist
   - Zarządzanie historią odtwarzania

2. **AudioPlayer.playlistUI.js**
   - Interfejs użytkownika dla playlisty
   - Panel z listą utworów
   - Przyciski sterujące (loop, shuffle)
   - Obsługa przeciągania i upuszczania dla zmiany kolejności
   - Dialogi do dodawania/zapisywania/wczytywania playlist

### 2. Nowe funkcje w AudioPlayer:

```javascript
// Dodawanie zawartości do playlisty
player.addToPlaylist(track);           // pojedynczy utwór
player.setPlaylist(tracks);            // zbiór utworów
player.loadPlaylist('nazwa');          // wczytaj zapisaną

// Sterowanie odtwarzaniem
player.playNext();                     // następny utwór
player.playPrevious();                 // poprzedni utwór
player.toggleLoop(true/false);         // włącz/wyłącz zapętlenie
player.toggleShuffle(true/false);      // włącz/wyłącz tasowanie

// Informacje o playliście
player.getPlaylist();                  // pobierz całą playlistę
player.getCurrentTrack();              // aktualny utwór

// Interfejs
player.togglePlaylistPanel();          // pokaż/ukryj panel
```

### 3. Przystosowanie istniejących plików:

- **AudioPlayer.core.js**: dodanie inicjalizacji playlist i nowych metod
- **EventManager**: obsługa zdarzeń dla przycisków odtwarzania i zakończenia utworów

### 4. Strona demonstracyjna:

Stworzyłem kompletną stronę demonstracyjną, która pokazuje:
- Jak dodawać utwory do playlisty
- Jak sterować odtwarzaniem utworów
- Jak używać zapętlenia i tasowania
- Jak zapisywać i wczytywać playlisty
- Przykładowy kod dla deweloperów

### Sposób użycia:

```javascript
// Inicjalizacja z włączoną obsługą playlisty
const player = new AudioPlayer({
  containerId: 'player-container',
  showPlaylist: true
});

// Dodawanie utworów
player.addToPlaylist({
  src: 'url/do/pliku.mp3',
  title: 'Tytuł utworu',
  artist: 'Wykonawca'
});

// lub wiele utworów naraz
player.setPlaylist([
  { src: 'url/do/utworu1.mp3', title: 'Utwór 1' },
  { src: 'url/do/utworu2.mp3', title: 'Utwór 2' }
]);
```

### Dodatkowe funkcje:

1. **Przeciąganie i upuszczanie** - Możliwość zmiany kolejności utworów przez przeciąganie
2. **Historia odtwarzania** - Przechowywanie historii utworów dla dokładniejszej nawigacji
3. **Własny wygląd interfejsu** - Stylizacja dostosowana do głównego odtwarzacza
4. **Zapisywanie playlist** - Trwałe przechowywanie konfiguracji playlist w localStorage
5. **Automatyczne przechodzenie** - Automatyczne odtwarzanie następnego utworu po zakończeniu

