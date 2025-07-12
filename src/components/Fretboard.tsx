// src/components/Fretboard.tsx
"use client";

import React from "react";
import type { Position } from "@/lib/scales";
import { playNote } from "@/lib/audio"; // Import playNote

interface FretboardProps {
  root: string;
  strings?: number;
  totalFrets: number;
  visibleFrets?: number;
  startFret: number;
  positions: Position[] | undefined | null; // Explicitly allow undefined/null
  tuning: string[] | undefined | null; // Explicitly allow undefined/null
}

function Fretboard({
  root,
  strings = 6,
  visibleFrets = 12,
  startFret,
  positions,
  tuning,
}: Omit<FretboardProps, 'totalFrets'>) {
  // Defensive checks: Ensure tuning and positions are arrays
  const safeTuning = Array.isArray(tuning) ? tuning : [];
  const safePositions = Array.isArray(positions) ? positions : [];

  const endFret = startFret + visibleFrets;

  const visiblePositions = safePositions.filter(
    (pos) => pos.fret >= startFret && pos.fret < endFret
  );

  const fretsToRender = Array.from({ length: visibleFrets + 1 }, (_, i) => startFret + i);

  return (
    <div className="flex items-center">
      {/* Tuning Labels (Open String Notes) */}
      <div className="flex flex-col justify-around h-40 pr-2 text-sm font-semibold text-gray-700">
        {safeTuning.slice(0, strings).reverse().map((note, i) => (
          <span key={`tuning-note-${i}`} className="text-right">
            {note}
          </span>
        ))}
      </div>

      {/* Fretboard Display Area (no longer directly draggable) */}
      <div
        className="relative flex-grow h-40 bg-white border border-gray-300 rounded-lg overflow-hidden"
        style={{ minWidth: `${(visibleFrets + 1) * 2.5}rem` }}
      >
        {/* Fret numbers at the top */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-around items-center text-xs text-gray-500">
          {fretsToRender.slice(1).map((fretNum) => (
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
          const left = ((position.fret - startFret) * 100) / visibleFrets;
          const top = ((position.stringIdx + 1) * 100) / (strings + 1);

          const isRootNote = position.note === root;

          const noteStyleClasses = isRootNote
            ? "bg-red-500 ring-4 ring-red-700"
            : "bg-blue-500";

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
                cursor: "pointer", // Add cursor pointer to indicate clickability
              }}
              onClick={() => playNote(position.note + (4 + Math.floor(position.fret / 12)))} // Play the note on click
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
