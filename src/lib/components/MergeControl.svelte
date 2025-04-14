<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import type { SlideItem } from './SlideManager.svelte';
  import type { PresentationGroup } from './PresentationManager.svelte';
  
  const dispatch = createEventDispatcher<{
    merge: void
  }>();
  
  const { presentations = [], merging = false } = $props<{ 
    presentations?: PresentationGroup[], 
    merging?: boolean 
  }>();
  
  // We'll use the prop value instead of local state
  let selectedCount = $derived(presentations.filter((presentation: PresentationGroup) => presentation.selected).length);
  let totalSlides = $derived(presentations.reduce((total: number, presentation: PresentationGroup) => {
    if (presentation.selected) {
      return total + presentation.slides.length;
    }
    return total;
  }, 0));
  let canMerge = $derived(selectedCount > 0);
  
  // Set up listeners for merge complete event
  onMount(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('mergeComplete', handleMergeComplete);
    }
  });
  
  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mergeComplete', handleMergeComplete);
    }
  });
  
  function handleMerge() {
    if (!canMerge) return;
    dispatch('merge');
  }
  
  // Listen for the custom event when merge is complete
  function handleMergeComplete() {
    // This event is handled by the parent now
  }
</script>

<div class="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
  <!-- Implementation note banner -->
  <div class="mb-4 p-3 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-300">
    <p class="font-medium">Implementation Notes:</p>
    <p class="mt-1">
      • PDF files are fully supported with real page extraction (limited to first 100 pages)
    </p>
    <p class="mt-1">
      • Image files (JPG and PNG only) can be directly included as slides
    </p>
    <p class="mt-1">
      • PowerPoint files (PPT, PPTX) are not supported at this time
    </p>
    <p class="mt-2 text-xs text-gray-400">
      <strong>Note:</strong> Processing large PDFs may be slow and memory-intensive. For best results, use PDFs with fewer pages.
    </p>
  </div>

  <div class="flex items-center justify-between">
    <div class="text-gray-400">
      <p>
        <span class="font-medium">{selectedCount}</span> presentations selected
        ({totalSlides} total slides)
      </p>
    </div>
    
    <button 
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!canMerge || merging}
      onclick={handleMerge}
    >
      {#if merging}
        <span class="flex items-center">
          <span class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          Merging...
        </span>
      {:else}
        Download
      {/if}
    </button>
  </div>
</div> 