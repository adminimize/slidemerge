<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    filesSelected: { files: File[] }
  }>();
  
  let dragActive = $state(false);
  
  // Define the accepted file types - only PDF, JPG, and PNG
  const acceptedFileTypes = '.pdf,.jpg,.jpeg,.png';
  
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
    
    if (e.dataTransfer?.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      validateAndDispatchFiles(newFiles);
    }
  }
  
  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      const newFiles = Array.from(target.files);
      validateAndDispatchFiles(newFiles);
    }
  }
  
  function validateAndDispatchFiles(newFiles: File[]) {
    // Filter for only PDF, JPG and PNG files
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
    });
    
    if (validFiles.length > 0) {
      dispatch('filesSelected', { files: validFiles });
    }
  }
</script>

<!-- The drop zone component for this specific area -->
<div 
  class="border-2 border-dashed rounded-lg p-8 text-center transition-colors min-h-[240px] flex items-center justify-center"
  class:border-blue-500={dragActive}
  class:border-gray-600={!dragActive}
  class:bg-gray-700={dragActive}
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <div class="flex flex-col items-center justify-center gap-4">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
    </svg>
    
    <div class="text-lg font-medium text-gray-300">
      Drop files for local processing
    </div>
    
    <p class="text-sm text-gray-400">
      All processing happens directly in your browser - no uploads
    </p>
    
    <label class="mt-2">
      <input 
        type="file" 
        multiple 
        accept={acceptedFileTypes}
        class="hidden" 
        oninput={handleFileInput}
      />
      <span class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer text-sm">
        Select Files
      </span>
    </label>
  </div>
</div> 