# Slide Merge

A modern web application for merging presentation files into a single PowerPoint presentation. Built with Svelte 5 and designed to work entirely in your browser - no server uploads required.

## Features

- **Browser-Based Processing**: All file processing happens locally in your browser - your files never leave your device
- **PDF Support**: Extract slides from PDF files (limited to first 100 pages)
- **Image Support**: Directly include JPG and PNG images as slides
- **Drag & Drop Interface**: Simple and intuitive file handling
- **Progress Tracking**: Real-time progress updates for PDF processing
- **Slide Organization**: Reorder and manage your slides before merging
- **Modern UI**: Clean, responsive design with dark mode support

## Supported File Types

- **PDF** (.pdf): Extract individual pages as slides (first 100 pages)
- **Images** (.jpg, .jpeg, .png): Direct inclusion as slides
- **Note**: PowerPoint files (PPT, PPTX) are not currently supported

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`

## Usage

1. Add your files by dragging and dropping them onto the page or using the file picker
2. Organize your slides using the drag-and-drop interface
3. Click "Download" to generate and download your merged presentation

## Technical Notes

- Built with Svelte 5 and TypeScript
- Uses PDF.js for PDF processing
- Implements pptxgenjs for PowerPoint generation
- Progressive Web App (PWA) ready
- Responsive design for all screen sizes

## Browser Compatibility

Slide Merge works best in modern browsers that support the following features:
- File System Access API
- Web Workers
- Canvas API

## License

MIT License - see LICENSE file for details
