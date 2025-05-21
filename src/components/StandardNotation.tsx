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
  root: string; // New prop to receive the root note for highlighting
}

function StandardNotation({
  positions,
  root, // Destructure the root prop
}: StandardNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Clear any previous SVG content to ensure a clean redraw
    el.innerHTML = "";

    // Measure available width
    const width = el.clientWidth;
    const height = 120;

    // Create a VexFlow SVG renderer
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    // Draw a stave across the full width
    const stave = new Stave(0, 0, width - 10);
    stave
      .addClef("treble")
      .setContext(context)
      .draw();

    // 1) Map each Position → { midi, key, originalPosition } so we can sort by pitch and link back
    const midiNotesWithPositions = positions.map((pos) => {
      // Find semitone index in CHROMATIC
      const semitone = CHROMATIC.indexOf(pos.note);
      // Base octave: assume open-string notes start in octave 4,
      // then each 12 frets is +1 octave
      const octave = 4 + Math.floor(pos.fret / 12);
      const midi = octave * 12 + semitone;
      const key = `${pos.note.toLowerCase()}/${octave}`;
      return { midi, key, originalPosition: pos };
    });

    // 2) Sort, dedupe, and pull out the unique keys and their associated original positions
    // We need to ensure that if multiple fretboard positions map to the same standard note (e.g., C4 on different strings),
    // we still associate the original position with the note for highlighting purposes.
    // To do this, we'll keep track of all original positions that map to a unique note.
    const uniqueNotesMap = new Map<string, { midi: number, originalPositions: Position[] }>();
    midiNotesWithPositions
      .sort((a, b) => a.midi - b.midi)
      .forEach(({ key, midi, originalPosition }) => {
        if (!uniqueNotesMap.has(key)) {
          uniqueNotesMap.set(key, { midi, originalPositions: [] });
        }
        uniqueNotesMap.get(key)!.originalPositions.push(originalPosition);
      });

    const sortedUniqueNotes = Array.from(uniqueNotesMap.entries())
      .sort(([, a], [, b]) => a.midi - b.midi) // Sort unique notes by midi value
      .map(([key, { originalPositions }]) => ({ key, originalPositions }));


    // 3) Build quarter-notes for each pitch and apply highlighting
    const notes = sortedUniqueNotes.map(({ key, originalPositions }) => {
      const staveNote = new StaveNote({
        clef: "treble",
        keys: [key],
        duration: "q",
      });

      // Check if this note is the root note of the scale
      // We compare the note name from the original position with the root prop
      const isRootNote = originalPositions.some(pos => pos.note === root);

      if (isRootNote) {
        // Apply red color to the note head and stem
        staveNote.setStyle({ fillStyle: "red", strokeStyle: "red" });
      }

      return staveNote;
    });

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
  }, [positions, root]); // Dependency array now includes root instead of highlightedPosition

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ height: 120 }}
    />
  );
}

export default React.memo(StandardNotation);
