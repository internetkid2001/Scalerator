// src/components/Tablature.tsx
"use client";

import React from "react";
import type { Position } from "@/lib/scales";

export interface TablatureProps {
  tuning: string[];
  strings: number;
  frets: number; // This is now total frets for consistency with positions
  positions: Position[]; // All positions on the instrument
  ascii: boolean;
  root: string;
  startFret: number; // New prop for viewport
  visibleFrets: number; // New prop for viewport
}

function Tablature({
  tuning,
  strings,
  frets: totalFrets, // Renamed for clarity
  positions,
  ascii,
  root,
  startFret,
  visibleFrets,
}: TablatureProps) {
  const slice = tuning.slice(0, strings);

  // Filter positions to only show notes within the current viewport
  const endFret = startFret + visibleFrets;
  const visiblePositions = positions.filter(
    (pos) => pos.fret >= startFret && pos.fret < endFret
  );

  // Function to check if a grid cell contains the root note within the visible range
  const isRootNoteAtPosition = (stringIdx: number, fret: number) => {
    // Invert string order for tablature display: 0 = lowest string -> bottom row
    const actualStringIdx = slice.length - 1 - stringIdx;
    return visiblePositions.some(pos =>
      pos.stringIdx === actualStringIdx &&
      pos.fret === fret &&
      pos.note === root // Check if the note is the root
    );
  };

  // Build an empty GRID of “-” for the visible frets
  const grid: string[][] = slice.map(() => Array(visibleFrets + 1).fill("-"));

  // Fill in our scale notes for the visible portion
  visiblePositions.forEach(({ stringIdx, fret }) => {
    // invert string order: 0 = lowest → bottom row
    const row = slice.length - 1 - stringIdx;
    // Adjust fret index to be relative to the startFret for display in the grid
    const displayFret = fret - startFret;
    if (row >= 0 && row < grid.length && displayFret >= 0 && displayFret <= visibleFrets) {
      grid[row][displayFret] = fret.toString(); // Display the actual fret number
    }
  });

  // Generate fret numbers for the top row of tablature
  const tablatureFretNumbers = Array.from({ length: visibleFrets + 1 }, (_, i) => startFret + i);


  if (ascii) {
    // ASCII tabs - highlighting is not straightforward without complex string manipulation
    // We'll keep it simple for now and rely on styled tabs for visual highlight
    return (
      <pre className="font-mono whitespace-pre">
        {/* Add fret numbers at the top for ASCII tablature */}
        {"  " + tablatureFretNumbers.slice(1).map(f => f.toString().padEnd(2, " ")).join("") + "\n"}
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
        <thead>
          <tr>
            <th className="pr-2 font-mono"></th> {/* Empty cell for tuning label column */}
            {tablatureFretNumbers.map((fretNum, j) => (
              <th key={`tab-fret-header-${j}`} className="w-6 h-6 border-b border-r text-center align-middle text-xs text-gray-500">
                {fretNum > 0 ? fretNum : ""} {/* Don't show 0 for open string column */}
              </th>
            ))}
          </tr>
        </thead>
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
                    (isRootNoteAtPosition(i, startFret + j) ? " bg-red-200 ring-2 ring-red-500" : "") // Red highlight for root
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
