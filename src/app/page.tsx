// src/app/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { TUNINGS, SCALE_FORMULAS, getScalePositions, CHROMATIC, parseCustomTuning, parseCustomIntervals } from "@/lib/scales";
import Fretboard from "@/components/Fretboard";
import Tablature from "@/components/Tablature";
import StandardNotation from "@/components/StandardNotation";

// All possible roots - derived directly from CHROMATIC for consistency
const ROOTS = CHROMATIC.map(note => note) as readonly string[];
type Root = typeof ROOTS[number];

type ScaleName = keyof typeof SCALE_FORMULAS | "Custom";
type TuningName = keyof typeof TUNINGS | "Custom";

// Constants for fretboard dimensions to avoid magic numbers
const DEFAULT_FRETS = 12;
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
  const [frets, setFrets] = useState(DEFAULT_FRETS);
  const [ascii, setAscii] = useState(true);

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
    if (tuningName === "Custom") {
      try {
        return parseCustomTuning(customTuningString);
      } catch (e: any) {
        setTuningError(e.message);
        return []; // Return empty array on error
      }
    }
    return TUNINGS[tuningName];
  }, [tuningName, customTuningString]);

  // Update strings count when tuning changes (unless it's custom and user is typing)
  useEffect(() => {
    if (tuningName !== "Custom") {
      setStrings(currentTuningDefinition.length);
    }
  }, [tuningName, currentTuningDefinition]);


  // Recompute positions based on all parameters
  const positions = useMemo(
    () => {
      // Only compute positions if there are no parsing errors and tuning is valid
      if (scaleError || tuningError || currentTuningDefinition.length === 0 || intervals.length === 0) {
        return [];
      }
      try {
        return getScalePositions(root, intervals, currentTuningDefinition, frets);
      } catch (e: any) {
        // Catch errors from getScalePositions (e.g., unknown root/tuning note)
        console.error("Error computing scale positions:", e.message);
        // Display a general error or specific error from getScalePositions if needed
        return [];
      }
    },
    [root, intervals, currentTuningDefinition, frets, scaleError, tuningError]
  );

  return (
    <main className="p-6 space-y-6 bg-gray-50 min-h-screen font-inter text-gray-800">
      <h1 className="text-4xl font-bold text-blue-700 mb-8 text-center">Scalerator</h1>

      {/* controls */}
      <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-white rounded-xl shadow-lg">
        {/* Root */}
        <div className="flex flex-col items-start space-y-1">
          <label htmlFor="root-select" className="text-sm font-medium text-gray-700">Root:</label>
          <select
            id="root-select"
            value={root}
            onChange={e => setRoot(e.target.value as Root)}
            className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm mt-1"
                aria-label="Enter custom scale intervals (comma-separated numbers)"
              />
              {scaleError && <p className="text-red-500 text-xs mt-1">{scaleError}</p>}
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
            className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm mt-1"
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
            className="px-3 py-1 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Decrease number of strings"
          >
            –
          </button>
          <span className="w-6 text-center font-semibold text-gray-900">{strings}</span>
          <button
            onClick={() => setStrings(s => Math.min(10, s + 1))} // Cap at 10 strings for reasonable display
            className="px-3 py-1 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Increase number of strings"
          >
            +
          </button>
        </div>

        {/* Frets */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Frets:</span>
          <button
            onClick={() => setFrets(f => Math.max(MIN_FRETS, f - 1))}
            className="px-3 py-1 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Decrease number of frets"
          >
            –
          </button>
          <span className="w-6 text-center font-semibold text-gray-900">{frets}</span>
          <button
            onClick={() => setFrets(f => Math.min(MAX_FRETS, f + 1))}
            className="px-3 py-1 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Increase number of frets"
          >
            +
          </button>
        </div>

        {/* ASCII ↔ Styled Tabs */}
        <button
          onClick={() => setAscii(a => !a)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label={ascii ? "Switch to styled tablature" : "Switch to ASCII tablature"}
        >
          {ascii ? "ASCII Tabs" : "Styled Tabs"}
        </button>
      </div>

      {/* Display Sections */}
      {(scaleError || tuningError) ? (
        <div className="text-red-600 bg-red-100 p-4 rounded-lg border border-red-300">
          <p className="font-semibold">Input Error:</p>
          {scaleError && <p>- Scale: {scaleError}</p>}
          {tuningError && <p>- Tuning: {tuningError}</p>}
          <p className="mt-2">Please correct the invalid input to see the scale visualization.</p>
        </div>
      ) : (
        <>
          {/* Fretboard */}
          <section className="w-full overflow-x-auto p-4 bg-white rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Fretboard View</h2>
            <Fretboard
              root={root}
              strings={strings}
              frets={frets}
              positions={positions}
            />
          </section>

          {/* Tablature */}
          <section className="w-full overflow-x-auto p-4 bg-white rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Tablature View</h2>
            <Tablature
              tuning={currentTuningDefinition} // Use the parsed tuning
              strings={strings}
              frets={frets}
              positions={positions}
              ascii={ascii}
            />
          </section>

          {/* Standard notation */}
          <section className="w-full overflow-x-auto p-4 bg-white rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Standard Notation View</h2>
            <StandardNotation positions={positions} />
          </section>
        </>
      )}
    </main>
  );
}
