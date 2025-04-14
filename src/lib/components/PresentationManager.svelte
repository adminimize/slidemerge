<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import type { SlideItem } from '../components/SlideManager.svelte';
  import Sortable from 'sortablejs';
  
  const dispatch = createEventDispatcher<{
    reorderPresentations: { presentations: PresentationGroup[] }
  }>();
  
  export interface PresentationGroup {
    id: string;
    fileName: string;
    fileType: string; // pdf, ppt, pptx
    slides: SlideItem[];
    selected: boolean;
    thumbnail: string; // Thumbnail of first slide
  }
  
  // Using mutable state with Svelte 5 runes
  let { presentations } = $props<{ presentations: PresentationGroup[] }>();
  
  // Keep track of the Sortable instance
  let sortableInstance: Sortable | null = null;
  let presentationsContainer: HTMLElement;
  
  // Initialize Sortable on mount
  onMount(() => {
    if (typeof window !== 'undefined' && presentationsContainer) {
      sortableInstance = Sortable.create(presentationsContainer, {
        animation: 150,
        ghostClass: 'bg-gray-100', // Class applied to the ghost element
        chosenClass: 'bg-gray-50', // Class applied to the chosen item
        dragClass: 'shadow-lg', // Class applied to the dragging element
        handle: '.drag-handle', // Only allow dragging from the handle
        onEnd: (evt) => {
          // When drag ends, update the presentations array
          if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
            // Use the actual DOM order after drag to get the correct order
            // and dispatch it back to the parent component
            const items = presentationsContainer.querySelectorAll('[data-id]');
            const itemIds = Array.from(items).map(item => item.getAttribute('data-id'));
            
            // Create a new array based on the new order of IDs
            const reorderedPresentations = itemIds.map(id => 
              presentations.find((p: PresentationGroup) => p.id === id)
            ).filter(Boolean) as PresentationGroup[];
            
            // Dispatch the reordered presentations to the parent
            dispatch('reorderPresentations', { presentations: reorderedPresentations });
          }
        }
      });
    }
  });
  
  // Clean up on destroy
  onDestroy(() => {
    if (sortableInstance) {
      sortableInstance.destroy();
      sortableInstance = null;
    }
  });
  
  function toggleSelection(id: string) {
    const newPresentations = presentations.map((presentation: PresentationGroup) => 
      presentation.id === id ? { ...presentation, selected: !presentation.selected } : presentation
    );
    
    dispatch('reorderPresentations', { presentations: newPresentations });
  }
  
  function selectAll() {
    const newPresentations = presentations.map((presentation: PresentationGroup) => 
      ({ ...presentation, selected: true })
    );
    dispatch('reorderPresentations', { presentations: newPresentations });
  }
  
  function deselectAll() {
    const newPresentations = presentations.map((presentation: PresentationGroup) => 
      ({ ...presentation, selected: false })
    );
    dispatch('reorderPresentations', { presentations: newPresentations });
  }
</script>

{#if presentations.length > 0}
  <div class="mt-8">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium text-gray-700">Presentation Manager</h2>
      <div class="space-x-2">
        <button 
          onclick={selectAll} 
          class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
          Select All
        </button>
        <button 
          onclick={deselectAll} 
          class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
          Deselect All
        </button>
      </div>
    </div>
    
    <div bind:this={presentationsContainer} class="space-y-4">
      {#each presentations as presentation (presentation.id)}
        <div 
          class="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all p-4"
          class:border-blue-400={presentation.selected}
          class:border-gray-200={!presentation.selected}
          class:bg-blue-50={presentation.selected}
          data-id={presentation.id}
        >
          <div class="flex items-center gap-4">
            <!-- Drag handle -->
            <div class="drag-handle cursor-move p-2 -m-2 text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>
            
            <!-- Thumbnail preview -->
            <div 
              class="w-24 h-24 flex-shrink-0 flex items-center justify-center border rounded"
              class:bg-white={!presentation.selected}
              class:bg-blue-50={presentation.selected}
            >
              {#if presentation.thumbnail && !presentation.thumbnail.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0g')}
                <!-- Actual thumbnail from PDF or image -->
                <img 
                  src={presentation.thumbnail} 
                  alt={`Preview of ${presentation.fileName}`}
                  class="max-w-full max-h-full object-contain shadow-sm"
                />
              {:else}
                <!-- Placeholder for slides without real thumbnails -->
                <div class="text-center">
                  <div class="text-xs text-gray-500 mt-1">
                    {presentation.fileType.toUpperCase()}
                  </div>
                </div>
              {/if}
            </div>
            
            <!-- File information -->
            <div class="flex-grow">
              <h3 class="font-medium text-gray-800">{presentation.fileName}</h3>
              <p class="text-sm text-gray-500 mt-1">
                {presentation.slides.length} slides • {presentation.fileType.toUpperCase()}
              </p>
            </div>
            
            <!-- Selection toggle -->
            <div 
              class="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
              class:bg-blue-600={presentation.selected}
              class:bg-white={!presentation.selected}
              class:text-white={presentation.selected}
              class:text-gray-500={!presentation.selected}
              class:border={!presentation.selected}
              class:border-gray-300={!presentation.selected}
              class:shadow-sm={presentation.selected}
              onclick={() => toggleSelection(presentation.id)}
            >
              {#if presentation.selected}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if} 