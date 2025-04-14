<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import Sortable from 'sortablejs';
  
  const dispatch = createEventDispatcher<{
    reorderSlides: { slides: SlideItem[] }
  }>();
  
  export interface SlideItem {
    id: string;
    file: string; // Original filename
    fileType: string; // pdf, ppt, pptx
    index: number; // Original slide index
    thumbnail: string; // Data URL for the slide thumbnail
    fullImage?: string; // Data URL for the full-size slide image (1920x1080)
    selected: boolean;
    dimensions?: {
      width: number;
      height: number;
      scaledWidth: number;
      scaledHeight: number;
    };
  }
  
  // Using mutable state with Svelte 5 runes
  let { slides } = $props<{ slides: SlideItem[] }>();
  
  // Keep track of the Sortable instance
  let sortableInstance: Sortable | null = null;
  let slidesContainer: HTMLElement;
  
  // Initialize Sortable on mount
  onMount(() => {
    if (typeof window !== 'undefined' && slidesContainer) {
      sortableInstance = Sortable.create(slidesContainer, {
        animation: 150,
        ghostClass: 'opacity-60',
        chosenClass: 'shadow-lg',
        dragClass: 'cursor-grabbing',
        dataIdAttr: 'data-id',
        handle: '.slide-handle', // Only allow dragging from the handle
        onEnd: (evt) => {
          // When drag ends, update the slides array
          if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
            // Use the actual DOM order after drag to get the correct order
            const items = slidesContainer.querySelectorAll('[data-id]');
            const itemIds = Array.from(items).map(item => item.getAttribute('data-id'));
            
            // Create a new array based on the new order of IDs
            const reorderedSlides = itemIds.map(id => 
              slides.find((slide: SlideItem) => slide.id === id)
            ).filter(Boolean) as SlideItem[];
            
            // Dispatch the reordered slides to the parent
            dispatch('reorderSlides', { slides: reorderedSlides });
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
    const newSlides = slides.map((slide: SlideItem) => 
      slide.id === id ? { ...slide, selected: !slide.selected } : slide
    );
    
    dispatch('reorderSlides', { slides: newSlides });
  }
  
  function selectAll() {
    const newSlides = slides.map((slide: SlideItem) => ({ ...slide, selected: true }));
    dispatch('reorderSlides', { slides: newSlides });
  }
  
  function deselectAll() {
    const newSlides = slides.map((slide: SlideItem) => ({ ...slide, selected: false }));
    dispatch('reorderSlides', { slides: newSlides });
  }
</script>

{#if slides.length > 0}
  <div class="mt-8">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium text-gray-700">Slide Manager</h2>
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
    
    <div bind:this={slidesContainer} class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {#each slides as slide (slide.id)}
        <div 
          class="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-grab"
          class:border-blue-400={slide.selected}
          class:border-gray-200={!slide.selected}
          class:bg-blue-50={slide.selected}
          data-id={slide.id}
        >
          <div class="relative slide-handle">
            <div 
              class="w-full aspect-[4/3] flex items-center justify-center p-4"
              class:bg-white={!slide.selected}
              class:bg-blue-50={slide.selected}
            >
              <!-- Check if this is a placeholder image -->
              {#if slide.thumbnail && !slide.thumbnail.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0g')}
                <!-- Actual thumbnail from PDF or image -->
                <img 
                  src={slide.thumbnail} 
                  alt={`Slide ${slide.index + 1} from ${slide.file}`}
                  class="max-w-full max-h-full object-contain shadow-sm"
                />
              {:else}
                <!-- Placeholder for slides without real thumbnails -->
                <div class="text-center">
                  <div class="font-medium text-gray-800">Slide {slide.index + 1}</div>
                  <div class="text-xs text-gray-500 truncate max-w-full mt-1">
                    {slide.file}
                  </div>
                  <div class="mt-3 border border-dashed rounded p-2 text-xs text-gray-400 border-gray-200">
                    {slide.fileType.toUpperCase()} format
                  </div>
                </div>
              {/if}
              
              <!-- Tiny drag indicator -->
              <div class="absolute top-2 left-2 text-gray-400 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>
            <div 
              class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all"
              class:bg-blue-600={slide.selected}
              class:bg-white={!slide.selected}
              class:text-white={slide.selected}
              class:text-gray-500={!slide.selected}
              class:border={!slide.selected}
              class:border-gray-300={!slide.selected}
              class:shadow-sm={slide.selected}
              onclick={() => toggleSelection(slide.id)}
            >
              {#if slide.selected}
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