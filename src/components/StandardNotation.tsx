// src/components/StandardNotation.tsx
"use client";

import React, { useEffect, useRef } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
} from "vexflow";
import { Position, CHROMATIC } from "@/lib/scales";

interface StandardNotationProps {
  positions: Position[];
}

function StandardNotation({ // Changed to a named function for React.memo
  positions,
}: StandardNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // clear any previous SVG
    el.innerHTML = "";

    // measure available width
    const width = el.clientWidth;
    const height = 120;

    // create a VexFlow SVG renderer
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    // draw a stave across the full width
    const stave = new Stave(0, 0, width - 10);
    stave
      .addClef("treble")
      .setContext(context)
      .draw();

    // 1) Map each Position → { midi, key } so we can sort by pitch
    const midiNotes = positions.map(({ note, fret }) => {
      // find semitone index in CHROMATIC
      const semitone = CHROMATIC.indexOf(note);
      // base octave: assume open-string notes start in octave 4,
      // then each 12 frets is +1 octave
      const octave = 4 + Math.floor(fret / 12);
      const key = `${note.toLowerCase()}/${octave}`;
      return { midi: octave * 12 + semitone, key }; // Added midi to object for sorting
    });

    // 2) Sort, dedupe, and pull out the keys
    const sortedKeys = Array.from(
      new Map(
        midiNotes
          .sort((a, b) => a.midi - b.midi) // Sort by midi value
          .map(({ key, midi }) => [key, midi]) // Map back to [key, midi] for Map constructor
      ).keys()
    );

    // 3) Build quarter-notes for each pitch
    const notes = sortedKeys.map((key) =>
      new StaveNote({
        clef: "treble",
        keys: [key],
        duration: "q",
      })
    );

    // 4) Put them into a Voice
    const voice = new Voice({
      numBeats: notes.length,
      beatValue: 4,
    })
      .setStrict(false)
      .addTickables(notes);

    // 5) Format & draw
    new Formatter().joinVoices([voice]).format([voice], width - 20);
    voice.draw(context, stave);
  }, [positions]); // Dependency array includes positions

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ height: 120 }}
    />
  );
}

export default React.memo(StandardNotation); // Wrapped with React.memo
