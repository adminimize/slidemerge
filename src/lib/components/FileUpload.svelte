<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    filesSelected: { files: File[] }
  }>();
  
  let dragActive = $state(false);
  
  // Define the accepted file types - removing PPT/PPTX
  const acceptedFileTypes = '.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg';
  
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
    // Filter for only PDF and image files
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    });
    
    if (validFiles.length > 0) {
      dispatch('filesSelected', { files: validFiles });
    }
  }
</script>

<div 
  class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
  class:border-blue-400={dragActive}
  class:border-gray-300={!dragActive}
  class:bg-blue-50={dragActive}
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <div class="flex flex-col items-center justify-center gap-4">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
    </svg>
    
    <div class="text-lg font-medium text-gray-700">
      Drag & drop files here
    </div>
    
    <p class="text-sm text-gray-500">
      Supports PDF and image files (JPG, PNG, etc.)
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