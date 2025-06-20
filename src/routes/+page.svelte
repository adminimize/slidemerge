<script lang="ts">
  import { browser } from '$app/environment';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import PresentationManager from '$lib/components/PresentationManager.svelte';
  import MergeControl from '$lib/components/MergeControl.svelte';
  import { processFilesAsGroups, mergePresentations, downloadPresentation } from '$lib/services/fileProcessor';
  import type { PresentationGroup } from '$lib/components/PresentationManager.svelte';
  import { onMount, onDestroy } from 'svelte';
  
  let files = $state<File[]>([]);
  let presentations = $state<PresentationGroup[]>([]);
  let processing = $state(false);
  let merging = $state(false);
  
  // Download state for reactive download link
  let downloadUrl = $state<string | null>(null);
  let downloadFilename = $state<string>('');
  // Add state to track processing progress for each file
  let processingStatus = $state<Array<{ 
    fileName: string, 
    inProgress: boolean, 
    progress: number, 
    total: number 
  }>>([]);

  // Helper function to update processing progress
  function updateProcessingProgress(fileName: string, progress: number, total: number) {
    const existingStatusIndex = processingStatus.findIndex(status => status.fileName === fileName);
    
    if (existingStatusIndex >= 0) {
      // Update existing status
      processingStatus[existingStatusIndex].progress = progress;
      processingStatus[existingStatusIndex].total = total;
    } else {
      // Add new status
      processingStatus = [...processingStatus, {
        fileName,
        inProgress: true,
        progress,
        total
      }];
    }
  }

  // Helper function to mark processing as complete
  function completeProcessing(fileName: string) {
    const existingStatusIndex = processingStatus.findIndex(status => status.fileName === fileName);
    
    if (existingStatusIndex >= 0) {
      // Mark as complete
      processingStatus[existingStatusIndex].inProgress = false;
      processingStatus[existingStatusIndex].progress = processingStatus[existingStatusIndex].total;
    }
  }

  // Helper function to notify layout about file status
  function notifyLayoutAboutFiles() {
    if (browser) {
      // Create and dispatch a custom event for the layout
      const event = new CustomEvent('filesUpdated', {
        detail: { hasFiles: files.length > 0 },
        bubbles: true
      });
      document.dispatchEvent(event);
    }
  }

  // Handle page-level file drop events
  function handleFilesDroppedOnPage(event: Event) {
    const customEvent = event as CustomEvent<{ files: File[] }>;
    const newFiles = customEvent.detail.files;
    // Use the same validation and processing as regular file selection
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
    });
    
    if (validFiles.length > 0) {
      files = [...files, ...validFiles];
      processNewFiles(validFiles);
      notifyLayoutAboutFiles();
      
      // Track file uploads with Plausible
      if (browser && 'plausible' in window) {
        (window as any).plausible('Upload', { 
          props: { 
            files: validFiles.length,
            types: validFiles.map(f => f.type.split('/')[1] || 'unknown').join(',')
          } 
        });
      }
    }
  }

  // Listen for PDF processing progress events
  function listenForProcessingEvents() {
    if (browser) {
      document.addEventListener('pdfProcessingProgress', (e: Event) => {
        const customEvent = e as CustomEvent<{ 
          fileName: string, 
          pageNum: number, 
          numPages: number 
        }>;
        const { fileName, pageNum, numPages } = customEvent.detail;
        updateProcessingProgress(fileName, pageNum, numPages);
      });
      
      document.addEventListener('pdfProcessingComplete', (e: Event) => {
        const customEvent = e as CustomEvent<{ fileName: string }>;
        completeProcessing(customEvent.detail.fileName);
      });
    }
  }

  // Listen for files dropped anywhere on the page
  onMount(() => {
    if (browser) {
      document.addEventListener('filesDroppedOnPage', handleFilesDroppedOnPage);
      listenForProcessingEvents();
      notifyLayoutAboutFiles(); // Initialize file status
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('filesDroppedOnPage', handleFilesDroppedOnPage);
      document.removeEventListener('pdfProcessingProgress', () => {});
      document.removeEventListener('pdfProcessingComplete', () => {});
    }
  });
  
  async function handleFilesSelected(event: CustomEvent<{ files: File[] }>) {
    const newFiles = event.detail.files;
    files = [...files, ...newFiles];
    processNewFiles(newFiles);
    notifyLayoutAboutFiles();
  }
  
  // Common processing function
  async function processNewFiles(newFiles: File[]) {
    // Initialize progress tracking for new files
    newFiles.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'pdf') {
        // Only track PDF files since they have page-by-page progress
        processingStatus = [...processingStatus, {
          fileName: file.name,
          inProgress: true,
          progress: 0,
          total: 100 // Will be updated when we know actual page count
        }];
      }
    });
    
    // Process the new files to extract presentations
    processing = true;
    try {
      const newPresentations = await processFilesAsGroups(newFiles);
      presentations = [...presentations, ...newPresentations];
    } catch (error) {
      console.error('Error processing files:', error);
      // Show error message to user (in a real app)
    } finally {
      processing = false;
      
      // Ensure all files are marked as complete
      newFiles.forEach(file => completeProcessing(file.name));
    }
  }
  
  function handleRemoveFile(event: CustomEvent<{ index: number }>) {
    const { index } = event.detail;
    
    // Remove the file
    const removedFile = files[index];
    files = files.filter((_, i) => i !== index);
    
    // Remove all presentations from that file
    presentations = presentations.filter(presentation => presentation.fileName !== removedFile.name);
    
    // Remove processing status
    processingStatus = processingStatus.filter(status => status.fileName !== removedFile.name);
    
    // Notify layout about file status changes
    notifyLayoutAboutFiles();
  }
  
  function handleReorderPresentations(event: CustomEvent<{ presentations: PresentationGroup[] }>) {
    presentations = event.detail.presentations;
  }
  
  async function handleMerge() {
    merging = true;
    try {
      console.log('Starting presentation generation...');
      console.log('Number of presentations:', presentations.length);
      
      // Count number of total slides being processed
      const totalSlides = presentations.reduce((count, presentation) => {
        if (presentation.selected) {
          return count + presentation.slides.length;
        }
        return count;
      }, 0);
      
      console.log('Total slides to process:', totalSlides);
      
      const mergedPresentation = await mergePresentations(presentations);
      console.log('Presentation blob created, size:', mergedPresentation.size, 'type:', mergedPresentation.type);
      
      if (mergedPresentation.size === 0) {
        console.error('Generated presentation has zero size. Aborting download.');
        throw new Error('Failed to generate presentation (empty file)');
      }
      
      // Create a truly unique filename with timestamp and random component
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const randomId = Math.floor(Math.random() * 10000);
      const filename = `slidemerge_${timestamp}_${randomId}.pptx`;
      
      console.log('Initiating download with filename:', filename);
      
      // Create blob URL and trigger reactive download
      const blobUrl = URL.createObjectURL(mergedPresentation);
      downloadUrl = blobUrl;
      downloadFilename = filename;
      
      console.log('Download prepared with filename:', filename);
      
      // Trigger download via reactive anchor element
      setTimeout(() => {
        const downloadLink = document.getElementById('reactive-download-link') as HTMLAnchorElement;
        if (downloadLink) {
          downloadLink.click();
          console.log('Download triggered via reactive link with filename:', filename);
          
          // Track download with Plausible
          if (typeof window !== 'undefined' && 'plausible' in window) {
            (window as any).plausible('Download', { props: { slides: totalSlides } });
          }
          
          // Clean up blob URL after download
          setTimeout(() => {
            if (downloadUrl) {
              URL.revokeObjectURL(downloadUrl);
              downloadUrl = null;
              downloadFilename = '';
              console.log('Cleaned up download blob URL');
            }
          }, 2000);
        } else {
          console.error('Reactive download link not found');
        }
      }, 200);
      
      // Find the MergeControl component and dispatch a custom event
      const event = new CustomEvent('mergeComplete');
      if (browser) {  
        document.dispatchEvent(event);
        console.log('Merge complete event dispatched');
      }
      
      console.log('Download process completed successfully');
    } catch (error) {
      console.error('Error generating or downloading presentation:', error);
      // Show error message to user (in a real app)
    } finally {
      merging = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto py-6 min-h-[calc(100vh-180px)]">
  <section class="mb-8">
    <h2 class="text-xl font-bold mb-4 text-gray-100">1. Add Your Files</h2>
    <p class="text-gray-300 mb-6">
      Drop PDF documents and images anywhere on this page. Nothing is uploaded to any server.
    </p>
    <FileUpload on:filesSelected={handleFilesSelected} />
    
    {#if files.length > 0}
      <FileList files={files} {processingStatus} on:removeFile={handleRemoveFile} />
    {/if}
  </section>
  
  <!-- Remove the general spinner when there's file-specific progress -->
  {#if processing && processingStatus.length === 0}
    <div class="my-8 bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-md">
      <div class="flex items-center justify-center flex-col">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
        <span class="text-gray-300 font-medium">Processing files...</span>
        <p class="text-gray-400 text-sm mt-2 max-w-md text-center">
          Processing happens directly in your browser and may take some time depending on the file size.
        </p>
      </div>
    </div>
  {/if}
  
  {#if presentations.length > 0 && !processing}
    <section class="mb-10">
      <h2 class="text-xl font-bold my-4 text-gray-100">2. Organize Your Slides</h2>
      <PresentationManager presentations={presentations} on:reorderPresentations={handleReorderPresentations} />
      
      <h2 class="text-xl font-bold my-4 text-gray-100">3. Generate Presentation</h2>
      <MergeControl 
        presentations={presentations} 
        on:merge={handleMerge}
        {merging}
      />
    </section>
  {/if}
  
  {#if presentations.length === 0 && !processing}
    <div class="flex flex-col items-center justify-center py-16 my-8 bg-gray-800 border border-gray-700 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-300 mb-1">No files added yet</h3>
      <p class="text-gray-400 text-sm max-w-md text-center">
        Drag and drop PDF documents and images anywhere on this page. All processing happens in your browser - your files never leave your device.
      </p>
    </div>
  {/if}
  
  <!-- Hidden reactive download link -->
  {#if downloadUrl && downloadFilename}
    <a 
      id="reactive-download-link"
      href={downloadUrl} 
      download={downloadFilename}
      style="display: none;"
      aria-hidden="true"
    >Download</a>
  {/if}
</div>
