// src/app/page.tsx
"use client";

import { useState } from "react";
import { TUNINGS, getScalePositions } from "@/lib/scales";
import Fretboard from "@/components/Fretboard";
import Tablature from "@/components/Tablature";
import StandardNotation from "@/components/StandardNotation";

// Derive a TypeScript type from the keys of our TUNINGS object
type TuningName = keyof typeof TUNINGS;

export default function Home() {
  // Value-level list of tunings
  const tuningNames = Object.keys(TUNINGS) as TuningName[];

  // State, now correctly typed
  const [tuningName, setTuningName] = useState<TuningName>(tuningNames[0]);
  const [strings, setStrings] = useState(TUNINGS[tuningName].length);
  const [frets, setFrets] = useState(12);
  const [ascii, setAscii] = useState(true);

  // Compute current tuning slice and scale positions
  const tuning = TUNINGS[tuningName].slice(0, strings);
  const positions = getScalePositions("C", undefined, tuning, frets);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Scalerator</h1>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-6">
        {/* tuning selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="tuning-select">Tuning:</label>
          <select
            id="tuning-select"
            value={tuningName}
            onChange={(e) => {
              const name = e.target.value as TuningName;
              setTuningName(name);
              setStrings(TUNINGS[name].length);
            }}
            className="border px-2 py-1 rounded"
          >
            {tuningNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* strings */}
        <div className="flex items-center space-x-2">
          <span>Strings:</span>
          <button
            onClick={() => setStrings((s) => Math.max(1, s - 1))}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            –
          </button>
          <span className="w-6 text-center">{strings}</span>
          <button
            onClick={() =>
              setStrings((s) => Math.min(TUNINGS[tuningName].length, s + 1))
            }
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            +
          </button>
        </div>

        {/* frets */}
        <div className="flex items-center space-x-2">
          <span>Frets:</span>
          <button
            onClick={() => setFrets((f) => Math.max(0, f - 1))}
            className="px-2 py-1 bg-green-600 text-white rounded"
          >
            –
          </button>
          <span className="w-6 text-center">{frets}</span>
          <button
            onClick={() => setFrets((f) => f + 1)}
            className="px-2 py-1 bg-green-600 text-white rounded"
          >
            +
          </button>
        </div>

        {/* tabs toggle */}
        <button
          onClick={() => setAscii((a) => !a)}
          className="px-3 py-1 border rounded"
        >
          {ascii ? "ASCII Tabs" : "Styled Tabs"}
        </button>
      </div>

      {/* fretboard */}
      <div className="w-full overflow-x-auto">
        <Fretboard
          root="C"
          strings={strings}
          frets={frets}
          positions={positions}
        />
      </div>

      {/* tablature */}
      <div className="w-full overflow-x-auto">
        <Tablature
          tuning={tuning}
          strings={strings}
          frets={frets}
          positions={positions}
          ascii={ascii}
        />
      </div>

      {/* standard notation */}
      <div className="w-full overflow-x-auto">
        <StandardNotation positions={positions} />
      </div>
    </main>
  );
}
