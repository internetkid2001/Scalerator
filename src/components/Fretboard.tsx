// src/components/Fretboard.tsx
"use client";

import React, { useRef } from "react";
import Draggable from "react-draggable";
import type { Position } from "@/lib/scales";

interface FretboardProps {
  root: string; // New prop to receive the root note for highlighting
  strings?: number;
  frets?: number;
  positions: Position[];
  tuning: string[]; // New prop to receive the tuning notes
}

function Fretboard({
  root, // Destructure the root prop
  strings = 6,
  frets = 12,
  positions,
  tuning, // Destructure the tuning prop
}: FretboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center"> {/* Flex container to hold tuning labels and fretboard */}
      {/* Tuning Labels (Open String Notes) */}
      <div className="flex flex-col justify-around h-40 pr-2 text-sm font-semibold text-gray-700">
        {/* Map through the tuning notes in reverse to match fretboard string order (low to high string visually) */}
        {tuning.slice(0, strings).reverse().map((note, i) => (
          <span key={`tuning-note-${i}`} className="text-right">
            {note}
          </span>
        ))}
      </div>

      <Draggable
        axis="x"
        bounds="parent"
        nodeRef={containerRef as React.RefObject<HTMLElement>}
      >
        <div
          ref={containerRef}
          className="relative flex-grow h-40 bg-white border border-gray-300 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ minWidth: `${(frets + 1) * 2.5}rem` }} /* Ensure enough width for frets */
        >
          {/* string lines */}
          {[...Array(strings)].map((_, i) => (
            <div
              key={`string-${i}`}
              className="absolute left-0 right-0 h-px bg-gray-400"
              style={{ top: `${((i + 1) * 100) / (strings + 1)}%` }}
            />
          ))}

          {/* fret lines */}
          {[...Array(frets + 1)].map((_, f) => (
            <div
              key={`fret-${f}`}
              className="absolute top-0 bottom-0 w-px bg-gray-300"
              style={{ left: `${(f * 100) / frets}%` }}
            />
          ))}

          {/* scale notes */}
          {positions.map((position, idx) => {
            const left = (position.fret * 100) / frets;
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
      </Draggable>
    </div>
  );
}

export default React.memo(Fretboard);
