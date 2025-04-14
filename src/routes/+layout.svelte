<script lang="ts">
	import '../app.css';
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-blue-600 text-white p-4 shadow-md">
		<div class="container mx-auto">
			<h1 class="text-2xl font-bold">Slide Merge</h1>
			<p class="text-sm">Merge presentation files client-side</p>
		</div>
	</header>
	
	<main class="container mx-auto p-4">
		<slot />
	</main>
	
	<footer class="bg-gray-100 p-4 mt-8 border-t">
		<div class="container mx-auto text-center text-gray-600 text-sm">
			&copy; Slide Merge - All processing happens in your browser
		</div>
	</footer>
</div>
