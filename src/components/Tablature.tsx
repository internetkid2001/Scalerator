// src/components/Tablature.tsx
"use client";

import React from "react";
import type { Position } from "@/lib/scales";

export interface TablatureProps {
  tuning: string[];
  strings: number;
  frets: number;
  positions: Position[];
  ascii: boolean;
  root: string; // New prop to receive the root note for highlighting
}

function Tablature({
  tuning,
  strings,
  frets,
  positions,
  ascii,
  root, // Destructure the root prop
}: TablatureProps) {
  const slice = tuning.slice(0, strings);

  // Function to check if a grid cell contains the root note
  const isRootNoteAtPosition = (stringIdx: number, fret: number) => {
    // Invert string order for tablature display: 0 = lowest string -> bottom row
    const actualStringIdx = slice.length - 1 - stringIdx;
    return positions.some(pos =>
      pos.stringIdx === actualStringIdx &&
      pos.fret === fret &&
      pos.note === root // Check if the note is the root
    );
  };

  // build an empty GRID of “-”
  const grid: string[][] = slice.map(() => Array(frets + 1).fill("-"));

  // fill in our scale notes
  positions.forEach(({ stringIdx, fret }) => {
    // invert string order: 0 = lowest → bottom row
    const row = slice.length - 1 - stringIdx;
    if (row >= 0 && row < grid.length && fret <= frets) {
      grid[row][fret] = fret.toString();
    }
  });

  if (ascii) {
    // ASCII tabs - highlighting is not straightforward without complex string manipulation
    // We'll keep it simple for now and rely on styled tabs for visual highlight
    return (
      <pre className="font-mono whitespace-pre">
        {slice
          .map((open, i) => {
            const label = open.padEnd(2, "|");
            return label + grid[i].join("-");
          })
          .join("\n")}
      </pre>
    );
  } else {
    // Styled HTML tabs
    return (
      <table className="table-auto border-collapse">
        <tbody>
          {slice.map((open, i) => (
            <tr key={i}>
              <td className="pr-2 font-mono">{open}|</td>
              {grid[i].map((cell, j) => (
                <td
                  key={j}
                  className={
                    "w-6 h-6 border-t border-r text-center align-middle " +
                    (cell === "-" ? "text-gray-400" : "text-black") +
                    (isRootNoteAtPosition(i, j) ? " bg-red-200 ring-2 ring-red-500" : "") // Red highlight for root
                  }
                >
                  {cell === "-" ? "" : <span className="font-semibold">{cell}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

export default React.memo(Tablature);
