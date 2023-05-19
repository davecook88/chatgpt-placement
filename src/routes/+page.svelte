<script lang="ts">
	import { enhance } from '$app/forms';
	import { ref, onValue } from 'firebase/database';
	import type { ChatHistoryEntry } from '$lib/chat/types';
	import { ChatCompletionRequestMessageRoleEnum } from 'openai';
	import type { ActionData, PageData } from './$types';
	import { afterUpdate, onMount } from 'svelte';
	import { database } from '../firebase';

	export let data: PageData;
	$: console.log({ data });

	export let form: ActionData;
	$: chatId = data.chatId;
	let chatWindow: HTMLDivElement;
	let chatHistory: ChatHistoryEntry[] = [];

	const db = database;

	const initFirebaseConnection = () => {
		const chatRef = ref(db, `chats/${chatId}`);
		onValue(chatRef, (snapshot) => {
			const data = snapshot.val();
			chatHistory = data || [];
		});
	};

	$: if (chatId) {
		initFirebaseConnection();
	}

	const scrollToBottom = async (node: HTMLDivElement) => {
		node?.scroll({ top: node.scrollHeight, behavior: 'smooth' });
	};

	afterUpdate(() => {
		scrollToBottom(chatWindow);
	});

	let text: string;
	$: form, console.log(form);
	$: chatHistory, console.log(chatHistory);
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="h-screen relative">
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
					<!-- Split message by line and format each line as a paragraph -->
					{#each message.split('\n') as line}
						<p class="my-1">{line}</p>
					{/each}
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
				<input type="hidden" name="chatId" value={chatId} />
			</label>
		</form>

		<form method="POST" action="?/clearmessages" use:enhance>
			<input type="hidden" name="chatId" value={chatId} />
			<button
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				aria-label="clear">Clear</button
			>
		</form>
	</div>
</div>
