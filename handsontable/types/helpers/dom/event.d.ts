export function stopImmediatePropagation(event: Event): void;
export function isImmediatePropagationStopped(event: Event): boolean;
export function isRightClick(event: Event): boolean;
export function isLeftClick(event: Event): boolean;
export function isTouchEvent(event: Event): boolean;
export function offsetRelativeTo(event: Event, untilElement: HTMLElement | undefined): { x: number, y: number };
