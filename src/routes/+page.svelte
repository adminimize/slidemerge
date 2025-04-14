<script lang="ts">
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

  // Handle page-level file drop events
  function handleFilesDroppedOnPage(event: Event) {
    const customEvent = event as CustomEvent<{ files: File[] }>;
    const newFiles = customEvent.detail.files;
    // Use the same validation and processing as regular file selection
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    });
    
    if (validFiles.length > 0) {
      files = [...files, ...validFiles];
      processNewFiles(validFiles);
    }
  }

  // Listen for files dropped anywhere on the page
  onMount(() => {
    document.addEventListener('filesDroppedOnPage', handleFilesDroppedOnPage);
  });

  onDestroy(() => {
    document.removeEventListener('filesDroppedOnPage', handleFilesDroppedOnPage);
  });
  
  async function handleFilesSelected(event: CustomEvent<{ files: File[] }>) {
    const newFiles = event.detail.files;
    files = [...files, ...newFiles];
    processNewFiles(newFiles);
  }
  
  // Common processing function
  async function processNewFiles(newFiles: File[]) {
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
    }
  }
  
  function handleRemoveFile(event: CustomEvent<{ index: number }>) {
    const { index } = event.detail;
    
    // Remove the file
    const removedFile = files[index];
    files = files.filter((_, i) => i !== index);
    
    // Remove all presentations from that file
    presentations = presentations.filter(presentation => presentation.fileName !== removedFile.name);
  }
  
  function handleReorderPresentations(event: CustomEvent<{ presentations: PresentationGroup[] }>) {
    presentations = event.detail.presentations;
  }
  
  async function handleMerge() {
    merging = true;
    try {
      const mergedPresentation = await mergePresentations(presentations);
      await downloadPresentation(mergedPresentation, 'merged_presentation.pptx');
      
      // Find the MergeControl component and dispatch a custom event
      const event = new CustomEvent('mergeComplete');
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Error merging presentations:', error);
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
      <span class="bg-gray-700 px-2 py-1 rounded text-sm font-medium">📌 100% local processing</span> 
      Drop PDF documents and images anywhere on this page. Nothing is uploaded to any server.
    </p>
    <FileUpload on:filesSelected={handleFilesSelected} />
    
    {#if files.length > 0}
      <FileList files={files} on:removeFile={handleRemoveFile} />
    {/if}
  </section>
  
  {#if processing}
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
</div>
