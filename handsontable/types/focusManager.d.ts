type FocusMode = 'cell' | 'mixed';

export interface FocusManager {
  getFocusMode(): FocusMode;
  setFocusMode(focusMode: FocusMode): void;
  getRefocusDelay(): number;
  setRefocusDelay(delay: number): void;
  setRefocusElementGetter(getterFn: () => HTMLElement): void;
  getRefocusElement(): HTMLElement | void;
  focusOnHighlightedCell(): void;
  refocusToEditorTextarea(delay: number): void;
}
