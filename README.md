# slide merge

slide merge is a web-based tool that allows you to combine PDF documents and images into a single PPTX file, with all processing happening entirely in your browser (nothing uploads to any server).

## Features

- Upload PDF documents and images via drag-and-drop or file selector
- Process files entirely client-side (complete privacy protection)
- Extract and display PDF pages for review
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
  - pdf.js (PDF processing)
  - pptxgenjs (PPTX creation)
  - FileSaver.js (downloading)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 20.x)
- [Bun](https://bun.sh/) (>= 1.0.0) or NPM/Yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/adminimize/slidemerge.git
cd slidemerge

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
slidemerge/
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

1. Upload your PDF documents and images
2. Review and rearrange the extracted pages
3. Select/deselect pages as needed
4. Click "Merge & Download" to create and download the final presentation

## Implementation Details

### PDF Processing
- Uses PDF.js to render each page to a canvas
- Extracts the rendered page as an image at 1920x1080 resolution
- Maintains aspect ratio and properly positions content
- Limited to first 50 pages for large PDFs to prevent memory issues

### Image Processing
- Supports common image formats (JPG, PNG, GIF, etc.)
- Maintains aspect ratio and properly positions images in slides

### Merge Process
- Creates a new PPTX using pptxgenjs
- Adds each extracted page/image as a full-slide image
- Preserves metadata about the source in slide notes
- Optimizes image quality for the final presentation

## Limitations

- Large PDFs may cause performance issues in the browser (limited to first 50 pages)
- PowerPoint files (PPT/PPTX) are not supported
- High-resolution images may use significant memory when processing

## License

MIT

## Copyright

© adminimize, 2025
