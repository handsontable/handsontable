type Comparator = (a: any, b: any) => -1 | 0 | 1;

export function requestAnimationFrame(callback: () => void): number;
export function cancelAnimationFrame(id: number): void;
export function isTouchSupported(): boolean;
export function hasCaptionProblem(): boolean;
export function getComparisonFunction(language?: string, options?: object): Comparator;
