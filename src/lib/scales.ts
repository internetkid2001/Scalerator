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
  // …feel free to add more
};

// 3) major scale intervals
export const MAJOR_INTERVALS = [2, 2, 1, 2, 2, 2, 1];

export interface Position {
  stringIdx: number;   // 0 = lowest string
  fret:      number;   // 0 = open
  note:      string;   // pitch name
}

export function buildScaleNotes(
  root: string,
  intervals: number[] = MAJOR_INTERVALS
): string[] {
  const notes = [root];
  let idx = CHROMATIC.indexOf(root);
  if (idx < 0) throw new Error(`Unknown root: ${root}`);
  for (const step of intervals) {
    idx = (idx + step) % CHROMATIC.length;
    notes.push(CHROMATIC[idx]);
  }
  return notes;
}

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
    if (openIdx < 0) throw new Error(`Unknown tuning note: ${openNote}`);
    for (let fret = 0; fret <= frets; fret++) {
      const note = CHROMATIC[(openIdx + fret) % CHROMATIC.length];
      if (scaleSet.has(note)) {
        positions.push({ stringIdx, fret, note });
      }
    }
  });

  return positions;
}
