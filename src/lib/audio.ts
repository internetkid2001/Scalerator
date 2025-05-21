// src/lib/audio.ts

// A mapping from note names (C, C#, D, etc.) to their MIDI note numbers for octave 0
// This is a base for calculating frequencies.
const NOTE_TO_MIDI_BASE: { [key: string]: number } = {
    "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11,
  };
  
  // Global AudioContext for efficient audio playback
  let audioContext: AudioContext | null = null;
  let isAudioContextResumed = false; // Flag to track if context has been resumed
  
  /**
   * Ensures an AudioContext is initialized and returned.
   * Creates a new one if it doesn't exist.
   * Also attempts to resume the context if it's suspended.
   * @returns {AudioContext} The AudioContext instance.
   */
  function getAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  
    // Attempt to resume AudioContext if it's suspended and hasn't been resumed yet
    // This is crucial for browser autoplay policies, as audio must be initiated by a user gesture.
    if (audioContext.state === 'suspended' && !isAudioContextResumed) {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully.');
        isAudioContextResumed = true;
      }).catch(error => {
        console.error('Failed to resume AudioContext:', error);
      });
    }
    return audioContext;
  }
  
  /**
   * Converts a MIDI note number to its corresponding frequency in Hz.
   * Formula: f = 440 * 2^((midiNote - 69) / 12)
   * MIDI note 69 is A4 (440 Hz).
   * @param {number} midiNote The MIDI note number.
   * @returns {number} The frequency in Hz.
   */
  function midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }
  
  /**
   * Plays a musical note for a given duration.
   * @param {string} noteName The note to play (e.g., "C4", "G#3").
   * @param {number} duration The duration in seconds (default: 0.5).
   */
  export function playNote(noteName: string, duration: number = 0.5): void {
    console.log(`Attempting to play note: ${noteName}`); // Debugging log
    const context = getAudioContext();
  
    // Parse note name (e.g., "C#4" -> "C#", 4)
    const accidentalMatch = noteName.match(/[CDEFGAB]#/i);
    const baseNote = accidentalMatch ? accidentalMatch[0].toUpperCase() : noteName.substring(0, 1).toUpperCase();
    const octave = parseInt(noteName.slice(baseNote.length), 10);
  
    if (isNaN(octave) || !(baseNote in NOTE_TO_MIDI_BASE)) {
      console.warn(`Invalid note name for playback: ${noteName}. Skipping playback.`);
      return;
    }
  
    // Calculate MIDI note number: (octave + 1) * 12 + base_midi_value
    // MIDI octave 0 starts at C-1. Our chromatic array starts at C0.
    // So, C0 is MIDI note 12. C4 is MIDI note 60.
    // The octave calculation in the components (4 + Math.floor(position.fret / 12))
    // means a C on fret 0 (open string) on the E string (E4) would be C4.
    // So, if the component passes "C4", we need to map C to MIDI 0, and 4 to octave,
    // then (4 + 1) * 12 + 0 = 60. This is correct for C4.
    const midiNote = (octave + 1) * 12 + NOTE_TO_MIDI_BASE[baseNote];
    const frequency = midiToFrequency(midiNote);
  
    console.log(`Parsed: Base Note: ${baseNote}, Octave: ${octave}, MIDI: ${midiNote}, Frequency: ${frequency.toFixed(2)} Hz`); // Debugging log
  
    // Create an oscillator node
    const oscillator = context.createOscillator();
    oscillator.type = 'sine'; // Sine wave for a clean tone, can be 'sawtooth', 'square', 'triangle'
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  
    // Create a gain node for volume control (to avoid clicks and control decay)
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, context.currentTime); // Start at 0 volume
    gainNode.gain.linearRampToValueAtTime(0.7, context.currentTime + 0.01); // Quick attack to 70% volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration); // Exponential decay
  
    // Connect the oscillator to the gain node, and the gain node to the audio context's destination (speakers)
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
  
    // Start and stop the oscillator
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
    console.log(`Note ${noteName} started at ${context.currentTime.toFixed(3)}s, stopping at ${(context.currentTime + duration).toFixed(3)}s`); // Debugging log
  }
  