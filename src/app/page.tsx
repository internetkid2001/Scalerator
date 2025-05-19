// src/app/page.tsx
"use client";

import { useState, useMemo } from "react";
import { TUNINGS, getScalePositions } from "@/lib/scales";
import Fretboard from "@/components/Fretboard";
import Tablature from "@/components/Tablature";
import StandardNotation from "@/components/StandardNotation";

// All possible roots
const ROOTS = [
  "A","A#","B","C","C#","D","D#","E","F","F#","G","G#",
] as const;
type Root = typeof ROOTS[number];

// Scale formulas as semitone intervals from the root
const SCALE_FORMULAS: Record<string, number[]> = {
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

type ScaleName = keyof typeof SCALE_FORMULAS;
type TuningName = keyof typeof TUNINGS;
type SizeKey = "small" | "medium" | "large";

export default function Home() {
  // --- scale dropdowns ---
  const [root, setRoot]                 = useState<Root>("C");
  const [scaleName, setScaleName]       = useState<ScaleName>("major");
  const intervals = useMemo(() => SCALE_FORMULAS[scaleName], [scaleName]);

  // --- tuning dropdown ---
  const tuningNames = Object.keys(TUNINGS) as TuningName[];
  const [tuningName, setTuningName] = useState<TuningName>(tuningNames[0]);

  // --- strings / frets / ascii toggle / size ---
  const [strings, setStrings] = useState(TUNINGS[tuningName].length);
  const [frets, setFrets]     = useState(12);
  const [ascii, setAscii]     = useState(true);
  const [size, setSize]       = useState<SizeKey>("medium");

  // recompute tuning slice & positions
  const tuning = useMemo(() => TUNINGS[tuningName].slice(0, strings), [tuningName, strings]);
  const positions = useMemo(
    () => getScalePositions(root, intervals, tuning, frets),
    [root, intervals, tuning, frets]
  );

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Scalerator</h1>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Root */}
        <div className="flex items-center space-x-2">
          <label htmlFor="root-select">Root:</label>
          <select
            id="root-select"
            value={root}
            onChange={e => setRoot(e.target.value as Root)}
            className="border px-2 py-1 rounded"
          >
            {ROOTS.map(r => (
              <option key={r} value={r}>{r.replace("#","♯")}</option>
            ))}
          </select>
        </div>

        {/* Scale */}
        <div className="flex items-center space-x-2">
          <label htmlFor="scale-select">Scale:</label>
          <select
            id="scale-select"
            value={scaleName}
            onChange={e => setScaleName(e.target.value as ScaleName)}
            className="border px-2 py-1 rounded"
          >
            {Object.keys(SCALE_FORMULAS).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Tuning */}
        <div className="flex items-center space-x-2">
          <label htmlFor="tuning-select">Tuning:</label>
          <select
            id="tuning-select"
            value={tuningName}
            onChange={e => {
              const nm = e.target.value as TuningName;
              setTuningName(nm);
              setStrings(TUNINGS[nm].length);
            }}
            className="border px-2 py-1 rounded"
          >
            {tuningNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Strings */}
        <div className="flex items-center space-x-2">
          <span>Strings:</span>
          <button onClick={() => setStrings(s => Math.max(1, s - 1))}
                  className="px-2 py-1 bg-blue-600 text-white rounded">–</button>
          <span className="w-6 text-center">{strings}</span>
          <button onClick={() => setStrings(s => Math.min(TUNINGS[tuningName].length, s + 1))}
                  className="px-2 py-1 bg-blue-600 text-white rounded">+</button>
        </div>

        {/* Frets */}
        <div className="flex items-center space-x-2">
          <span>Frets:</span>
          <button onClick={() => setFrets(f => Math.max(0, f - 1))}
                  className="px-2 py-1 bg-green-600 text-white rounded">–</button>
          <span className="w-6 text-center">{frets}</span>
          <button onClick={() => setFrets(f => f + 1)}
                  className="px-2 py-1 bg-green-600 text-white rounded">+</button>
        </div>

        {/* ASCII ↔ Styled Tabs */}
        <button
          onClick={() => setAscii(a => !a)}
          className="px-3 py-1 border rounded"
        >
          {ascii ? "ASCII Tabs" : "Styled Tabs"}
        </button>
      </div>

      {/* Fretboard */}
      <div className="w-full overflow-x-auto">
        <Fretboard
          root={root}
          strings={strings}
          frets={frets}
          positions={positions}
          size={size}
        />
      </div>

      {/* Tablature */}
      <div className="w-full overflow-x-auto">
        <Tablature
          tuning={tuning}
          strings={strings}
          frets={frets}
          positions={positions}
          ascii={ascii}
        />
      </div>

      {/* Standard notation */}
      <div className="w-full overflow-x-auto">
        <StandardNotation positions={positions} />
      </div>
    </main>
  );
}
