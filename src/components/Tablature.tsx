// src/components/Tablature.tsx
"use client";

import React from "react";
import type { Position } from "@/lib/scales";
import { playNote } from "@/lib/audio"; // Import playNote

export interface TablatureProps {
  tuning: string[] | undefined | null; // Explicitly allow undefined/null for defensive coding
  strings: number;
  frets: number;
  positions: Position[];
  ascii: boolean;
  root: string;
  startFret: number;
  visibleFrets: number;
}

function Tablature({
  tuning,
  strings,
  frets: totalFrets,
  positions,
  ascii,
  root,
  startFret,
  visibleFrets,
}: TablatureProps) {
  // Defensive check: Ensure tuning is an array. If not, default to an empty array.
  // This is the most robust way to ensure 'tuning' is always an array before any operations.
  const safeTuning = tuning === undefined || tuning === null ? [] : tuning;
  const slice = safeTuning.slice(0, strings);


  const endFret = startFret + visibleFrets;
  // Ensure positions is an array before filtering
  const safePositions = Array.isArray(positions) ? positions : [];
  const visiblePositions = safePositions.filter(
    (pos) => pos.fret >= startFret && pos.fret < endFret
  );

  const isRootNoteAtPosition = (stringIdx: number, fret: number) => {
    const actualStringIdx = slice.length - 1 - stringIdx;
    return visiblePositions.some(pos =>
      pos.stringIdx === actualStringIdx &&
      pos.fret === fret &&
      pos.note === root
    );
  };

  const grid: string[][] = slice.map(() => Array(visibleFrets + 1).fill("-"));

  visiblePositions.forEach(({ stringIdx, fret }) => {
    const row = slice.length - 1 - stringIdx;
    const displayFret = fret - startFret;
    if (row >= 0 && row < grid.length && displayFret >= 0 && displayFret <= visibleFrets) {
      grid[row][displayFret] = fret.toString();
    }
  });

  const tablatureFretNumbers = Array.from({ length: visibleFrets + 1 }, (_, i) => startFret + i);


  if (ascii) {
    return (
      <pre className="font-mono whitespace-pre">
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
    return (
      <table className="table-auto border-collapse">
        <thead>
          <tr>
            <th className="pr-2 font-mono"></th>
            {tablatureFretNumbers.map((fretNum, j) => (
              <th key={`tab-fret-header-${j}`} className="w-6 h-6 border-b border-r text-center align-middle text-xs text-gray-500">
                {fretNum > 0 ? fretNum : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slice.map((open, i) => (
            <tr key={i}>
              <td className="pr-2 font-mono">{open}|</td>
              {grid[i].map((cell, j) => {
                const actualFret = startFret + j;
                const actualStringIdx = slice.length - 1 - i;
                // Find the original position object to get the note name
                const notePosition = safePositions.find(pos => pos.stringIdx === actualStringIdx && pos.fret === actualFret);
                const noteNameWithOctave = notePosition ? notePosition.note + (4 + Math.floor(notePosition.fret / 12)) : null;

                return (
                  <td
                    key={j}
                    className={ // Corrected 'classNam' to 'className'
                      "w-6 h-6 border-t border-r text-center align-middle " +
                      (cell === "-" ? "text-gray-400" : "text-black") +
                      (isRootNoteAtPosition(i, actualFret) ? " bg-red-200 ring-2 ring-red-500" : "") +
                      (noteNameWithOctave ? " cursor-pointer" : "") // Add cursor pointer if playable
                    }
                    onClick={() => noteNameWithOctave && playNote(noteNameWithOctave)} // Play note if exists
                  >
                    {cell === "-" ? "" : <span className="font-semibold">{cell}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

export default React.memo(Tablature);
