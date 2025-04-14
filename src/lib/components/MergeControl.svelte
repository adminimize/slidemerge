<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import type { SlideItem } from './SlideManager.svelte';
  import type { PresentationGroup } from './PresentationManager.svelte';
  
  const dispatch = createEventDispatcher<{
    merge: void
  }>();
  
  const { presentations = [] } = $props<{ presentations?: PresentationGroup[] }>();
  
  // Internal state for merging indicator
  let merging = $state(false);
  
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
    
    merging = true;
    dispatch('merge');
    
    // Reset the merging state after a reasonable timeout
    // This ensures the spinner doesn't run forever if something goes wrong
    setTimeout(() => {
      merging = false;
    }, 10000);
  }
  
  // Listen for the custom event when merge is complete
  function handleMergeComplete() {
    merging = false;
  }
</script>

<div class="mt-6 bg-white p-4 rounded-lg border shadow-sm">
  <!-- Implementation note banner -->
  <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
    <p class="font-medium">Implementation Notes:</p>
    <p class="mt-1">
      • PDF files are fully supported with real page extraction (limited to first 50 pages)
    </p>
    <p class="mt-1">
      • Image files (JPG, PNG, etc.) can be directly included as slides
    </p>
    <p class="mt-1">
      • PowerPoint files (PPT, PPTX) are not supported - please use PowerPoint's built-in merge features for these
    </p>
    <p class="mt-2 text-xs">
      <strong>Note:</strong> Processing large PDFs may be slow and memory-intensive. For best results, use PDFs with fewer pages.
    </p>
  </div>

  <div class="flex items-center justify-between">
    <div class="text-gray-600">
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
        Merge Selected Presentations
      {/if}
    </button>
  </div>
</div> 