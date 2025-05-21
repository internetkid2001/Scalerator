// src/components/Fretboard.tsx
"use client";

import React from "react";
import type { Position } from "@/lib/scales";

interface FretboardProps {
  root: string;
  strings?: number;
  totalFrets: number; // Total frets on the instrument (e.g., 24)
  visibleFrets?: number; // Number of frets visible in the viewport (e.g., 12)
  startFret: number; // The first fret visible in the viewport
  positions: Position[];
  tuning: string[];
}

function Fretboard({
  root,
  strings = 6,
  totalFrets, // Use totalFrets here
  visibleFrets = 12, // Default to 12 visible frets
  startFret,
  positions,
  tuning,
}: FretboardProps) {
  // Calculate the end fret for the current viewport
  const endFret = startFret + visibleFrets;

  // Filter positions to only show notes within the current viewport
  const visiblePositions = positions.filter(
    (pos) => pos.fret >= startFret && pos.fret < endFret
  );

  // Generate an array of visible fret numbers for rendering
  const fretsToRender = Array.from({ length: visibleFrets + 1 }, (_, i) => startFret + i);

  return (
    <div className="flex items-center">
      {/* Tuning Labels (Open String Notes) */}
      <div className="flex flex-col justify-around h-40 pr-2 text-sm font-semibold text-gray-700">
        {tuning.slice(0, strings).reverse().map((note, i) => (
          <span key={`tuning-note-${i}`} className="text-right">
            {note}
          </span>
        ))}
      </div>

      {/* Fretboard Display Area (no longer directly draggable) */}
      <div
        className="relative flex-grow h-40 bg-white border border-gray-300 rounded-lg overflow-hidden"
        style={{ minWidth: `${(visibleFrets + 1) * 2.5}rem` }} // Adjust minWidth based on visibleFrets
      >
        {/* Fret numbers at the top */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-around items-center text-xs text-gray-500">
          {fretsToRender.slice(1).map((fretNum) => ( // Exclude fret 0 for top labels
            <span key={`fret-label-${fretNum}`} style={{ width: `${100 / visibleFrets}%` }}>
              {fretNum}
            </span>
          ))}
        </div>

        {/* string lines */}
        {[...Array(strings)].map((_, i) => (
          <div
            key={`string-${i}`}
            className="absolute left-0 right-0 h-px bg-gray-400"
            style={{ top: `${((i + 1) * 100) / (strings + 1)}%` }}
          />
        ))}

        {/* fret lines */}
        {fretsToRender.map((fretNum) => (
          <div
            key={`fret-line-${fretNum}`}
            className="absolute top-0 bottom-0 w-px bg-gray-300"
            style={{ left: `${((fretNum - startFret) * 100) / visibleFrets}%` }}
          />
        ))}

        {/* scale notes */}
        {visiblePositions.map((position, idx) => {
          // Calculate note position relative to the startFret
          const left = ((position.fret - startFret) * 100) / visibleFrets;
          const top = ((position.stringIdx + 1) * 100) / (strings + 1);

          // Determine if the current note is the root note
          const isRootNote = position.note === root;

          const noteStyleClasses = isRootNote
            ? "bg-red-500 ring-4 ring-red-700" // Red highlight for root
            : "bg-blue-500"; // Default blue

          return (
            <div
              key={idx}
              className={`absolute text-white text-xs flex items-center justify-center rounded-full transition-all duration-100 ease-in-out ${noteStyleClasses}`}
              style={{
                width: "1.5rem",
                height: "1.5rem",
                left: `${left}%`,
                top: `${top}%`,
                transform: "translate(-50%, -50%)",
              }}
              aria-label={`Note ${position.note} at string ${position.stringIdx + 1}, fret ${position.fret}`}
            >
              {position.note}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(Fretboard);
