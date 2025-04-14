<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SlideItem } from '../components/SlideManager.svelte';
  
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
  
  let { presentations } = $props<{ presentations: PresentationGroup[] }>();
  
  function toggleSelection(id: string) {
    presentations = presentations.map((presentation: PresentationGroup) => 
      presentation.id === id ? { ...presentation, selected: !presentation.selected } : presentation
    );
    
    dispatch('reorderPresentations', { presentations });
  }

  function movePresentation(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    
    const newPresentations = [...presentations];
    const [movedItem] = newPresentations.splice(fromIndex, 1);
    newPresentations.splice(toIndex, 0, movedItem);
    
    presentations = newPresentations;
    dispatch('reorderPresentations', { presentations });
  }
  
  function handleDragStart(e: DragEvent, index: number) {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    return false;
  }
  
  function handleDrop(e: DragEvent, toIndex: number) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    movePresentation(fromIndex, toIndex);
  }
  
  function selectAll() {
    presentations = presentations.map((presentation: PresentationGroup) => ({ ...presentation, selected: true }));
    dispatch('reorderPresentations', { presentations });
  }
  
  function deselectAll() {
    presentations = presentations.map((presentation: PresentationGroup) => ({ ...presentation, selected: false }));
    dispatch('reorderPresentations', { presentations });
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
    
    <div class="space-y-4">
      {#each presentations as presentation, index}
        <div 
          class="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all p-4"
          class:border-blue-400={presentation.selected}
          class:border-gray-200={!presentation.selected}
          class:bg-blue-50={presentation.selected}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, index)}
          ondragover={(e) => handleDragOver(e)}
          ondrop={(e) => handleDrop(e, index)}
        >
          <div class="flex items-center gap-4">
            <!-- Thumbnail preview -->
            <div 
              class="w-24 h-24 flex-shrink-0 flex items-center justify-center border rounded"
              class:bg-white={!presentation.selected}
              class:bg-blue-50={presentation.selected}
            >
              {#if presentation.thumbnail && !presentation.thumbnail.startsWith('data:image/png;base64,iVBORw0KGgo')}
                <!-- Actual thumbnail from PDF -->
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