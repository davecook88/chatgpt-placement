<script lang="ts">
	import { enhance } from '$app/forms';
	import { getDatabase, ref, onValue } from 'firebase/database';
	import type { ChatHistoryEntry } from '$lib/chat/types';
	import { ChatCompletionRequestMessageRoleEnum } from 'openai';
	import type { ActionData } from './$types';
	import { afterUpdate, onMount } from 'svelte';
	import { database } from '../firebase';

	export let form: ActionData;
	let chatId: string;
	let chatWindow: HTMLDivElement;
	let chatHistory: ChatHistoryEntry[] = [];

	onMount(async () => {
		chatId = uuidv4();
	});

	const db = database;

	const chatRef = ref(db, 'chats/placement-chat');
	onValue(chatRef, (snapshot) => {
		const data = snapshot.val();
		chatHistory = data || [];
	});

	const scrollToBottom = async (node: HTMLDivElement) => {
		node?.scroll({ top: node.scrollHeight, behavior: 'smooth' });
	};

	afterUpdate(() => {
		scrollToBottom(chatWindow);
	});

	let text: string;
	$: form, console.log(form);
	$: chatHistory, console.log(chatHistory);

	function uuidv4(): string {
		throw new Error('Function not implemented.');
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="h-full relative">
	<div class="p-1 h-5/6 bg-white m-1 overflow-auto" bind:this={chatWindow}>
		{#each Object.entries(chatHistory) as [timestamp, { message, role }]}
			<div
				class="w-full flex"
				class:justify-end={role === ChatCompletionRequestMessageRoleEnum.User}
			>
				<div
					class:bg-blue-400={role === ChatCompletionRequestMessageRoleEnum.User}
					class:bg-green-500={role === ChatCompletionRequestMessageRoleEnum.Assistant}
					class="m-1 rounded-sm border border-black w-fit block p-2"
				>
					{message}
					<small class="text-xs">{timestamp}</small>
				</div>
			</div>
		{/each}
	</div>
	<!-- absolute div which sticks to the bottom -->
	<div class=" bottom-0 p-2 w-full h-1/6">
		<form method="POST" action="?/postmessage" use:enhance>
			<label>
				Input text
				<input class="w-full rounded-sm" bind:value={text} name="message" />
			</label>
		</form>

		<form method="POST" action="?/clearmessages" use:enhance>
			<button
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				aria-label="clear">Clear</button
			>
		</form>
	</div>
</div>
