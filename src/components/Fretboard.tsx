"use client";

import { useRef } from "react";
import Draggable from "react-draggable";
import { Position } from "@/lib/scales";

interface FretboardProps {
  strings?: number;
  frets?: number;
  positions: Position[];
}

const Fretboard = ({ strings = 6, frets = 12, positions }: FretboardProps) => {
  // use a non-null asserted div ref so Draggable.nodeRef matches RefObject<HTMLElement>
  const containerRef = useRef<HTMLDivElement>(null!);

  return (
    <Draggable nodeRef={containerRef} axis="x" bounds="parent">
      <div
        ref={containerRef}
        className="relative w-full max-w-3xl h-40 bg-gray-100 border border-gray-300 rounded-lg overflow-hidden"
      >
        {/* string lines */}
        {[...Array(strings)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-gray-400"
            style={{ top: `${((i + 1) * 100) / (strings + 1)}%` }}
          />
        ))}

        {/* fret markers */}
        {[...Array(frets + 1)].map((_, f) => (
          <div
            key={f}
            className="absolute top-0 bottom-0 w-px bg-gray-300"
            style={{ left: `${(f * 100) / frets}%` }}
          />
        ))}

        {/* note markers */}
        {positions.map(({ stringIdx, fret, note }, idx) => (
          <div
            key={idx}
            className={`absolute w-4 h-4 rounded-full ${
              note === "C" ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{
              left: `${(fret * 100) / frets}%`,
              top: `${((stringIdx + 1) * 100) / (strings + 1)}%`,
              transform: "translate(-50%,-50%)",
            }}
          />
        ))}
      </div>
    </Draggable>
  );
};

export default Fretboard;
