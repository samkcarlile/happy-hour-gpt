import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const config = new Configuration({
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(config);

export async function getEmbedding(
  input: string,
  model = 'text-embedding-ada-002'
) {
  const response = await openai.createEmbedding({ input, model });
  return response.data.data[0].embedding;
}
