export class IndexMap<T = number> {
  constructor(initValueOrFn?: T);
  getValues(): T[];
  getValueAtIndex(index: number): T;
  setValues(values: T[]): void;
  setValueAtIndex(index: number, value: T): boolean;
  clear(): void;
  getLength(): number;
  destroy(): void;
}
