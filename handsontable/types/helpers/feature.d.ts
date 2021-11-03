type Comparator = (a: any, b: any) => -1 | 0 | 1;

export function requestAnimationFrame(callback: () => void): number;
export function isClassListSupported(): boolean;
export function isTextContentSupported(): boolean;
export function isGetComputedStyleSupported(): boolean;
export function cancelAnimationFrame(id: number): void;
export function isTouchSupported(): boolean;
export function hasCaptionProblem(): boolean;
export function getComparisonFunction(language?: string, options?: object): Comparator;
export function isPassiveEventSupported(): boolean;
