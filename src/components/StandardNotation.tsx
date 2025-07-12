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
import { Position, CHROMATIC, getNoteWithOctave } from "@/lib/scales"; // Import getNoteWithOctave
import { playNote } from "@/lib/audio"; // Import playNote

interface StandardNotationProps {
  positions: Position[] | undefined | null; // Explicitly allow undefined/null
  root: string;
  startFret: number;
  visibleFrets: number;
  tuning: string[] | undefined | null; // Added tuning prop
}

function StandardNotation({
  positions,
  root,
  startFret,
  visibleFrets,
  tuning, // Destructure tuning
}: StandardNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Defensive check: Ensure positions and tuning are arrays
    const currentPositions = Array.isArray(positions) ? positions : [];
    const currentTuning = Array.isArray(tuning) ? tuning : [];

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

    // Filter positions to only include notes within the current viewport
    const endFret = startFret + visibleFrets;
    const visiblePositions = currentPositions.filter(
      (pos) => pos.fret >= startFret && pos.fret < endFret
    );

    // 1) Map each visible Position → { midi, key, originalPosition }
    const midiNotesWithPositions = visiblePositions.map((pos) => {
        // Get the open string note for this position's string
      const openStringNote = currentTuning[pos.stringIdx];

      // Use getNoteWithOctave for accurate octave calculation
      const noteNameWithOctave = openStringNote ? getNoteWithOctave(pos.note, pos.fret, openStringNote) : pos.note; // Fallback if openStringNote is missing

      // Parse the octave from the full note name for MIDI calculation
      const octavePart = parseInt(noteNameWithOctave.match(/\d+$/)?.[0] || '4', 10); // Default to octave 4 if not found
      const baseNotePart = noteNameWithOctave.replace(/\d+$/, '');

      const midi = (octavePart + 1) * 12 + CHROMATIC.indexOf(baseNotePart); // Correct MIDI calculation
      const key = `${baseNotePart.toLowerCase()}/${octavePart}`;

      return { midi, key, originalPosition: pos, noteNameWithOctave: noteNameWithOctave };
    });

    // 2) Sort, dedupe, and pull out the unique keys and their associated original positions
    const uniqueNotesMap = new Map<string, { midi: number, originalPositions: Position[], noteNameWithOctave: string }>();
    midiNotesWithPositions
      .sort((a, b) => a.midi - b.midi)
      .forEach(({ key, midi, originalPosition, noteNameWithOctave }) => {
        if (!uniqueNotesMap.has(key)) {
          uniqueNotesMap.set(key, { midi, originalPositions: [], noteNameWithOctave });
        }
        uniqueNotesMap.get(key)!.originalPositions.push(originalPosition);
      });

    const sortedUniqueNotes = Array.from(uniqueNotesMap.entries())
      .sort(([, a], [, b]) => a.midi - b.midi)
      .map(([key, { originalPositions, noteNameWithOctave }]) => ({ key, originalPositions, noteNameWithOctave }));


    // 3) Build quarter-notes for each pitch and apply highlighting
    const notes = sortedUniqueNotes.map(({ key, originalPositions, noteNameWithOctave }) => {
      const staveNote = new StaveNote({
        clef: "treble",
        keys: [key],
        duration: "q",
      });

      const isRootNote = originalPositions.some(pos => pos.note === root);

      if (isRootNote) {
        staveNote.setStyle({ fillStyle: "red", strokeStyle: "red" });
      }

      // Attach data for click handler
      (staveNote as { userData?: { noteNameWithOctave: string } }).userData = { noteNameWithOctave };

      return staveNote;
    });

    const voice = new Voice({
      numBeats: notes.length,
      beatValue: 4,
    })
      .setStrict(false)
      .addTickables(notes);

    new Formatter().joinVoices([voice]).format([voice], width - 20);
    voice.draw(context, stave);

    // After drawing, attach click listeners to the rendered SVG elements
    notes.forEach(note => {
      const svgElement = note.getSVGElement();
      const noteWithUserData = note as { userData?: { noteNameWithOctave: string } };
      if (svgElement && noteWithUserData.userData?.noteNameWithOctave) {
        svgElement.style.cursor = 'pointer'; // Add pointer cursor
        svgElement.onclick = () => {
          playNote(noteWithUserData.userData!.noteNameWithOctave);
        };
      }
    });

  }, [positions, root, startFret, visibleFrets, tuning]); // Add tuning to dependencies

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ height: 120 }}
    />
  );
}

export default React.memo(StandardNotation);
