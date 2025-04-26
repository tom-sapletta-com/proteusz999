/**
 * AudioPlayer.js - Główny plik eksportujący odtwarzacz audio
 * Import i re-export klasy AudioPlayer z modułu core
 */

import AudioPlayer from './AudioPlayer.core.js';

// Eksportuj domyślną klasę AudioPlayer
export default AudioPlayer;

// Eksportuj również jako obiekt globalny dla starszych przeglądarek, które nie obsługują modułów
if (typeof window !== 'undefined') {
    window.AudioPlayer = AudioPlayer;
}