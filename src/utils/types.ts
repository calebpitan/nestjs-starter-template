export type ResolvePromise<T> = T extends Promise<infer R> ? R : never;
