export type ChatErrorRole = 'error';

export interface ChatHistoryEntry {
	message: string;
	timestamp: string;
	role: ChatCompletionRequestMessageRoleEnum | ChatErrorRoleEnum;
}
