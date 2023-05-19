import { ref, set, get, remove } from 'firebase/database';

import { openai } from '$lib/openai/client';
import { ChatCompletionRequestMessageRoleEnum, type ChatCompletionRequestMessage } from 'openai';
import { SYSTEM_MESSAGE, USER_MESSAGE_FORMAT, WELCOME_MESSAGE_FROM_ASSISTANT } from './proompt';
import type { ChatHistoryEntry } from './types';
import { database } from '../../firebase';

type ChatHistoryKey = string;

type ChatHistoryRecord = Record<ChatHistoryKey, ChatHistoryEntry>;

export class PlacementChat {
	private systemMessage = SYSTEM_MESSAGE;
	private _chatId: string;
	private _chatHistory: ChatHistoryRecord = {};

	constructor({ chatId }: { chatId: string }) {
		this._chatId = chatId;
		this.getHistory().then((history) => {
			this._chatHistory = history;
			if (Object.keys(history).length === 0) {
				this.addWelcomeMessage();
			}
		});
	}

	set chatId(id: string) {
		this._chatId = id;
	}

	get chatId() {
		return this._chatId;
	}

	private get systemMessageEntry(): ChatHistoryEntry {
		return {
			message: this.systemMessage,
			role: ChatCompletionRequestMessageRoleEnum.Assistant,
			timestamp: new Date().toISOString()
		};
	}

	private addWelcomeMessage = () => {
		WELCOME_MESSAGE_FROM_ASSISTANT.split('\n\n')
			.filter(Boolean)
			.forEach((message) => {
				this.addChatEntry(message, ChatCompletionRequestMessageRoleEnum.Assistant);
			});
	};

	private printModels = async () => {
		const models = await openai.listModels();
		console.log(models.data.data);
	};

	async getHistory(): Promise<ChatHistoryRecord> {
		return await get(ref(database, `chats/${this.chatId}`)).then((snapshot) => {
			if (snapshot.exists()) {
				return snapshot.val();
			} else {
				console.log('No data available');
				return [];
			}
		});
	}

	clear() {
		remove(ref(database, `chats/${this.chatId}`));
		// this.chatHistory = [];
	}

	private addChatEntry = (
		message: string,
		role: ChatCompletionRequestMessageRoleEnum | 'error'
	) => {
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
		const formattedMessage = USER_MESSAGE_FORMAT.replace('{message}', message);
		this.addChatEntry(message, ChatCompletionRequestMessageRoleEnum.User);
	}

	private addAIResponse = (message: string) => {
		this.addChatEntry(message, ChatCompletionRequestMessageRoleEnum.Assistant);
	};

	private addErrorMessage = (message: string) => {
		this.addChatEntry(message, 'error');
	};

	/**
	 * @description Before sending any messages to the AI, we will add some meta data to the message
	 * to keep the conversation on track.
	 *
	 * This method will call individual formatter functions depending on the role of the message.
	 * @param entry
	 */
	private formatChatHistoryEntryForAI = (
		entry: ChatHistoryEntry
	): ChatCompletionRequestMessage | null => {
		switch (entry.role) {
			case ChatCompletionRequestMessageRoleEnum.User:
				return this.formatUserChatHistoryEntryForAI(entry);
			case ChatCompletionRequestMessageRoleEnum.Assistant:
				return this.formatAssistantChatHistoryEntryForAI(entry);
			case 'error':
				return null;
			default:
				return {
					content: entry.message,
					role: entry.role
				};
		}
	};

	private formatUserChatHistoryEntryForAI(entry: ChatHistoryEntry): ChatCompletionRequestMessage {
		const { message } = entry;

		return {
			content: message,
			role: entry.role
		};
	}

	private formatAssistantChatHistoryEntryForAI = (
		entry: ChatHistoryEntry
	): ChatCompletionRequestMessage => {
		return {
			content: entry.message,
			role: entry.role
		};
	};

	forwardToAI = async (chatHistoryEntries?: ChatHistoryEntry[]) => {
		if (!chatHistoryEntries) {
			const chatHistory = await this.getHistory();
			chatHistoryEntries = Object.values(chatHistory);
		}

		const messages = [this.systemMessageEntry, ...chatHistoryEntries]
			.map(this.formatChatHistoryEntryForAI)
			.filter(Boolean) as ChatCompletionRequestMessage[];
		console.log('forwarding messages to AI', messages);
		const completion = await openai
			.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages
			})
			.catch((e) => {
				console.error(e);
				this.addErrorMessage(e.message);
				return null;
			});
		console.log(completion?.data.choices);
		if (completion?.data.choices?.[0].message?.content) {
			this.addAIResponse(completion.data.choices[0].message?.content);
		}
	};
}
