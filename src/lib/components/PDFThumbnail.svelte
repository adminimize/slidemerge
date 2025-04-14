<script lang="ts">
  import { onDestroy } from 'svelte';

  // Props using Svelte 5 runes
  const { pdfUrl = '', width = 150, height = 200, alt = 'PDF thumbnail' } = $props();

  // State
  let canvas: HTMLCanvasElement;
  let error = false;
  let errorMessage = '';
  
  // Track current rendering operation to cancel it if needed
  let currentRenderTask: any = null;
  let currentLoadingTask: any = null;

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  // Dynamically import PDF.js only in browser environment
  async function loadPdfJs() {
    if (!isBrowser) return null;

    try {
      // Import PDF.js
      const pdfjs = await import('pdfjs-dist');
      
      // Make sure the worker is loaded correctly
      const workerPath = '/pdf.worker.mjs';
      pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
      
      return pdfjs;
    } catch (err: unknown) {
      console.error('Failed to load PDF.js:', err);
      error = true;
      errorMessage = err instanceof Error ? err.message : 'Failed to load PDF.js library';
      return null;
    }
  }

  // Clean up any existing render tasks
  function cleanupTasks() {
    if (currentRenderTask) {
      try {
        currentRenderTask.cancel();
      } catch (e) {
        console.log('Error canceling render task:', e);
      }
      currentRenderTask = null;
    }
    
    if (currentLoadingTask) {
      try {
        currentLoadingTask.destroy();
      } catch (e) {
        console.log('Error destroying loading task:', e);
      }
      currentLoadingTask = null;
    }
  }

  async function renderPdfThumbnail() {
    if (!pdfUrl || !isBrowser || !canvas) return;
    
    // Clean up any existing tasks
    cleanupTasks();
    
    try {
      const pdfjsLib = await loadPdfJs();
      if (!pdfjsLib) return;
      
      console.log('Loading PDF from URL:', pdfUrl);
      
      // Load the PDF file directly with no timeout
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      currentLoadingTask = loadingTask;
      const pdf = await loadingTask.promise;
      
      console.log('PDF loaded, getting first page');
      
      // Get the first page
      const page = await pdf.getPage(1);
      
      // Set viewport for the thumbnail size
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Calculate scale to fit within the specified dimensions
      const scale = Math.min(width / viewport.width, height / viewport.height);
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas dimensions to match the scaled viewport
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      // Get the rendering context
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas rendering context');
      }
      
      console.log('Rendering to canvas:', canvas.width, 'x', canvas.height);
      
      // Render the page to the canvas
      const renderTask = page.render({
        canvasContext: context,
        viewport: scaledViewport
      });
      
      currentRenderTask = renderTask;
      await renderTask.promise;
      
      console.log('Render complete');
      
      // Clean up
      page.cleanup();
    } catch (err: unknown) {
      console.error('Error rendering PDF thumbnail:', err);
      error = true;
      errorMessage = err instanceof Error ? err.message : 'Failed to render PDF';
    } finally {
      currentRenderTask = null;
      currentLoadingTask = null;
    }
  }

  // Use simpler logic to render when component mounts and when pdfUrl changes
  $effect(() => {
    if (pdfUrl && canvas) {
      console.log('PDF URL or canvas changed, rendering PDF');
      renderPdfThumbnail();
    }
  });

  onDestroy(() => {
    cleanupTasks();
  });
</script>

<div class="pdf-thumbnail" style="width: {width}px; height: {height}px;">
  {#if error}
    <div class="error">{errorMessage}</div>
  {/if}
  <canvas 
    bind:this={canvas} 
    width={width} 
    height={height} 
    aria-label={alt}
    class:hidden={error}
  />
</div>

<style>
  .pdf-thumbnail {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    background-color: #f8f8f8;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  canvas {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 8px;
    font-size: 14px;
    color: #d32f2f;
    background-color: rgba(255, 0, 0, 0.05);
  }
  
  .hidden {
    display: none;
  }
</style> 