<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let text: string = '';
	export let action: string;
	export let form: ActionData;
</script>

{#if form?.error}
	<div>{form.error}</div>
{/if}

<form method="POST" {action}>
	<label>
		Input text
		<input bind:value={text} name="message" />
	</label>
</form>
