/**
 * Text-to-Speech (TTS) Utility for Amapola Alerta
 * Provides helper functions to automatically read Grandma's tips and first aid steps in Spanish.
 */

export const isAutoReadEnabled = (): boolean => {
  try {
    return localStorage.getItem('amapola_auto_read_enabled') === 'true';
  } catch (e) {
    return false;
  }
};

export const setAutoReadEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem('amapola_auto_read_enabled', enabled ? 'true' : 'false');
    // Dispatch custom event to notify components of the state change
    window.dispatchEvent(new Event('amapola_auto_read_changed'));
  } catch (e) {
    console.error('Failed to set auto read preference', e);
  }
};

export const speakText = (text: string, force: boolean = false): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Only speak if auto-read is enabled OR if user forced it (e.g., clicked a manual speak button)
  if (!isAutoReadEnabled() && !force) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any current speech immediately

    // Clean up text slightly to make it sound natural (remove Markdown stars, hashtags, etc.)
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/_[^_]+_/g, '') // remove italics formatting indicators
      .replace(/`[^`]+`/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0; // Normal rate
    utterance.pitch = 1.05; // Friendly voice pitch

    utterance.onstart = () => {
      window.dispatchEvent(new CustomEvent('amapola_speech_status', { detail: { speaking: true, text: cleanText } }));
    };

    utterance.onend = () => {
      window.dispatchEvent(new CustomEvent('amapola_speech_status', { detail: { speaking: false } }));
    };

    utterance.onerror = () => {
      window.dispatchEvent(new CustomEvent('amapola_speech_status', { detail: { speaking: false } }));
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
  }
};

export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.dispatchEvent(new CustomEvent('amapola_speech_status', { detail: { speaking: false } }));
  }
};
