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

export default function Tablature({
  tuning,
  strings,
  frets,
  positions,
  ascii,
}: TablatureProps) {
  // only use as many strings as requested
  const slice = tuning.slice(0, strings);

  // build an empty GRID of “-”
  const grid: string[][] = slice.map(() => Array(frets + 1).fill("-"));

  // fill in our scale notes
  positions.forEach(({ stringIdx, fret }) => {
    // stringIdx is 0 = lowest, so we reverse it for tablature display
    const row = strings - 1 - stringIdx;
    grid[row][fret] = fret.toString();
  });

  if (ascii) {
    // ASCII tabs
    return (
      <pre className="font-mono">
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
