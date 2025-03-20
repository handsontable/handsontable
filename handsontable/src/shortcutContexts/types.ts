/**
 * Types for shortcut contexts module
 */

/**
 * Interface for Handsontable instance with shortcut manager
 */
export interface HotInstance {
  getShortcutManager(): ShortcutManager;
  getSettings(): {
    navigableHeaders?: boolean;
    [key: string]: any;
  };
  getSelected(): any;
  getSelectedRangeLast(): {
    highlight: {
      isHeader(): boolean;
    };
    getCellsCount(): number;
  } | null;
  countRenderedRows(): number;
  countRenderedCols(): number;
  selection: {
    isSelectedByCorner(): boolean;
    isSelectedByColumnHeader(): boolean;
    isSelectedByRowHeader(): boolean;
  };
  view: {
    isMainTableNotFullyCoveredByOverlays(): boolean;
  };
  [key: string]: any;
}

/**
 * Interface for shortcut manager
 */
export interface ShortcutManager {
  addContext(name: string): ShortcutContext;
  getContext(name: string): ShortcutContext;
}

/**
 * Interface for shortcut context
 */
export interface ShortcutContext {
  addShortcuts(shortcuts: Shortcut[], config?: ShortcutConfig): void;
}

/**
 * Interface for shortcut configuration
 */
export interface ShortcutConfig {
  group?: string;
  runOnlyIf?: () => boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  captureCtrl?: boolean;
}

/**
 * Interface for shortcut
 */
export interface Shortcut {
  keys: string[][];
  callback: (event?: KeyboardEvent, keys?: string[]) => void;
  runOnlyIf?: () => boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  captureCtrl?: boolean;
  forwardToContext?: ShortcutContext;
}

/**
 * Interface for keyboard shortcut command
 */
export interface KeyboardShortcutCommand {
  name: string;
  callback: (hot: HotInstance, ...args: any[]) => void;
}

/**
 * Interface for keyboard shortcut commands pool
 */
export interface KeyboardShortcutCommandsPool {
  [key: string]: (...args: any[]) => void;
} 