// src/components/Tablature.tsx
"use client";

import React from "react";
import type { Position } from "@/lib/scales";

export interface TablatureProps {
  tuning: string[];        // ← new
  strings: number;
  frets: number;
  positions: Position[];
  ascii: boolean;
}

function Tablature({ // Changed to a named function for React.memo
  tuning,
  strings,
  frets,
  positions,
  ascii,
}: TablatureProps) {
  // only use as many strings as requested (clamped by incoming tuning length)
  const slice = tuning.slice(0, strings);

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
    // ASCII tabs
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
                    (cell === "-" ? "text-gray-400" : "text-black")
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

export default React.memo(Tablature); // Wrapped with React.memo
