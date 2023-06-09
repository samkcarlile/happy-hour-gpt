export function objMap<T extends object, K extends keyof T>(
  source: T,
  mapfn: (key: K, value: typeof source[K]) => typeof source[K]
) {
  const result = {} as T;
  (Object.entries(source) as [K, typeof source[K]][]).map(
    ([key, value]) => (result[key] = mapfn(key, value))
  );
  return result;
}

export function objFilter<T extends object, K extends keyof T>(
  source: T,
  filterfn: (key: K, value: typeof source[K]) => boolean
) {
  const result: Partial<T> = {};
  (Object.entries(source) as [K, typeof source[K]][]).forEach(
    ([key, value]) => filterfn(key, value) && (result[key] = value)
  );

  return result;
}

export const Filters = {
  equal:
    <T>(test: T) =>
    <V extends T>(value: V) =>
      value === test,
  in: <T extends string | number | Date | Array<any>>(
    test: T
  ): ((value: T extends Array<infer E> ? E : T) => boolean) => {
    if (typeof test === 'string' || Array.isArray(test))
      return (value) => test.includes(value);
    if (typeof test === 'number') return (value) => value <= test && value >= 0;
    if (test instanceof Date) return (value) => value <= test;

    throw new Error(`can't test for inclusion with given type`);
  },
};

export async function forEachAsync<T extends ArrayLike<any>>(
  array: T,
  callbackfn: (
    value: T extends ArrayLike<infer V> ? V : never,
    index: number,
    array: T
  ) => Promise<any>
) {
  for (let i = 0; i < array.length; i++) {
    await callbackfn(array[i], i, array);
  }
}

/** Returns a function that passes only the first `n` arguments to the given function.*/
export const limitArgs =
  <T extends (...args: any[]) => any>(n: number, fn: T) =>
  (...args: Parameters<T>): ReturnType<T> =>
    fn(...args.slice(0, n));

/** Returns a function that passes its arguments shifted to the left by `n` to the given function. */
export const shiftArgs =
  <T extends (...args: any[]) => any>(n: number, fn: T) =>
  (...args: any[]): ReturnType<T> =>
    fn(...args.slice(n));
