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
      console.error(`Error: Unknown tuning note provided: ${openNote}`);
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
      throw new Error(`Invalid note in custom tuning: ${note}. Valid notes are: ${CHROMATIC.join(', ')}`);
    }
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
      throw new Error(`Invalid interval in custom scale: ${interval}. Intervals must be positive integers.`);
    }
  }
  return intervals;
}
