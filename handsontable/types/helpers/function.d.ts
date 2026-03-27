export function isFunction(func: any): boolean;
export function throttle(func: () => void, wait?: number): () => void;
export function throttleAfterHits(func: () => void, wait?: number, hits?: number): () => void;
export interface DebouncedFunction {
  (...args: any[]): any;
  cancel(): void;
}
export function debounce(func: (...args: any[]) => any, wait?: number): DebouncedFunction;
export function pipe(...functions: Array<() => void>): () => void;
export function partial(func: () => void, ...params: any[]): () => void;
export function curry(func: () => void): () => void;
export function curryRight(func: () => void): () => void;
export function fastCall(func: () => void, context: any, arg1?: any, arg2?: any, arg3?: any,
  arg4?: any, arg5?: any, arg6?: any): any;
