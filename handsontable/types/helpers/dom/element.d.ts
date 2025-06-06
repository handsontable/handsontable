export function getParent(element: HTMLElement, level?: number): HTMLElement;
export function getFrameElement(frame: Window): HTMLIFrameElement;
export function getParentWindow(frame: Window): Window;
export function getFractionalScalingCompensation(rootDocument?: Document): number;
export function hasAccessToParentWindow(frame: Window): boolean;
export function closest(element: HTMLElement, nodes?: Array<string | HTMLElement>, until?: HTMLElement): HTMLElement;
export function closestDown(element: HTMLElement, nodes: HTMLElement[], until?: HTMLElement): HTMLElement;
export function isChildOf(child: HTMLElement, parent: HTMLElement | string): boolean;
export function index(element: Element): number;
export function overlayContainsElement(overlayType: string, element: HTMLElement, root: HTMLElement): boolean;
export function hasClass(element: HTMLElement, className: string): boolean;
export function addClass(element: HTMLElement, className: string | string[]): void;
export function removeClass(element: HTMLElement, className: string | string[]): void;
export function removeTextNodes(element: HTMLElement): void;
export function empty(element: HTMLElement): void;
export function fastInnerHTML(element: HTMLElement, content: string, sanitizeContent?: boolean): void;
export function fastInnerText(element: HTMLElement, content: string): void;
export function isVisible(element: HTMLElement): boolean;
export function offset(element: HTMLElement): { left: number, top: number };
export function getWindowScrollTop(rootWindow?: Window): number;
export function getWindowScrollLeft(rootWindow?: Window): number;
export function getScrollTop(element: HTMLElement, rootWindow?: Window): number;
export function getScrollLeft(element: HTMLElement, rootWindow?: Window): number;
export function getScrollableElement(element: HTMLElement): HTMLElement;
export function getTrimmingContainer(base: HTMLElement): HTMLElement;
export function getStyle(element: HTMLElement, prop: string, rootWindow?: Window): string;
export function matchesCSSRules(element: Element, rule: CSSRule): boolean;
export function outerWidth(element: HTMLElement): number;
export function outerHeight(element: HTMLElement): number;
export function innerHeight(element: HTMLElement): number;
export function innerWidth(element: HTMLElement): number;
export function addEvent(element: HTMLElement, event: string, callback: (event?: Event) => void): void;
export function removeEvent(element: HTMLElement, event: string, callback: () => void): void;
export function getCaretPosition(el: HTMLElement): number;
export function getSelectionEndPosition(el: HTMLElement): number;
export function getSelectionText(rootWindow?: Window): string;
export function clearTextSelection(rootWindow?: Window): void;
export function setCaretPosition(element: Element, pos: number, endPos: number): void;
export function getScrollbarWidth(rootDocument?: Document): number;
export function hasVerticalScrollbar(element: HTMLElement): boolean;
export function hasHorizontalScrollbar(element: HTMLElement): boolean;
export function hasZeroHeight(element: HTMLElement): boolean;
export function setOverlayPosition(overlayElem: HTMLElement, left: string | number, top: string | number): void;
export function getCssTransform(element: HTMLElement): number;
export function resetCssTransform(element: HTMLElement): void;
export function isInput(element: HTMLElement): boolean;
export function isOutsideInput(element: HTMLElement): boolean;
export function selectElementIfAllowed(element: HTMLElement): void;
export function isDetached(element: HTMLElement): boolean;
export function isHTMLElement(element: any): boolean;
export const HTML_CHARACTERS: RegExp;
