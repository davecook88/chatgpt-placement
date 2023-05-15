import { openai } from '$lib/openai/client';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { SYSTEM_MESSAGE } from './proompt';
import type { ChatHistoryEntry } from './types';

export class PlacementChat {
	private chatHistory: ChatHistoryEntry[] = [];

	constructor() {
		this.addSystemMessage();
	}

	private addSystemMessage = () => {
		if (this.chatHistory.length) return;
		this.addChatEntry(SYSTEM_MESSAGE, ChatCompletionRequestMessageRoleEnum.Assistant);
	};

	private printModels = async () => {
		const models = await openai.listModels();
		console.log(models.data.data);
	};

	get history() {
		return this.chatHistory;
	}

	clear() {
		this.chatHistory = [];
	}

	private addChatEntry = (message: string, role: ChatCompletionRequestMessageRoleEnum) => {
		const entry: ChatHistoryEntry = {
			message,
			role,
			timestamp: new Date().toISOString()
		};
		console.log('adding entry', entry);
		this.chatHistory = [...this.chatHistory, entry];
	};

	sendUserMessage = (message: string) => {
		// if last message is from user, remove it
		if (
			this.chatHistory.length &&
			this.chatHistory[this.chatHistory.length - 1].role ===
				ChatCompletionRequestMessageRoleEnum.User
		) {
			this.chatHistory = this.chatHistory.slice(0, -1);
		}
		this.addSystemMessage();
		this.addChatEntry(message, ChatCompletionRequestMessageRoleEnum.User);
	};

	private addAIResponse = (message: string) => {
		this.addChatEntry(message, ChatCompletionRequestMessageRoleEnum.Assistant);
	};

	forwardToAI = async () => {
		const completion = await openai
			.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages: this.chatHistory.map((entry) => ({
					content: entry.message,
					role: entry.role
				}))
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
