<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
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
  
  let { slides } = $props<{ slides: SlideItem[] }>();
  
  function toggleSelection(id: string) {
    slides = slides.map((slide: SlideItem) => 
      slide.id === id ? { ...slide, selected: !slide.selected } : slide
    );
    
    dispatch('reorderSlides', { slides });
  }

  function moveSlide(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    
    const newSlides = [...slides];
    const [movedItem] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, movedItem);
    
    slides = newSlides;
    dispatch('reorderSlides', { slides });
  }
  
  function handleDragStart(e: DragEvent, index: number) {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  }
  
  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    return false;
  }
  
  function handleDrop(e: DragEvent, toIndex: number) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    moveSlide(fromIndex, toIndex);
  }
  
  function selectAll() {
    slides = slides.map((slide: SlideItem) => ({ ...slide, selected: true }));
    dispatch('reorderSlides', { slides });
  }
  
  function deselectAll() {
    slides = slides.map((slide: SlideItem) => ({ ...slide, selected: false }));
    dispatch('reorderSlides', { slides });
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
    
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {#each slides as slide, index}
        <div 
          class="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
          class:border-blue-400={slide.selected}
          class:border-gray-200={!slide.selected}
          class:bg-blue-50={slide.selected}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, index)}
          ondragover={(e) => handleDragOver(e, index)}
          ondrop={(e) => handleDrop(e, index)}
        >
          <div class="relative">
            <div 
              class="w-full aspect-[4/3] flex items-center justify-center p-4"
              class:bg-white={!slide.selected}
              class:bg-blue-50={slide.selected}
            >
              {#if slide.thumbnail && !slide.thumbnail.startsWith('data:image/png;base64,iVBORw0KGgo')}
                <!-- Actual thumbnail from PDF -->
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