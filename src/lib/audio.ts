// src/lib/audio.ts

const NOTE_TO_MIDI_BASE: { [key: string]: number } = {
    "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11,
  };
  
  let audioContext: AudioContext | null = null;
  let isAudioContextReady = false;
  let initializationPromise: Promise<void> | null = null;
  
  /**
   * Ensures an AudioContext is initialized and returned.
   * Attempts to resume the context on the first user interaction.
   * @returns {AudioContext} The AudioContext instance.
   */
  async function initializeAudioContext(): Promise<AudioContext> {
    if (audioContext && isAudioContextReady) {
      return audioContext;
    }

    if (initializationPromise) {
      await initializationPromise;
      return audioContext!;
    }

    initializationPromise = new Promise<void>(async (resolve, reject) => {
      try {
        if (!audioContext) {
          audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        if (audioContext.state === 'running') {
          isAudioContextReady = true;
          resolve();
        } else {
          reject(new Error('Failed to initialize AudioContext'));
        }
      } catch (error) {
        reject(error);
      }
    });

    await initializationPromise;
    return audioContext!;
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
  export async function playNote(noteName: string, duration: number = 0.5): Promise<void> {
    try {
      const context = await initializeAudioContext();
      await _playTone(noteName, duration, context);
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  }
  
  /**
   * Internal function to play the tone once AudioContext is confirmed running.
   * @param {string} noteName
   * @param {number} duration
   * @param {AudioContext} context
   */
  async function _playTone(noteName: string, duration: number, context: AudioContext): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Playing note: ${noteName} at time ${context.currentTime.toFixed(3)}`);
      
        const accidentalMatch = noteName.match(/[CDEFGAB]#/i);
        const baseNote = accidentalMatch ? accidentalMatch[0].toUpperCase() : noteName.substring(0, 1).toUpperCase();
        const octave = parseInt(noteName.slice(baseNote.length), 10);
      
        if (isNaN(octave) || !(baseNote in NOTE_TO_MIDI_BASE)) {
          console.warn(`Invalid note name for playback: ${noteName}. Skipping tone generation.`);
          resolve();
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
      
        oscillator.onended = () => resolve();
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration);
      } catch (error) {
        reject(error);
      }
    });
  }
  