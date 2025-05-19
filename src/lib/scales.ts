// src/lib/scales.ts

// 1) our 12-tone chromatic sequence
export const CHROMATIC: string[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

// 2) standard guitar tuning, low→high (6 strings)
export const STANDARD_TUNING: string[] = ["E", "A", "D", "G", "B", "E"];

// 3) major scale intervals
export const MAJOR_INTERVALS = [2, 2, 1, 2, 2, 2, 1];

export interface Position {
  stringIdx: number;   // 0 = low E
  fret: number;        // 0 = open
  note: string;        // pitch name
}

export function buildScaleNotes(
  root: string,
  intervals: number[] = MAJOR_INTERVALS
): string[] {
  const notes = [root];
  let idx = CHROMATIC.indexOf(root);
  if (idx === -1) throw new Error(`Unknown root: ${root}`);
  for (const step of intervals) {
    idx = (idx + step) % CHROMATIC.length;
    notes.push(CHROMATIC[idx]);
  }
  return notes;
}

export function getScalePositions(
  root: string,
  intervals: number[] = MAJOR_INTERVALS,
  strings: number = STANDARD_TUNING.length,
  frets: number = 12
): Position[] {
  const scaleSet = new Set(buildScaleNotes(root, intervals));
  const tuning = STANDARD_TUNING.slice(0, strings);

  const pos: Position[] = [];
  tuning.forEach((openNote, stringIdx) => {
    const openIdx = CHROMATIC.indexOf(openNote);
    if (openIdx === -1) throw new Error(`Unknown tuning note: ${openNote}`);
    for (let fret = 0; fret <= frets; fret++) {
      const note = CHROMATIC[(openIdx + fret) % CHROMATIC.length];
      if (scaleSet.has(note)) {
        pos.push({ stringIdx, fret, note });
      }
    }
  });

  return pos;
}
