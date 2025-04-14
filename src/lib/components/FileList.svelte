<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    removeFile: { index: number }
  }>();

  // Define props
  let { files } = $props<{ files: File[] }>();

  function handleRemoveFile(index: number) {
    dispatch('removeFile', { index });
  }

  function getFileIcon(fileName: string) {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'pdf':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                  <path fill-rule="evenodd" d="M8 10a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 3a1 1 0 100 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
                </svg>`;
      case 'ppt':
      case 'pptx':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                  <path fill-rule="evenodd" d="M12 7a1 1 0 10-2 0v1H9a1 1 0 000 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" clip-rule="evenodd" />
                </svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                </svg>`;
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

{#if files.length > 0}
  <div class="mt-6">
    <h2 class="text-lg font-medium text-gray-700 mb-3">Uploaded Files</h2>
    <ul class="space-y-2">
      {#each files as file, index}
        <li class="bg-white p-3 rounded-lg border flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              {@html getFileIcon(file.name)}
            </div>
            <div>
              <p class="font-medium text-gray-800">{file.name}</p>
              <p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button 
            class="text-red-500 hover:text-red-700" 
            title="Remove file"
            onclick={() => handleRemoveFile(index)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </li>
      {/each}
    </ul>
  </div>
{/if} 