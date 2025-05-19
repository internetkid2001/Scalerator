"use client";
import { useState } from "react";
import { getScalePositions } from "@/lib/scales";
import Fretboard from "@/components/Fretboard";
import Tablature from "@/components/Tablature";

export default function Home() {
  const [strings, setStrings] = useState(6);
  const [frets, setFrets] = useState(12);
  const [ascii, setAscii] = useState(true);

  // always C-major for now:
  const positions = getScalePositions("C", undefined, strings, frets);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Scalerator</h1>

      <div className="flex items-center space-x-6 mb-4">
        <div>
          <span className="mr-2">Strings:</span>
          <button
            onClick={() => setStrings((s) => Math.max(1, s - 1))}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            –
          </button>
          <span className="mx-2">{strings}</span>
          <button
            onClick={() => setStrings((s) => s + 1)}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            +
          </button>
        </div>

        <div>
          <span className="mr-2">Frets:</span>
          <button
            onClick={() => setFrets((f) => Math.max(0, f - 1))}
            className="px-2 py-1 bg-green-600 text-white rounded"
          >
            –
          </button>
          <span className="mx-2">{frets}</span>
          <button
            onClick={() => setFrets((f) => f + 1)}
            className="px-2 py-1 bg-green-600 text-white rounded"
          >
            +
          </button>
        </div>

        <button
          onClick={() => setAscii((a) => !a)}
          className="px-3 py-1 border rounded"
        >
          {ascii ? "ASCII Tabs" : "Styled Tabs"}
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <Fretboard strings={strings} frets={frets} positions={positions} />
      </div>

      <Tablature
        strings={strings}
        frets={frets}
        positions={positions}
        ascii={ascii}
      />
    </main>
  );
}
