# Slide Merge

Slide Merge is a web-based tool that allows you to merge multiple presentation files (PPT, PPTX, PDF) into a single PPTX file, with all processing happening entirely on the client-side (no server uploads).

## Features

- Upload multiple presentation files via drag-and-drop or file selector
- Process files entirely client-side (no server uploads)
- Extract and display slides for review
- Reorder slides with drag-and-drop functionality
- Select/deselect slides for inclusion in the final presentation
- Merge selected slides into a single PPTX file
- Download the final merged presentation

## Technology Stack

- Frontend: Svelte 5 with runes for reactivity
- Build: Vite + SvelteKit
- Styling: TailwindCSS
- PWA Support: Enabled for offline capabilities
- Key Libraries:
  - SheetJS (reading/writing Office files)
  - pdf.js (PDF processing)
  - pptxgenjs (PPTX creation)
  - JSZip (handling PPTX files)
  - FileSaver.js (downloading)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 20.x)
- [Bun](https://bun.sh/) (>= 1.0.0) or NPM/Yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/slide-merge.git
cd slide-merge

# Install dependencies
bun install

# Start development server
bun run dev
```

Visit [http://localhost:5173/](http://localhost:5173/) in your browser.

## Building for Production

```bash
bun run build
```

The build output will be in the `build` directory.

## Project Structure

```
slide-merge/
├── src/
│   ├── lib/
│   │   ├── components/  # UI components
│   │   └── services/    # Core functionality
│   ├── routes/          # SvelteKit routes/pages
│   └── app.html         # HTML template
├── static/              # Static assets
└── ... (config files)
```

## Usage

1. Upload your presentation files (PPT, PPTX, PDF)
2. Review and rearrange the extracted slides
3. Select/deselect slides as needed
4. Click "Merge & Download" to create and download the final presentation

## Implementation Details

### Current Implementation
The current version uses placeholder slide representations and generates a new PPTX with simulated content. It demonstrates the UI flow and user experience without implementing the complex slide extraction logic.

### Future Enhancement Plan
For a full implementation that preserves actual slide content:

1. **For PDF files**:
   - Use PDF.js to render each page to a canvas
   - Extract the rendered page as an image at 1920x1080 resolution

2. **For PPTX files**:
   - Use JSZip to extract the package contents
   - Parse slide XML and related assets
   - Render slide content to canvas using the extracted assets
   - Convert canvas to image at 1920x1080 resolution

3. **For PPT files**:
   - Use a dedicated PPT parser library
   - Convert each slide to an image representation

4. **Merge Process**:
   - Create a new PPTX
   - Add each extracted slide image as a full-slide image
   - Preserve slide notes if possible
   - Add metadata about the source slide

This enhancement would require significant client-side processing but would result in a more faithful representation of the original slides.

## Limitations

- Currently, the slide content extraction is simplified and only demonstrates the concept
- For a production-ready version, more robust extraction and conversion logic would be needed
- Large presentations might cause performance issues in the browser

## License

MIT

## Acknowledgments

This project was created as a proof of concept for a client-side presentation merger.
