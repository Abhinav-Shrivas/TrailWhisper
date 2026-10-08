// Web Speech & Haptic Feedback Engine for Anti-Screen Field Interaction

let synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let currentUtterance = null;

export const speechService = {
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  getVoices() {
    if (!this.isSupported()) return [];
    return synth.getVoices();
  },

  speak(text, { onStart, onEnd, onError } = {}) {
    if (!this.isSupported() || !text) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Cancel previous playback
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Deliberate, clear naturalist outdoor cadence
      utterance.pitch = 1.0;

      // Select an expressive English voice if available
      const voices = synth.getVoices();
      const naturalVoice = voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        currentUtterance = null;
        if (onError) onError(e);
      };

      currentUtterance = utterance;
      synth.speak(utterance);
    } catch (err) {
      console.warn("Speech error, failing gracefully:", err);
      if (onEnd) onEnd();
    }
  },

  stop() {
    if (this.isSupported()) {
      synth.cancel();
      currentUtterance = null;
    }
  },

  pause() {
    if (this.isSupported() && synth.speaking) {
      synth.pause();
    }
  },

  resume() {
    if (this.isSupported() && synth.paused) {
      synth.resume();
    }
  },

  isSpeaking() {
    return this.isSupported() && Boolean(synth.speaking);
  },

  triggerHaptic(pattern = [70, 40, 90]) {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignored on desktop or unsupported devices
      }
    }
  }
};
