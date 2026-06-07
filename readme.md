# Cross Impact Analysis

Cross Impact Analysis is a Vite + React app for mapping factor relationships, analyzing influence patterns, and exporting results for further review. It is vibe-coded, so use it with caution.

## What it does

- Build a directed factor graph with draggable nodes and influence edges.
- Edit factor labels, edge weights, directions, timeframes, and connection handles.
- Review the influence matrix with active and passive sums.
- Inspect factor roles in the quadrant chart.
- Save and reload work locally in the browser.
- Import and export analysis as JSON.
- Export the matrix and factor analysis to Excel.

## Tech Stack

- React 18
- Vite
- React Flow
- Recharts
- Tailwind CSS
- xlsx-js-style

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Usage

1. Add factors to the canvas.
2. Connect factors with influence edges.
3. Adjust edge metadata as needed.
4. Switch between the canvas, matrix, and quadrant views.
5. Export to Excel when you want a shareable analysis snapshot.

## Project Structure

- `src/App.jsx` - main application state and tab layout
- `src/components/` - canvas, matrix, quadrant, and node/edge UI
- `src/utils/` - matrix calculations and Excel export helpers
- `src/i18n.js` - UI text translations

## Notes

- Data saved through the app is stored in browser local storage.
- JSON import/export is useful for moving analysis between sessions.
- Excel export generates a workbook with the influence matrix and factor analysis sheets.
