// src/app/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { TUNINGS, SCALE_FORMULAS, getScalePositions, CHROMATIC, parseCustomTuning, parseCustomIntervals, Position } from "@/lib/scales";
import Fretboard from "@/components/Fretboard";
import Tablature from "@/components/Tablature";
import StandardNotation from "@/components/StandardNotation";
import { playNote } from "@/lib/audio"; // Import playNote for playing the whole scale

// All possible roots - derived directly from CHROMATIC for consistency
const ROOTS = CHROMATIC.map(note => note) as readonly string[];
type Root = typeof ROOTS[number];

type ScaleName = keyof typeof SCALE_FORMULAS | "Custom";
type TuningName = keyof typeof TUNINGS | "Custom";

// Constants for fretboard dimensions
const TOTAL_INSTRUMENT_FRETS = 24; // Maximum frets on the instrument
const DEFAULT_VISIBLE_FRETS = 12; // How many frets are visible at once
const MIN_FRETS = 0; // Fret 0 is open string
const MAX_FRETS = 24; // A reasonable maximum for visualization

export default function Home() {
  // --- scale dropdowns ---
  const [root, setRoot] = useState<Root>("C");
  const [scaleName, setScaleName] = useState<ScaleName>("major");
  const [customScaleIntervalsString, setCustomScaleIntervalsString] = useState("2,2,1,2,2,2,1");
  const [scaleError, setScaleError] = useState<string | null>(null);

  // --- tuning dropdown ---
  const tuningNames = Object.keys(TUNINGS) as TuningName[];
  const [tuningName, setTuningName] = useState<TuningName>(tuningNames[0]);
  const [customTuningString, setCustomTuningString] = useState("E,A,D,G,B,E");
  const [tuningError, setTuningError] = useState<string | null>(null);

  // --- strings / frets / ascii toggle ---
  const [strings, setStrings] = useState(TUNINGS[tuningNames[0]].length); // Initialize with default tuning's string count
  const [visibleFrets, setVisibleFrets] = useState(DEFAULT_VISIBLE_FRETS); // Number of frets visible at once
  const [startFret, setStartFret] = useState(0); // The starting fret for the viewport
  const [ascii, setAscii] = useState(true);

  // Ref for the draggable element's parent bounds
  const draggableTrackRef = useRef<HTMLDivElement>(null);
  // Ref for the draggable element itself
  const draggableHandleRef = useRef<HTMLDivElement>(null);

  // State for the info dropdown
  const [isInfoOpen, setIsInfoOpen] = useState(false);


  // Memoized intervals based on selection
  const intervals = useMemo(() => {
    setScaleError(null); // Clear previous error
    if (scaleName === "Custom") {
      try {
        return parseCustomIntervals(customScaleIntervalsString);
      } catch (e: any) {
        setScaleError(e.message);
        return []; // Return empty array on error to prevent further calculation issues
      }
    }
    return SCALE_FORMULAS[scaleName];
  }, [scaleName, customScaleIntervalsString]);

  // Memoized tuning based on selection
  const currentTuningDefinition = useMemo(() => {
    setTuningError(null); // Clear previous error
    let tuningArray: string[] = [];
    if (tuningName === "Custom") {
      try {
        tuningArray = parseCustomTuning(customTuningString);
      } catch (e: any) {
        setTuningError(e.message);
        tuningArray = []; // Ensure it's an empty array on error
      }
    } else {
      // Ensure TUNINGS[tuningName] is always an array, even if the lookup somehow fails
      const selectedTuning = TUNINGS[tuningName];
      tuningArray = Array.isArray(selectedTuning) ? selectedTuning : [];
    }
    return tuningArray; // Always return an array
  }, [tuningName, customTuningString]);

  // Update strings count when tuning changes (unless it's custom and user is typing)
  useEffect(() => {
    if (tuningName !== "Custom") {
      setStrings(currentTuningDefinition.length);
    }
  }, [tuningName, currentTuningDefinition]);

  // Adjust startFret if visibleFrets or totalFrets changes to keep it within bounds
  useEffect(() => {
    setStartFret(prevStartFret =>
      Math.min(prevStartFret, TOTAL_INSTRUMENT_FRETS - visibleFrets)
    );
  }, [visibleFrets]);

  // Recompute positions based on all parameters (all frets on the instrument)
  const allPositions = useMemo(
    () => {
      // If there are any parsing errors or invalid tuning/intervals, return an empty array
      if (scaleError || tuningError || currentTuningDefinition.length === 0 || intervals.length === 0) {
        return [];
      }
      try {
        // Get positions for the entire instrument (up to TOTAL_INSTRUMENT_FRETS)
        return getScalePositions(root, intervals, currentTuningDefinition, TOTAL_INSTRUMENT_FRETS);
      } catch (e: any) {
        // Catch errors from getScalePositions (e.g., unknown root/tuning note)
        console.error("Error computing scale positions:", e.message);
        return []; // Always return an empty array on error
      }
    },
    [root, intervals, currentTuningDefinition, scaleError, tuningError]
  );

  // Function to play the notes currently visible on the fretboard
  const playVisibleNotes = async () => { // Renamed from playWholeScale
    const endFret = startFret + visibleFrets;
    const visibleNotesOnFretboard = allPositions.filter( // Filter based on current viewport
      (pos) => pos.fret >= startFret && pos.fret < endFret
    );

    if (visibleNotesOnFretboard.length === 0) {
      console.warn("No visible notes to play on the fretboard.");
      return;
    }

    // Get unique notes from the visible set, sorted by pitch for melodic playback
    const uniqueVisibleNotesToPlay = Array.from(new Set(visibleNotesOnFretboard.map(pos => {
      // Construct a unique identifier for each pitch (note + octave)
      const octave = 4 + Math.floor(pos.fret / 12);
      return pos.note + octave;
    })))
    .sort((a, b) => {
      // Simple sorting based on chromatic order and octave for playback
      const getMidi = (noteStr: string) => {
        const accidentalMatch = noteStr.match(/[CDEFGAB]#/i);
        const baseNote = accidentalMatch ? accidentalMatch[0].toUpperCase() : noteStr.substring(0, 1).toUpperCase();
        const octave = parseInt(noteStr.slice(baseNote.length), 10);
        const NOTE_TO_MIDI_BASE: { [key: string]: number } = {
          "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11,
        };
        return (octave + 1) * 12 + NOTE_TO_MIDI_BASE[baseNote];
      };
      return getMidi(a) - getMidi(b);
    });

    for (let i = 0; i < uniqueVisibleNotesToPlay.length; i++) {
      const note = uniqueVisibleNotesToPlay[i];
      playNote(note, 0.3); // Play each note for 0.3 seconds
      await new Promise(resolve => setTimeout(resolve, 350)); // Wait slightly longer than duration for separation
    }
  };


  // Calculate draggable bounds for the viewport controller
  const handleDrag = (e: any, ui: any) => {
    if (!draggableTrackRef.current || !draggableHandleRef.current) return;

    const parentWidth = draggableTrackRef.current.clientWidth;
    const draggableWidth = draggableHandleRef.current.clientWidth;
    const availableDragWidth = parentWidth - draggableWidth;

    const fretRange = TOTAL_INSTRUMENT_FRETS - visibleFrets;

    if (fretRange <= 0 || availableDragWidth <= 0) {
        setStartFret(0);
        return;
    }

    const newStartFret = Math.round((ui.x / availableDragWidth) * fretRange);

    setStartFret(Math.max(0, Math.min(newStartFret, fretRange)));
  };


  return (
    <main className="p-6 space-y-6 bg-gray-50 min-h-screen font-inter text-gray-800">
      <h1 className="text-4xl font-bold text-blue-700 mb-4 text-center">Scale Explorer</h1>

      {/* Info Dropdown */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <button
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className="w-full text-left font-semibold text-blue-600 flex justify-between items-center py-2"
          aria-expanded={isInfoOpen}
          aria-controls="info-content"
        >
          What is Scale Explorer? How to Use It?
          <span className="text-xl">{isInfoOpen ? '▲' : '▼'}</span>
        </button>
        <div
          id="info-content"
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isInfoOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="prose prose-sm max-w-none text-gray-700">
            <p><strong>Scale Explorer</strong> is an interactive tool designed to help musicians and students visualize and understand musical scales across various instruments.</p>
            <h3 className="text-lg font-semibold mt-4 mb-2">How to Use:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Root:</strong> Select the starting note (root) for your scale.</li>
              <li><strong>Scale:</strong> Choose from a variety of predefined scale formulas, or select "Custom" to define your own using semitone intervals (e.g., "2,2,1,2,2,2,1" for Major).</li>
              <li><strong>Tuning:</strong> Pick a standard instrument tuning, or select "Custom" to input your own string notes (e.g., "E,A,D,G,B,E" for standard guitar).</li>
              <li><strong>Strings:</strong> Adjust the number of strings to match your instrument.</li>
              <li><strong>Visible Frets:</strong> Control how many frets are displayed on the fretboard at once.</li>
              <li><strong>Fretboard Viewport Controller:</strong> Drag the blue box to scroll through the entire 24-fret range of the instrument. The tablature and standard notation views will update to match the visible section.</li>
              <li><strong>ASCII Tabs / Styled Tabs:</strong> Toggle between a plain text (ASCII) and a visually styled HTML tablature display.</li>
              <li><strong>Root Note Highlighting:</strong> The root note of the selected scale will be highlighted in red across all three visual representations.</li>
              <li><strong>Play Visible Notes:</strong> Click this button to hear the notes currently displayed on the fretboard, played in ascending order.</li> {/* Updated instruction */}
            </ul>
            <p className="mt-4">Explore, learn, and master your scales with Scale Explorer!</p>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-white rounded-xl shadow-lg">
        {/* Root */}
        <div className="flex flex-col items-start space-y-1">
          <label htmlFor="root-select" className="text-sm font-medium text-gray-700">Root:</label>
          <select
            id="root-select"
            value={root}
            onChange={e => setRoot(e.target.value as Root)}
            className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
            aria-label="Select musical root note"
          >
            {ROOTS.map(r => (
              <option key={r} value={r}>{r.replace("#","♯")}</option>
            ))}
          </select>
        </div>

        {/* Scale */}
        <div className="flex flex-col items-start space-y-1">
          <label htmlFor="scale-select" className="text-sm font-medium text-gray-700">Scale:</label>
          <select
            id="scale-select"
            value={scaleName}
            onChange={e => setScaleName(e.target.value as ScaleName)}
            className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
            aria-label="Select scale type"
          >
            {Object.keys(SCALE_FORMULAS).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="Custom">Custom</option>
          </select>
          {scaleName === "Custom" && (
            <div className="flex flex-col mt-2">
              <input
                type="text"
                value={customScaleIntervalsString}
                onChange={e => setCustomScaleIntervalsString(e.target.value)}
                placeholder="e.g., 2,2,1,2,2,2,1"
                className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base mt-1"
                aria-label="Enter custom scale intervals (comma-separated numbers)"
              />
              {scaleError && <p className="text-red-500 text-sm mt-1">{scaleError}</p>}
            </div>
          )}
        </div>

        {/* Tuning */}
        <div className="flex flex-col items-start space-y-1">
          <label htmlFor="tuning-select" className="text-sm font-medium text-gray-700">Tuning:</label>
          <select
            id="tuning-select"
            value={tuningName}
            onChange={e => {
              const nm = e.target.value as TuningName;
              setTuningName(nm);
              // If not custom, update strings to match the selected preset tuning
              if (nm !== "Custom") {
                setStrings(TUNINGS[nm].length);
              }
            }}
            className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
            aria-label="Select instrument tuning"
          >
            {tuningNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="Custom">Custom</option>
          </select>
          {tuningName === "Custom" && (
            <div className="flex flex-col mt-2">
              <input
                type="text"
                value={customTuningString}
                onChange={e => {
                  setCustomTuningString(e.target.value);
                  // Update strings count dynamically based on custom input
                  const newStrings = e.target.value.split(',').filter(s => s.trim() !== '').length;
                  setStrings(newStrings > 0 ? newStrings : 1); // Ensure at least 1 string
                }}
                placeholder="e.g., E,A,D,G,B,E"
                className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base mt-1"
                aria-label="Enter custom tuning (comma-separated notes)"
              />
              {tuningError && <p className="text-red-500 text-xs mt-1">{tuningError}</p>}
            </div>
          )}
        </div>

        {/* Strings */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Strings:</span>
          <button
            onClick={() => setStrings(s => Math.max(1, s - 1))}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base"
            aria-label="Decrease number of strings"
          >
            –
          </button>
          <span className="w-8 text-center font-semibold text-gray-900 text-base">{strings}</span>
          <button
            onClick={() => setStrings(s => Math.min(10, s + 1))} // Cap at 10 strings for reasonable display
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-base"
            aria-label="Increase number of strings"
          >
            +
          </button>
        </div>

        {/* Visible Frets */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Visible Frets:</span>
          <button
            onClick={() => setVisibleFrets(f => Math.max(1, f - 1))}
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-base"
            aria-label="Decrease number of visible frets"
          >
            –
          </button>
          <span className="w-8 text-center font-semibold text-gray-900 text-base">{visibleFrets}</span>
          <button
            onClick={() => setVisibleFrets(f => Math.min(TOTAL_INSTRUMENT_FRETS, f + 1))}
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-base"
            aria-label="Increase number of visible frets"
          >
            +
          </button>
        </div>

        {/* ASCII ↔ Styled Tabs */}
        <button
          onClick={() => setAscii(a => !a)}
          className="px-5 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-base"
          aria-label={ascii ? "Switch to styled tablature" : "Switch to ASCII tablature"}
        >
          {ascii ? "ASCII Tabs" : "Styled Tabs"}
        </button>

        {/* Play Visible Notes Button */}
        <button
          onClick={playVisibleNotes} // Changed to playVisibleNotes
          className="px-5 py-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-base"
          aria-label="Play visible notes on fretboard"
        >
          Play Visible Notes {/* Changed button text */}
        </button>
      </div> {/* Closing tag for the controls div */}

      {/* Fretboard Viewport Controller (the draggable "box") */}
      <div ref={draggableTrackRef} className="w-full bg-gray-200 rounded-lg h-10 flex items-center p-1 relative mb-4">
        <span className="absolute left-2 text-sm text-gray-600">Fret {startFret}</span>
        <Draggable
          axis="x"
          bounds="parent"
          position={{ x: (startFret / (TOTAL_INSTRUMENT_FRETS - visibleFrets)) * (draggableTrackRef.current ? draggableTrackRef.current.clientWidth - (draggableHandleRef.current ? draggableHandleRef.current.clientWidth : 0) : 0), y: 0 }}
          onDrag={handleDrag}
          nodeRef={draggableHandleRef as React.RefObject<HTMLElement>}
        >
          <div ref={draggableHandleRef} className="w-20 h-8 bg-blue-500 rounded-md shadow-md cursor-ew-resize flex items-center justify-center text-sm">
            Drag
          </div>
        </Draggable>
        <span className="absolute right-2 text-sm text-gray-600">Fret {TOTAL_INSTRUMENT_FRETS}</span>
      </div>


      {/* Display Sections */}
      {(scaleError || tuningError) ? (
        <div className="text-red-600 bg-red-100 p-4 rounded-lg border border-red-300">
          <p className="font-semibold text-base">Input Error:</p>
          {scaleError && <p className="text-sm">- Scale: {scaleError}</p>}
          {tuningError && <p className="text-sm">- Tuning: {tuningError}</p>}
          <p className="mt-2 text-sm">Please correct the invalid input to see the scale visualization.</p>
        </div>
      ) : (
        <>
          {/* Fretboard */}
          <section className="w-full overflow-x-auto p-4 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Fretboard View</h2>
            <Fretboard
              root={root}
              strings={strings}
              totalFrets={TOTAL_INSTRUMENT_FRETS}
              visibleFrets={visibleFrets}
              startFret={startFret}
              positions={allPositions}
              tuning={currentTuningDefinition}
            />
          </section>

          {/* Tablature */}
          <section className="w-full overflow-x-auto p-4 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Tablature View</h2>
            <Tablature
              tuning={currentTuningDefinition}
              strings={strings}
              frets={TOTAL_INSTRUMENT_FRETS}
              positions={allPositions}
              ascii={ascii}
              root={root}
              startFret={startFret}
              visibleFrets={visibleFrets}
            />
          </section>

          {/* Standard notation */}
          <section className="w-full overflow-x-auto p-4 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Standard Notation View</h2>
            <StandardNotation
              positions={allPositions} // Pass all positions
              root={root}
              startFret={startFret}
              visibleFrets={visibleFrets}
            />
          </section>
        </>
      )}
    </main>
  );
}
