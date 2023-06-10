import { divide, dot, multiply, norm } from 'mathjs';
import Papa, { ParseResult } from 'papaparse';
import * as path from 'path';
import { stat } from 'fs/promises';

export function parseCSV<T = unknown>(
  contents: string
): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse(contents, {
      header: true,
      transform: (value) => value.trim(),
      complete(result) {
        resolve(result as ParseResult<T>);
      },
    });
  });
}

/** Calculate the cosine similarity between two vectors
 * Reference: https://en.wikipedia.org/wiki/Cosine_similarity#Definition
 */
export function cosineSimilarity(a: number[], b: number[]) {
  const numerator = dot(a, b);
  const denominator = multiply(norm(a), norm(b));
  return divide(numerator, denominator) as number;
}

export function getDataPath(file = '.'): string {
  return path.resolve(__dirname, '../data', file);
}

/** Returns a 'marked' file path. Ex: `Users/sam/test.tsx` => `Users/sam/test.marked.tsx`  */
export function getMarkedFilePath(file: string, mark: string) {
  const splitBase = path.basename(file).split('.');
  splitBase.splice(-1, 0, mark);

  return path.join(path.dirname(file), splitBase.join('.'));
}

export async function fileExists(file: string): Promise<boolean> {
  try {
    const stats = await stat(file);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}
