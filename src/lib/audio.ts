// src/lib/audio.ts

const NOTE_TO_MIDI_BASE: { [key: string]: number } = {
    "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11,
  };
  
  let audioContext: AudioContext | null = null;
  let isAudioContextReady = false; // New flag to indicate if context is ready for playback
  
  /**
   * Ensures an AudioContext is initialized and returned.
   * Attempts to resume the context on the first user interaction.
   * @returns {AudioContext} The AudioContext instance.
   */
  function getAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Add an event listener to resume context on any user interaction
      const resumeContext = () => {
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('AudioContext resumed successfully.');
            isAudioContextReady = true;
            document.removeEventListener('click', resumeContext);
            document.removeEventListener('touchstart', resumeContext);
          }).catch(error => {
            console.error('Failed to resume AudioContext:', error);
          });
        } else if (audioContext && audioContext.state === 'running') {
          isAudioContextReady = true;
          document.removeEventListener('click', resumeContext);
          document.removeEventListener('touchstart', resumeContext);
        }
      };
      // Attach listeners to common user interaction events
      document.addEventListener('click', resumeContext, { once: true });
      document.addEventListener('touchstart', resumeContext, { once: true });
    }
    return audioContext;
  }
  
  /**
   * Converts a MIDI note number to its corresponding frequency in Hz.
   * @param {number} midiNote The MIDI note number.
   * @returns {number} The frequency in Hz.
   */
  function midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }
  
  /**
   * Plays a musical note for a given duration.
   * Ensures AudioContext is running before attempting to play.
   * @param {string} noteName The note to play (e.g., "C4", "G#3").
   * @param {number} duration The duration in seconds (default: 0.5).
   */
  export function playNote(noteName: string, duration: number = 0.5): void {
    const context = getAudioContext();
  
    // Only attempt to play if the AudioContext is running or has been resumed
    if (context.state !== 'running' && !isAudioContextReady) {
      console.warn('AudioContext is not yet running or resumed. Trying to resume and play after a short delay.');
      // If context is not ready, try to resume it and then play after a short delay
      context.resume().then(() => {
        if (context.state === 'running') {
          isAudioContextReady = true; // Mark as ready
          // Re-call playNote after a small delay to allow context to fully activate
          setTimeout(() => _playTone(noteName, duration, context), 50); // Small delay
        } else {
          console.error('AudioContext failed to resume. Cannot play note.');
        }
      }).catch(error => {
        console.error('Error resuming AudioContext:', error);
      });
      return; // Exit current playNote call
    }
  
    // If context is already running or marked as ready, play immediately
    _playTone(noteName, duration, context);
  }
  
  /**
   * Internal function to play the tone once AudioContext is confirmed running.
   * @param {string} noteName
   * @param {number} duration
   * @param {AudioContext} context
   */
  function _playTone(noteName: string, duration: number, context: AudioContext): void {
    console.log(`Playing note: ${noteName} at time ${context.currentTime.toFixed(3)}`);
  
    const accidentalMatch = noteName.match(/[CDEFGAB]#/i);
    const baseNote = accidentalMatch ? accidentalMatch[0].toUpperCase() : noteName.substring(0, 1).toUpperCase();
    const octave = parseInt(noteName.slice(baseNote.length), 10);
  
    if (isNaN(octave) || !(baseNote in NOTE_TO_MIDI_BASE)) {
      console.warn(`Invalid note name for playback: ${noteName}. Skipping tone generation.`);
      return;
    }
  
    const midiNote = (octave + 1) * 12 + NOTE_TO_MIDI_BASE[baseNote];
    const frequency = midiToFrequency(midiNote);
  
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.7, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
  
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  }
  