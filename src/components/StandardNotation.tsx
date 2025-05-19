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
import { Position } from "@/lib/scales";

interface StandardNotationProps {
  positions: Position[];
}

export default function StandardNotation({
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

    // map each scale position's note to a quarter‐note on the staff
    const notes = positions.map(({ note }) => {
      // VexFlow wants lowercase + octave, e.g. "c/4"
      return new StaveNote({
        clef: "treble",
        keys: [note.toLowerCase() + "/4"],
        duration: "q",
      });
    });

    // build a voice with one beat per note (4/4 quarter‐notes)
    const voice = new Voice({
      numBeats: notes.length,
      beatValue: 4,
    });
    voice
      // allow non‐standard tick divisions
      .setStrict(false)
      .addTickables(notes);

    // format & draw the notes so they span the stave
    new Formatter()
      .joinVoices([voice])
      .format([voice], width - 20);

    voice.draw(context, stave);
  }, [positions]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ height: 120 }}
    />
  );
}
