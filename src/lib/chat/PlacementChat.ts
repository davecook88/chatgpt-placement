import { ref, set, get } from 'firebase/database';

import { openai } from '$lib/openai/client';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { SYSTEM_MESSAGE } from './proompt';
import type { ChatHistoryEntry } from './types';
import { database } from '../../firebase';

type ChatHistoryKey = string;

type ChatHistoryRecord = Record<ChatHistoryKey, ChatHistoryEntry>;

export class PlacementChat {
	get chatId() {
		return 'placement-chat';
	}

	constructor() {
		this.addSystemMessage();
	}

	private addSystemMessage = () => {
		this.addChatEntry(SYSTEM_MESSAGE, ChatCompletionRequestMessageRoleEnum.Assistant);
	};

	private printModels = async () => {
		const models = await openai.listModels();
		console.log(models.data.data);
	};

	async getHistory(): Promise<ChatHistoryRecord> {
		return await get(ref(database, `chats/${this.chatId}`)).then((snapshot) => {
			if (snapshot.exists()) {
				console.log('snapshot_found', snapshot.val());
				return snapshot.val();
			} else {
				console.log('No data available');
				return [];
			}
		});
	}

	clear() {
		throw new Error('Method not implemented.');
		// this.chatHistory = [];
	}

	private addChatEntry = (message: string, role: ChatCompletionRequestMessageRoleEnum) => {
		const entry: ChatHistoryEntry = {
			message,
			role,
			timestamp: new Date().toISOString()
		};
		console.log('adding entry', entry);
		const db = database;
		const timestamp = new Date().getTime();
		set(ref(db, `chats/${this.chatId}/${timestamp}`), entry);
		console.log('added entry', entry);
	};

	async sendUserMessage(message: string) {
		// if last message is from user, remove it
		// if (
		// 	this.chatHistory.length &&
		// 	this.chatHistory[this.chatHistory.length - 1].role ===
		// 		ChatCompletionRequestMessageRoleEnum.User
		// ) {
		// 	this.chatHistory = this.chatHistory.slice(0, -1);
		// }
		const chatHistory = await this.getHistory();
		const chatHistoryEntries = Object.values(chatHistory);
		if (!chatHistoryEntries.length) {
			this.addSystemMessage();
		}

		this.addChatEntry(message, ChatCompletionRequestMessageRoleEnum.User);
	}

	private addAIResponse = (message: string) => {
		this.addChatEntry(message, ChatCompletionRequestMessageRoleEnum.Assistant);
	};

	forwardToAI = async (chatHistoryEntries?: ChatHistoryEntry[]) => {
		if (!chatHistoryEntries) {
			const chatHistory = await this.getHistory();
			chatHistoryEntries = Object.values(chatHistory);
		}

		const messages = chatHistoryEntries.map((entry) => ({
			content: entry.message,
			role: entry.role
		}));
		console.log('messages', messages);
		const completion = await openai
			.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages
			})
			.catch((e) => {
				console.error(e);
				return null;
			});
		console.log(completion?.data.choices);
		if (completion?.data.choices?.[0].message?.content) {
			chat.addAIResponse(completion.data.choices[0].message?.content);
		}
	};
}

export const chat = new PlacementChat();
