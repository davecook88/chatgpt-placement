<script lang="ts">
	import '../app.css';
	import Navbar from './Navbar.svelte';
</script>

<div class="max-h-screen">
	<header class="bg-white dark:bg-gray-900 shadow">
		<div class="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-200">
				Thrive in Spanish
			</h1>
		</div>
	</header>

	<slot />
</div>
