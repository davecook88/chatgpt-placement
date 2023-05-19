import { PlacementChat } from '$lib/chat/PlacementChat';
import { fail } from '@sveltejs/kit';
import { v4 as uuidv4, validate as isValidUUID } from 'uuid';

import type { Actions } from './$types';
import { ChatBotAction } from './types';

export const load = async ({ cookies }) => {
	let chatId = cookies.get('chatId');
	if (!chatId || !isValidUUID(chatId)) {
		chatId = uuidv4();
	}

	cookies.set('chatId', chatId.toString(), { path: '/' });
	new PlacementChat({ chatId });
	return { chatId };
};

export const actions: Actions = {
	[ChatBotAction.POST_MESSAGE]: async ({ request }) => {
		const data = await request.formData();
		const message = data.get('message') as string;
		const chatId = data.get('chatId') as string;
		console.log('message received', message);
		if (!message) {
			return fail(400, {
				error: 'Please write a message'
			});
		}
		const chat = new PlacementChat({ chatId });

		await chat.sendUserMessage(message);
		await chat.forwardToAI();
		return { success: true };
	},
	[ChatBotAction.CLEAR_MESSAGES]: async ({ request }) => {
		const data = await request.formData();
		const chatId = data.get('chatId') as string;
		const chat = new PlacementChat({ chatId });
		chat.clear();
		return { success: true };
	}
};
