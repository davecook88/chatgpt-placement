import { Configuration, OpenAIApi } from 'openai';
import { OPENAI_KEY, OPENAI_ORG } from '$env/static/private';

const configuration = new Configuration({
	apiKey: OPENAI_KEY,
	organization: OPENAI_ORG
});

export const openai = new OpenAIApi(configuration);
