<script lang="ts">
  import PDFThumbnail from '$lib/components/PDFThumbnail.svelte';
  import { processFiles, mergeSlides, downloadPresentation } from '$lib/services/fileProcessor';
  import type { SlideItem } from '$lib/components/SlideManager.svelte';

  let selectedFile: File | null = null;
  let pdfUrl: string = '';
  let error = '';
  let pdfSlides: SlideItem[] = [];
  let creatingPptx = false;

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      error = 'Please select a PDF file';
      return;
    }

    selectedFile = file;
    error = '';

    try {
      // Create object URL for the selected file
      if (pdfUrl) {
        // Revoke the previous URL to prevent memory leaks
        URL.revokeObjectURL(pdfUrl);
      }
      
      pdfUrl = URL.createObjectURL(file);
      console.log('Created object URL for PDF:', pdfUrl);
      
      // Process the PDF file to extract slides
      pdfSlides = await processFiles([file]);
      console.log(`Processed ${pdfSlides.length} slides from PDF`);
    } catch (err) {
      console.error('Error processing PDF file:', err);
      error = 'Error processing the PDF file';
    }
  }

  async function createPowerPoint() {
    if (pdfSlides.length === 0) {
      error = 'No PDF slides to convert to PowerPoint';
      return;
    }
    
    creatingPptx = true;
    
    try {
      // Create a PowerPoint presentation with the PDF slides
      const pptxBlob = await mergeSlides(pdfSlides);
      
      // Download the PowerPoint file
      await downloadPresentation(pptxBlob, 'PDF-to-PowerPoint.pptx');
      
      console.log('PowerPoint created and downloaded');
    } catch (err) {
      console.error('Error creating PowerPoint:', err);
      error = 'Failed to create PowerPoint presentation';
    } finally {
      creatingPptx = false;
    }
  }

  function debugPdf() {
    if (selectedFile) {
      // Try loading PDF.js directly for debugging
      import('pdfjs-dist').then(async (pdfjsLib) => {
        console.log('PDF.js loaded for debug');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
        
        try {
          // Try loading the PDF directly
          const doc = await pdfjsLib.getDocument(pdfUrl).promise;
          console.log('Debug: PDF loaded successfully with', doc.numPages, 'pages');
        } catch (err) {
          console.error('Debug: PDF loading failed:', err);
        }
      });
    }
  }
  
  // Clean up on component unmount
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
  });
</script>

<div class="container">
  <h1>PDF to PowerPoint Test</h1>
  
  <div class="file-input">
    <label for="pdf-file">Select a PDF file:</label>
    <input 
      type="file" 
      id="pdf-file"
      accept=".pdf" 
      onchange={handleFileSelect}
    />
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if pdfUrl}
    <div class="result">
      <h2>PDF Preview</h2>
      
      <div class="pdf-container">
        <PDFThumbnail 
          pdfUrl={pdfUrl} 
          width={400} 
          height={550} 
          alt={selectedFile?.name || 'PDF preview'} 
        />
      </div>
      
      <p class="file-name">{selectedFile?.name}</p>
      
      <div class="button-container">
        <button 
          class="debug-button"
          onclick={debugPdf}
        >
          Debug PDF Loading
        </button>
        
        <button 
          class="pptx-button"
          onclick={createPowerPoint}
          disabled={pdfSlides.length === 0 || creatingPptx}
        >
          {#if creatingPptx}
            Creating PowerPoint...
          {:else}
            Create PowerPoint
          {/if}
        </button>
      </div>
      
      {#if pdfSlides.length > 0}
        <div class="slides-info">
          <h3>Extracted PDF Pages ({pdfSlides.length})</h3>
          
          <div class="thumbnails-container">
            {#each pdfSlides as slide}
              <div class="thumbnail-item">
                <img 
                  src={slide.thumbnail} 
                  alt={`Page ${slide.index + 1}`} 
                  class="slide-thumbnail"
                />
                <span class="page-number">Page {slide.index + 1}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h1, h2, h3 {
    color: #333;
    margin-bottom: 20px;
  }
  
  h3 {
    margin-top: 30px;
    font-size: 18px;
  }

  .file-input {
    margin-bottom: 20px;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }

  input[type="file"] {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 100%;
    max-width: 400px;
  }

  .error-message {
    color: #d32f2f;
    padding: 10px;
    background-color: rgba(255, 0, 0, 0.05);
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .result {
    margin-top: 30px;
  }

  .pdf-container {
    margin: 20px 0;
    display: flex;
    justify-content: center;
    border: 1px solid #eee;
    padding: 10px;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .file-name {
    text-align: center;
    font-size: 14px;
    color: #666;
    margin-top: 10px;
  }
  
  .button-container {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
  }
 
  .debug-button, .pptx-button {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .debug-button {
    background-color: #f1f1f1;
  }
  
  .debug-button:hover {
    background-color: #e0e0e0;
  }
  
  .pptx-button {
    background-color: #4285f4;
    color: white;
    border-color: #3367d6;
  }
  
  .pptx-button:hover:not(:disabled) {
    background-color: #3367d6;
  }
  
  .pptx-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .thumbnails-container {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 15px;
  }
  
  .thumbnail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 120px;
  }
  
  .slide-thumbnail {
    width: 100%;
    height: 90px;
    object-fit: contain;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
  }
  
  .page-number {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
  }
</style> 