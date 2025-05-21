// src/components/Fretboard.tsx
"use client";

import React, { useRef } from "react";
import Draggable from "react-draggable";
import type { Position } from "@/lib/scales";

interface FretboardProps {
  root: string;
  strings?: number;
  frets?: number;
  positions: Position[];
}

function Fretboard({
  root,
  strings = 6,
  frets = 12,
  positions,
}: FretboardProps) {
  // still a div-ref
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      axis="x"
      bounds="parent"
      // cast here so TS sees RefObject<HTMLElement>
      nodeRef={containerRef as React.RefObject<HTMLElement>}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-3xl h-40 bg-white border border-gray-300 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing" // Added cursor styles
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
        {positions.map(({ stringIdx, fret, note }, idx) => {
          const left = (fret * 100) / frets;
          const top = ((stringIdx + 1) * 100) / (strings + 1);

          return (
            <div
              key={idx}
              className="absolute bg-blue-500 text-white text-xs flex items-center justify-center rounded-full"
              style={{
                width: "1.5rem",
                height: "1.5rem",
                left: `${left}%`,
                top: `${top}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {note}
            </div>
          );
        })}
      </div>
    </Draggable>
  );
}

export default React.memo(Fretboard); // Wrapped with React.memo
