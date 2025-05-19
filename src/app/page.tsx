"use client";

import { useState } from "react";
import { getScalePositions } from "@/lib/scales";
import Fretboard from "@/components/Fretboard";
import Tablature from "@/components/Tablature";
import StandardNotation from "@/components/StandardNotation";

export default function Home() {
  const [strings, setStrings] = useState(6);
  const [frets, setFrets] = useState(12);
  const [ascii, setAscii] = useState(true);
  const root = "C"; // you can make this dynamic later

  // compute all the positions for this scale
  const positions = getScalePositions(root, undefined, strings, frets);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Scalerator</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Strings */}
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
            onClick={() => setStrings((s) => s + 1)}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            +
          </button>
        </div>

        {/* Frets */}
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

        {/* Tabs Toggle */}
        <button
          onClick={() => setAscii((a) => !a)}
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
        />
      </div>

      {/* Tablature */}
      <div className="w-full overflow-x-auto">
        <Tablature
          strings={strings}
          frets={frets}
          positions={positions}
          ascii={ascii}
        />
      </div>

      {/* Standard Notation */}
      <div className="w-full overflow-x-auto">
        <StandardNotation positions={positions} />
      </div>
    </main>
  );
}
