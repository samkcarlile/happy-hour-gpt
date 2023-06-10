import dotenv from 'dotenv';
import { createItemEmbeddingsContext } from './embedding';
import { getDataPath, parseCSV } from './utils';
import { openai } from './openai';

dotenv.config();

execute()
  .then(() => process.exit(0))
  .catch((reason) => {
    console.error(reason);
    process.exit(1);
  });

async function execute() {
  // Create an embedding context for the items in `drinks-happy-hour.csv`
  const ctx = createItemEmbeddingsContext({
    source: getDataPath('drinks-happy-hour.csv'),
    async parser(contents) {
      const result = await parseCSV<DrinksHappyHourRow>(contents);
      return result.data;
    },
    // The `embed` function takes an item
    // and converts it to a string to be passed to OpenAI for embedding
    embed({ NAME, CUISINE, NEIGHBORHOOD, WHEN, NOTES }) {
      // TODO: we're not going to hit the token length so we don't need to check token length
      return `Name: ${NAME}; Type: ${CUISINE}; Location: ${NEIGHBORHOOD}; Happy Hour Time: ${WHEN}; Notes: ${NOTES}`;
    },
  });

  // Ensure our embeddings are up to date. They will be found in `drinks-happy-hour.embeddings.csv`
  // TODO: The embeddings file currently ends with a `.csv` extension, but it should be `.json`
  await ctx.ensureEmbeddings();

  const query = process.argv.slice(-1).join('');

  // Perform a semantic search of our items for the search query
  const results = await ctx.semanticSearch(query, { limit: 10 });

  // Request a chat completion from OpenAI. The prompt includes the returned list of results from the embeddings.
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a vibey, helpful NYC happy hour and bar recommender who helps choose the best bar from a provided list of choices.',
      },
      {
        role: 'user',
        content: formatRecRequest(query, results),
      },
    ],
  });

  // Output the response
  console.dir(response.data.choices);
}

function formatRecRequest(query: string, choices: DrinksHappyHourRow[]) {
  return [
    "Hey dawg! Here is a summary of what I'm looking:",
    query,
    '',
    'And here are my current choices:',
    ...choices.map(
      ({ NAME, CUISINE, NEIGHBORHOOD, WHEN, NOTES }) =>
        `Name: ${NAME}; Type: ${CUISINE}; Location: ${NEIGHBORHOOD}; Happy Hour Time: ${WHEN}; Notes: ${NOTES}`
    ),
    '',
    'Help me pick the 3 best spots for a drink!',
  ].join('\n');
}

////// Our data types //////

type DrinksHappyHourRow = {
  NAME: string;
  CUISINE: string;
  PRICE_RANGE: string;
  NEIGHBORHOOD: string;
  WHEN: string;
  NOTES: string;
};
