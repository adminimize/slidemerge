# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Slide Merge is a privacy-focused web application that merges PDFs and images into PowerPoint presentations entirely in the browser. Built with SvelteKit and Svelte 5, it processes files locally without server uploads.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
npm run check:watch

# Linting and formatting
npm run lint
npm run format
```

## Architecture & Key Components

### Core Processing Pipeline
1. **File Input** → `FileUpload.svelte`: Handles drag-drop and file selection
2. **Processing** → `fileProcessor.ts`: Converts PDFs/images to slide data
   - PDF pages rendered via PDF.js worker (`/static/pdf.worker.mjs`)
   - 100-page limit per PDF to prevent memory issues
3. **Organization** → `PresentationManager.svelte`: Groups slides by source file
4. **Generation** → `MergeControl.svelte`: Creates PPTX using pptxgenjs

### State Management
- Uses Svelte 5 runes (`$state`, `$props`)
- Component communication via custom events
- File data stored in memory during session

### Important Technical Constraints
- **PDF Processing**: Limited to 100 pages per file
- **Memory Management**: Clean up blob URLs after use
- **Worker Loading**: PDF.js worker must be at `/static/pdf.worker.mjs`
- **Browser APIs**: Requires File API, Canvas API, Web Workers

## Code Style Guidelines

- Components use Svelte 5 runes syntax
- TypeScript strict mode enabled
- Tailwind CSS v4 for styling
- File naming: PascalCase for components, camelCase for utilities

## Testing Approach

Currently no automated tests. Manual testing focuses on:
- Multiple file format combinations
- Large PDF processing
- Memory usage during extended sessions
- Cross-browser compatibility