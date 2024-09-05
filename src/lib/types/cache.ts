export type Cache = {
  get(key: string): unknown
  set(key: string, value: unknown): void
}
