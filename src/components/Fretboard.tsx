// src/components/Fretboard.tsx
"use client";

import React, { useRef, useState } from "react";
import Draggable from "react-draggable";
import type { Position } from "@/lib/scales";

interface FretboardProps {
  root: string;
  strings?: number;
  frets?: number;
  positions: Position[];
}

const SIZE_PRESETS = {
  small:  { height: 200, maxWidthPct: 0.5 },
  medium: { height: 240, maxWidthPct: 0.75 },
  large:  { height: 300, maxWidthPct: 0.95 },
} as const;
type SizeKey = keyof typeof SIZE_PRESETS;

export default function Fretboard({
  root,
  strings = 6,
  frets = 12,
  positions,
}: FretboardProps) {
  // ref for Draggable
  const containerRef = useRef<HTMLDivElement>(null);

  // new internal size state
  const [size, setSize] = useState<SizeKey>("medium");
  const { height, maxWidthPct } = SIZE_PRESETS[size];

  return (
    <div className="space-y-2">
      {/* size selector */}
      <div className="flex justify-center space-x-2">
        {(Object.keys(SIZE_PRESETS) as SizeKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`px-3 py-1 border rounded ${
              size === s ? "bg-gray-800 text-white" : "bg-white"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* draggable fretboard */}
      <Draggable
        axis="x"
        bounds="parent"
        nodeRef={containerRef as React.RefObject<HTMLElement>}
      >
        <div
          ref={containerRef}
          className="relative mx-auto border border-gray-300 rounded-lg overflow-hidden bg-white"
          style={{
            height,
            width: `${maxWidthPct * 100}%`,
            minWidth: "600px",
          }}
        >
          {/* string lines */}
          {[...Array(strings)].map((_, i) => (
            <div
              key={`string-${i}`}
              className="absolute left-0 right-0 bg-gray-400"
              style={{
                height: "1px",
                top: `${((i + 1) * 100) / (strings + 1)}%`,
              }}
            />
          ))}

          {/* fret lines */}
          {[...Array(frets + 1)].map((_, f) => (
            <div
              key={`fret-${f}`}
              className="absolute top-0 bottom-0 bg-gray-300"
              style={{
                width: "1px",
                left: `${(f * 100) / frets}%`,
              }}
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
                  width: "1.8rem",
                  height: "1.8rem",
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
    </div>
  );
}
