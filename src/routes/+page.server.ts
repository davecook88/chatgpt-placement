import { chat } from '$lib/chat/PlacementChat';
import { fail } from '@sveltejs/kit';

import type { Actions } from './$types';
import { ChatBotAction } from './types';

export function load() {
	console.log('loading');
	console.log(chat.history);
	return {
		chatHistory: chat.history
	};
}

export const actions: Actions = {
	[ChatBotAction.POST_MESSAGE]: async ({ request }) => {
		const data = await request.formData();
		const message = data.get('message') as string;
		console.log('message received', message);
		if (!message) {
			return fail(400, {
				error: 'Please write a message'
			});
		}
		await chat.sendUserMessage(message);
		await chat.forwardToAI();
		return { success: true };
	},
	[ChatBotAction.CLEAR_MESSAGES]: async () => {
		chat.clear();
		return { success: true };
	}
};
