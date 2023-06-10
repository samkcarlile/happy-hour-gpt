import { readFile } from 'fs/promises';
import { readFile as readJsonFile, writeFile as writeJsonFile } from 'jsonfile';
import { getEmbedding } from './openai';
import { cosineSimilarity, fileExists, getMarkedFilePath } from './utils';

export type ItemsEmbeddingConfig<T> = {
  source: string;
  parser: (contents: string) => Promise<T[]>;
  embed: (item: T) => string;
};

export type SemanticSearchConfig = { limit?: number; threshold?: number };

/** A wrapper for creating and working with embeddings derived from a list of items */
type ItemsEmbeddingContext<T> = ItemsEmbeddingConfig<T> & {
  /** Ensures that embeddings for all item are available.
   * Requests missing embeddings from OpenAI if they are not.
   */
  ensureEmbeddings(force?: boolean): Promise<void>;

  /** Performs a semantic search with the query based on the available embeddings.
   * This function does the following:
   * - Requests the embedding for the query from OpenAI.
   * - Sorts all items by cosine similarity of the item vector and the query vector
   * - Returns the top `config.limit` (defaults to `10`) similar items
   */
  semanticSearch(
    query: string,
    config?: SemanticSearchConfig
  ): Promise<(T & { _score: number })[]>;
};

export function createItemEmbeddingsContext<T>(
  config: ItemsEmbeddingConfig<T>
): ItemsEmbeddingContext<T> {
  let ensured = false;
  let items: T[] = [];
  let embeddings: number[][] = [];

  return {
    ...config,
    async ensureEmbeddings(force = false) {
      if (ensured) return;

      const contents = await readFile(config.source, 'utf-8');
      items = items.concat(await config.parser(contents));

      const embeddingsPath = getMarkedFilePath(config.source, 'embeddings');
      const existingEmbeddings: number[][] = (await fileExists(embeddingsPath))
        ? await readJsonFile(embeddingsPath)
        : [];

      if (!force && existingEmbeddings.length === items.length) {
        embeddings = embeddings.concat(existingEmbeddings);
      } else {
        for (const item of items) {
          const result = await getEmbedding(config.embed(item));
          embeddings.push(result);
        }
        await writeJsonFile(embeddingsPath, embeddings);
      }
      ensured = true;
    },
    async semanticSearch(query, config) {
      const queryEmbedding = await getEmbedding(query);

      const similarity = new Map<T, number>();
      items.forEach((item, i) => {
        const itemEmbedding = embeddings[i];
        similarity.set(item, cosineSimilarity(itemEmbedding, queryEmbedding));
      });

      // TODO: implement config.threshold for score
      return items
        .sort((a, b) => similarity.get(b) - similarity.get(a))
        .map((item) => ({
          ...item,
          _score: similarity.get(item),
        }))
        .slice(0, config?.limit ?? 10);
    },
  };
}
