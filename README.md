This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Overview: Scale Explorer

Scale Explorer is an interactive web application designed to help musicians and students visualize and understand musical scales across various instruments. It provides three primary views: a fretboard, tablature, and standard notation, all updated in real-time based on user selections.

### Key Features:

* **Customizable Scales:** Choose from a variety of predefined scale formulas (e.g., Major, Minor, Blues, Pentatonic) or define your own custom scales using semitone intervals.
* **Flexible Tunings:** Select common instrument tunings (e.g., Guitar Standard, Bass Guitar, Mandolin) or input your own custom string tunings.
* **Dynamic Fretboard Visualization:** See scale notes highlighted on an interactive fretboard. Adjust the number of strings and visible frets to suit your instrument and learning focus.
* **Viewport Controller:** A draggable slider allows you to easily navigate through the entire 24-fret range of the instrument, updating all views to match the visible section.
* **Tablature Generation:** Instantly generate tablature for the selected scale and tuning, with the option to toggle between plain ASCII and a more visually styled HTML format.
* **Standard Notation Display:** View the selected scale notes in standard musical notation (treble clef).
* **Root Note Highlighting:** The root note of the active scale is prominently highlighted across all three visual representations for easy identification.
* **Auditory Feedback:** Play the notes currently displayed on the fretboard to hear the scale, aiding in ear training and comprehension.

### How to Use:

1.  **Root:** Select the starting note (root) for your scale.
2.  **Scale:** Choose from a variety of predefined scale formulas, or select "Custom" to define your own using semitone intervals (e.g., "2,2,1,2,2,2,1" for Major).
3.  **Tuning:** Pick a standard instrument tuning, or select "Custom" to input your own string notes (e.g., "E,A,D,G,B,E" for standard guitar).
4.  **Strings:** Adjust the number of strings to match your instrument.
5.  **Visible Frets:** Control how many frets are displayed on the fretboard at once.
6.  **Fretboard Viewport Controller:** Drag the blue box to scroll through the entire 24-fret range of the instrument. The tablature and standard notation views will update to match the visible section.
7.  **ASCII Tabs / Styled Tabs:** Toggle between a plain text (ASCII) and a visually styled HTML tablature display.
8.  **Root Note Highlighting:** The root note of the selected scale will be highlighted in red across all three visual representations.
9.  **Play Visible Notes:** Click this button to hear the notes currently displayed on the fretboard, played in ascending order.

Explore, learn, and master your scales with Scale Explorer!

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev