// src/components/Tablature.tsx
import { STANDARD_TUNING, Position } from "@/lib/scales";

interface TablatureProps {
  strings: number;
  frets: number;
  positions: Position[];
  ascii?: boolean;
}

const Tablature = ({
  strings,
  frets,
  positions,
  ascii = true,
}: TablatureProps) => {
  const tuning = STANDARD_TUNING.slice(0, strings);
  // build an empty GRID of “-”
  const grid = tuning.map(() => Array(frets + 1).fill("-"));

  // stamp in fret numbers
  positions.forEach(({ stringIdx, fret }) => {
    grid[stringIdx][fret] = `${fret}`;
  });

  if (ascii) {
    return (
      <pre className="mt-4 font-mono">
        {grid
          .map(
            (row, i) =>
              `${tuning[i]}|${row
                .map((cell) => (cell.length === 1 ? cell + "-" : cell))
                .join("")}`
          )
          .join("\n")}
      </pre>
    );
  }

  // styled‐HTML version
  return (
    <div className="mt-4 space-y-1 font-mono">
      {grid.map((row, i) => (
        <div key={i} className="flex">
          <span className="mr-2">{tuning[i]}|</span>
          {row.map((cell, j) => (
            <span key={j} className="mx-0.5">
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Tablature;
