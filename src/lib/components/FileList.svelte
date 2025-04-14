<script lang="ts">
  // @ts-ignore: Ignore type errors in this component
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    removeFile: { index: number }
  }>();

  // Define props
  let { files, processingStatus = [] } = $props<{ 
    files: File[], 
    processingStatus: Array<{
      fileName: string,
      inProgress: boolean,
      progress: number,
      total: number
    }>
  }>();

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
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
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

  // Define the type for processing status
  type FileProcessingStatus = {
    fileName: string;
    inProgress: boolean;
    progress: number;
    total: number;
  };

  // Helper function to get the processing status for a file
  function getProcessingStatus(fileName: string): FileProcessingStatus | undefined {
    return processingStatus.find(status => status.fileName === fileName);
  }
</script>

{#if files.length > 0}
  <div class="mt-6">
    <h2 class="text-lg font-medium text-gray-200 mb-3">Uploaded Files</h2>
    <ul class="space-y-2">
      {#each files as file, index}
        {@const status = getProcessingStatus(file.name) as FileProcessingStatus | undefined}
        <li class="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col shadow-md">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                {@html getFileIcon(file.name)}
              </div>
              <div>
                <p class="font-medium text-gray-200">{file.name}</p>
                <p class="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button 
              class="text-red-400 hover:text-red-300" 
              title="Remove file"
              onclick={() => handleRemoveFile(index)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          
          <!-- Individual file progress bar -->
          {#if status && status.inProgress}
            <div class="mt-2">
              <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Processing {status.progress} of {status.total} pages</span>
                <span>{Math.round((status.progress / status.total) * 100)}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  class="h-full bg-blue-500 rounded-full transition-all duration-200" 
                  style={`width: ${(status.progress / status.total) * 100}%`}
                ></div>
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/if} 