<script lang="ts">
  import FileUpload from '$lib/components/FileUpload.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import PresentationManager from '$lib/components/PresentationManager.svelte';
  import MergeControl from '$lib/components/MergeControl.svelte';
  import { processFilesAsGroups, mergePresentations, downloadPresentation } from '$lib/services/fileProcessor';
  import type { PresentationGroup } from '$lib/components/PresentationManager.svelte';
  
  let files = $state<File[]>([]);
  let presentations = $state<PresentationGroup[]>([]);
  let processing = $state(false);
  
  async function handleFilesSelected(event: CustomEvent<{ files: File[] }>) {
    const newFiles = event.detail.files;
    files = [...files, ...newFiles];
    
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
    try {
      const mergedPresentation = await mergePresentations(presentations);
      downloadPresentation(mergedPresentation, 'merged_presentation.pptx');
    } catch (error) {
      console.error('Error merging presentations:', error);
      // Show error message to user (in a real app)
    }
  }
</script>

<div class="max-w-4xl mx-auto">
  <section class="mt-6">
    <h2 class="text-xl font-bold mb-4">1. Upload Your Presentations</h2>
    <FileUpload on:filesSelected={handleFilesSelected} />
    
    {#if files.length > 0}
      <FileList files={files} on:removeFile={handleRemoveFile} />
    {/if}
  </section>
  
  {#if processing}
    <div class="mt-8 bg-white border rounded-lg p-6 shadow-sm">
      <div class="flex items-center justify-center flex-col">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <span class="text-gray-700 font-medium">Processing files...</span>
        <p class="text-gray-500 text-sm mt-2 max-w-md text-center">
          Processing happens entirely in your browser and may take some time depending on the file size and number of pages.
        </p>
      </div>
    </div>
  {/if}
  
  {#if presentations.length > 0 && !processing}
    <section>
      <PresentationManager presentations={presentations} on:reorderPresentations={handleReorderPresentations} />
      
      <MergeControl presentations={presentations} on:merge={handleMerge} />
    </section>
  {/if}
</div>
