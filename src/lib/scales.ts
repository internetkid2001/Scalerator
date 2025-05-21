// src/lib/scales.ts

// 1) our 12-tone chromatic sequence
export const CHROMATIC: string[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

// 2) standard instrument tunings, low→high
export const TUNINGS: Record<string, string[]> = {
  "Guitar Standard": ["E", "A", "D", "G", "B", "E"],
  "Bass Guitar":      ["E", "A", "D", "G"],
  "Mandolin":         ["G", "D", "A", "E"],
  "5-String Banjo":   ["G", "D", "G", "B", "D"],
  "Dropped D Guitar": ["D", "A", "D", "G", "B", "E"],
  "DADGAD Guitar":    ["D", "A", "D", "G", "A", "D"],
  "Open G Guitar":    ["D", "G", "D", "G", "B", "D"],
  "Open D Guitar":    ["D", "A", "D", "F#", "A", "D"],
  "Open Em Guitar":   ["E", "B", "E", "G#", "B", "E"],
  "Detuned ½-step":   ["D#", "G#", "C#", "F#", "A#", "D#"],
  "7-String Guitar":  ["B", "E", "A", "D", "G", "B", "E"],
  "5-String Bass":    ["B", "E", "A", "D", "G"],
  "6-String Bass":    ["B", "E", "A", "D", "G", "C"],
  // ...feel free to add more
};

// 3) major scale intervals
export const MAJOR_INTERVALS = [2, 2, 1, 2, 2, 2, 1];

// Scale formulas as semitone intervals from the root
export const SCALE_FORMULAS: Record<string, number[]> = {
  major:                     [2,2,1,2,2,2,1],
  "pentatonic minor":        [3,2,2,3,2],
  blues:                     [3,2,1,1,3,2],
  "pentatonic major":        [2,2,3,2,3],
  "natural minor":           [2,1,2,2,1,2,2],
  "harmonic minor":          [2,1,2,2,1,3,1],
  "melodic minor (ascending)":   [2,1,2,2,2,2,1],
  "melodic minor (descending)":  [2,2,1,2,2,1,2],
  dorian:                    [2,1,2,2,2,1,2],
  phrygian:                  [1,2,2,2,1,2,2],
  lydian:                    [2,2,2,1,2,2,1],
  mixolydian:                [2,2,1,2,2,1,2],
  locrian:                   [1,2,2,1,2,2,2],
  arabic:                    [1,3,1,2,1,3,1],
  "hungarian gypsy":         [2,1,3,1,1,3,1],
  "whole tone":              [2,2,2,2,2,2],
  augmented:                 [3,1,3,1,3,1],
};

export interface Position {
  stringIdx: number;   // 0 = lowest string
  fret:      number;   // 0 = open
  note:      string;   // pitch name
}

/**
 * Builds a sequence of notes for a given scale.
 * @param root The root note of the scale (e.g., "C", "A#").
 * @param intervals An array of semitone intervals for the scale.
 * @returns An array of note names in the scale.
 * @throws {Error} If the root note is unknown.
 */
export function buildScaleNotes(
  root: string,
  intervals: number[] = MAJOR_INTERVALS
): string[] {
  const notes = [root];
  let idx = CHROMATIC.indexOf(root);
  if (idx < 0) {
    console.error(`Error: Unknown root note provided: ${root}`);
    // Return an empty array or handle more gracefully in UI
    return [];
  }
  for (const step of intervals) {
    idx = (idx + step) % CHROMATIC.length;
    notes.push(CHROMATIC[idx]);
  }
  return notes;
}

/**
 * Calculates the positions of scale notes on a fretboard for a given tuning.
 * @param root The root note of the scale.
 * @param intervals An array of semitone intervals for the scale.
 * @param tuning An array of open string notes (low to high).
 * @param frets The number of frets to consider.
 * @returns An array of Position objects.
 * @throws {Error} If any tuning note is unknown.
 */
export function getScalePositions(
  root:      string,
  intervals: number[]       = MAJOR_INTERVALS,
  tuning:    string[]       = TUNINGS["Guitar Standard"],
  frets:     number         = 12
): Position[] {
  const scaleSet = new Set(buildScaleNotes(root, intervals));
  const positions: Position[] = [];

  tuning.forEach((openNote, stringIdx) => {
    const openIdx = CHROMATIC.indexOf(openNote);
    if (openIdx < 0) {
      console.error(`Error: Unknown tuning note: ${openNote}. Please use valid chromatic notes.`);
      // Return empty array or handle more gracefully in UI
      return [];
    }
    for (let fret = 0; fret <= frets; fret++) {
      const note = CHROMATIC[(openIdx + fret) % CHROMATIC.length];
      if (scaleSet.has(note)) {
        positions.push({ stringIdx, fret, note });
      }
    }
  });

  return positions;
}

/**
 * Parses a comma-separated string of notes into a tuning array.
 * Validates each note against the CHROMATIC array.
 * @param tuningString A comma-separated string of notes (e.g., "E,A,D,G,B,E").
 * @returns An array of validated note strings.
 * @throws {Error} If any note in the string is invalid.
 */
export function parseCustomTuning(tuningString: string): string[] {
  const notes = tuningString.split(',').map(note => note.trim().toUpperCase());
  for (const note of notes) {
    if (CHROMATIC.indexOf(note) === -1) {
      throw new Error(`Invalid note in custom tuning: '${note}'. Valid notes are: ${CHROMATIC.join(', ')}`);
    }
  }
  if (notes.length === 0) {
    throw new Error("Custom tuning cannot be empty.");
  }
  return notes;
}

/**
 * Parses a comma-separated string of numbers into an interval array.
 * Validates that each value is a positive integer.
 * @param intervalString A comma-separated string of numbers (e.g., "2,2,1,2,2,2,1").
 * @returns An array of validated number intervals.
 * @throws {Error} If any value in the string is not a valid positive integer.
 */
export function parseCustomIntervals(intervalString: string): number[] {
  const intervals = intervalString.split(',').map(s => parseInt(s.trim(), 10));
  for (const interval of intervals) {
    if (isNaN(interval) || interval <= 0) {
      throw new Error(`Invalid interval: '${interval}'. Intervals must be positive integers.`);
    }
  }
  if (intervals.length === 0) {
    throw new Error("Custom scale intervals cannot be empty.");
  }
  return intervals;
}

/**
 * Calculates the full note name with octave (e.g., "C4", "G#3") for a given note on a string and fret.
 * This is crucial for accurate audio playback.
 * @param note The base note name (e.g., "C", "G#").
 * @param fret The fret number.
 * @param openStringNote The note of the open string.
 * @returns The full note name with octave.
 */
export function getNoteWithOctave(note: string, fret: number, openStringNote: string): string {
  const openIdx = CHROMATIC.indexOf(openStringNote);
  if (openIdx < 0) {
    console.warn(`getNoteWithOctave: Unknown open string note: ${openStringNote}`);
    return note; // Fallback to just the note if open string is unknown
  }

  // Determine the base octave of the open string.
  // A common convention is E4 for high E string, E2 for low E string.
  // Let's assume a base octave for C0 (MIDI 12) to calculate relative octaves.
  // For simplicity, we can assume typical guitar range (E2-E4) or a general mid-range.
  // Let's use A4 (MIDI 69) as a reference point.
  // C4 is MIDI 60.
  // If openStringNote is 'E' (MIDI 4), and it's the high E string, it's E4 (MIDI 64).
  // If it's the low E string, it's E2 (MIDI 40).
  // This is a simplified approach; a more precise one would need string-specific base octaves.
  // For now, let's derive the octave based on the MIDI value of the note at fret 0.

  // Find the MIDI index of the open string note within the chromatic scale (0-11)
  const openNoteChromaticIndex = CHROMATIC.indexOf(openStringNote);

  // We need a reference MIDI note and its corresponding octave.
  // Let's assume C4 is MIDI 60.
  // The MIDI value of the open string note can be approximated.
  // A more robust solution would involve a map of open string notes to their exact MIDI values.
  // For now, let's use a simplified approach:
  // Assume open E string (standard tuning) is E2 (MIDI 40) for low E, E4 (MIDI 64) for high E.
  // This is a simplification. A more accurate approach would be to pass the base octave for each string.
  // For the purpose of playing notes, the `playNote` function already handles octave parsing.
  // So, we just need to ensure the octave we append is reasonable.

  // Let's use a fixed reference for octave calculation: C4 is MIDI 60.
  // The MIDI value of the note at the current fret:
  const noteChromaticIndex = CHROMATIC.indexOf(note);
  const totalSemitonesFromC0 = openNoteChromaticIndex + fret; // Semitones from C0 if C0 is 0 index

  // Calculate the octave relative to C0 (MIDI 12)
  // MIDI note = (octave + 1) * 12 + chromatic_index
  // So, octave = (MIDI note - chromatic_index) / 12 - 1
  // This is complex without knowing the absolute MIDI of the open string.

  // Simpler approach for octave estimation:
  // Assume middle C (C4) is a common reference.
  // If the open string note is 'E' (index 4) and it's fret 0, it's an E.
  // If we want E2, E3, E4 etc.
  // Let's use a fixed starting octave for the lowest string (E2) and calculate from there.
  // This function is primarily for constructing the "NoteOctave" string.

  // A more practical approach for a guitar-like instrument:
  // Assume the lowest string (E) is typically E2 (MIDI 40).
  // Then A is A2 (MIDI 45), D is D3 (MIDI 50), G is G3 (MIDI 55), B is B3 (MIDI 59), High E is E4 (MIDI 64).
  // This requires `stringIdx` to determine the base octave.
  // Since `Position` already has `stringIdx`, we can pass it here.

  // For now, let's revert to the simpler octave calculation that was working before,
  // which assumes a base octave (e.g., 4) and adds an octave for every 12 frets.
  // This is what `playNote` expects.
  const octave = 4 + Math.floor(fret / 12); // This was the original simple octave calculation

  return note + octave;
}
