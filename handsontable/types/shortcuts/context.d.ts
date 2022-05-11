interface Shortcut {
  keys: string[][];
  callback: (event: Event) => boolean | void;
  group: string;
  runOnlyIf?: () => boolean;
  captureCtrl?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  relativeToGroup?: string;
  position?: 'before' | 'after';
}

export interface Context {
  addShortcut(shortcut: Shortcut): void;
  addShortcuts(shortcuts: Shortcut[]): void;
  getShortcuts(): Shortcut[];
  hasShortcut(keys: string[]): boolean;
  removeShortcutsByKeys(keys: string[]): void;
  removeShortcutsByGroup(group: string): void;
}
