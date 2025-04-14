<script lang="ts">
	import '../app.css';
	import { createEventDispatcher } from 'svelte';
	
	// Add page-level drag and drop handling
	let dragActive = $state(false);
	
	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = true;
	}
	
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}
	
	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		// Only deactivate if we're leaving the document
		const rect = document.documentElement.getBoundingClientRect();
		if (
			e.clientX <= rect.left ||
			e.clientX >= rect.right ||
			e.clientY <= rect.top ||
			e.clientY >= rect.bottom
		) {
			dragActive = false;
		}
	}
	
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;
		
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			// Create and dispatch a custom event for the whole page
			const event = new CustomEvent('filesDroppedOnPage', {
				detail: { files: Array.from(e.dataTransfer.files) },
				bubbles: true
			});
			document.dispatchEvent(event);
		}
	}
</script>

<div 
	class="min-h-screen bg-gray-900 text-gray-200"
	ondragenter={handleDragEnter}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<header class="bg-gray-800 text-white p-4 shadow-md">
		<div class="container mx-auto">
			<h1 class="text-2xl font-bold">slide merge</h1>
			<p class="text-sm text-gray-300">runs on your machine, nothing uploads to cloud</p>
		</div>
	</header>
	
	<main class="container mx-auto p-4 min-h-[calc(100vh-180px)]">
		<slot />
	</main>
	
	<footer class="bg-gray-800 p-4 border-t border-gray-700">
		<div class="container mx-auto text-center text-gray-400 text-sm">
			&copy; adminimize, 2025 - <a href="https://github.com/adminimize/slidemerge" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300">GitHub</a>
		</div>
	</footer>
	
	<!-- This overlay covers the entire page when dragging -->
	{#if dragActive}
		<div 
			class="fixed inset-0 bg-gray-800 bg-opacity-70 z-50 flex items-center justify-center transition-all"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<div class="bg-gray-700 p-10 rounded-xl border-2 border-dashed border-blue-400 text-center max-w-lg">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
				</svg>
				<div class="text-xl font-medium text-white mb-2">
					Drop files to process locally
				</div>
				<p class="text-gray-300">
					Your files stay on your device - nothing will be uploaded
				</p>
			</div>
		</div>
	{/if}
</div>
