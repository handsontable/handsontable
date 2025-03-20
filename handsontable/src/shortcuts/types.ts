/**
 * Types for the shortcuts module
 */

/**
 * The context object for managing keyboard shortcuts
 */
export interface ShortcutContext {
  __kindOf: symbol;
  addShortcut: (options: ShortcutOptions) => void;
  addShortcuts: (shortcuts: ShortcutOptions[], options?: Partial<ShortcutOptions>) => void;
  getShortcuts: (keys: string[]) => ShortcutDefinition[];
  hasShortcut: (keys: string[]) => boolean;
  removeShortcutsByKeys: (keys: string[]) => void;
  removeShortcutsByGroup: (group: string) => void;
}

/**
 * Options for defining a keyboard shortcut
 */
export interface ShortcutOptions {
  /**
   * Names of the shortcut's keys
   */
  keys: string[][];
  /**
   * The shortcut's action
   */
  callback: ShortcutCallback;
  /**
   * A group of shortcuts to which the shortcut belongs
   */
  group: string;
  /**
   * A condition on which the shortcut's action runs
   */
  runOnlyIf?: (event: KeyboardEvent) => boolean;
  /**
   * If set to `true`: captures the state of the Control/Meta modifier key
   */
  captureCtrl?: boolean;
  /**
   * If set to `true`: prevents the default behavior
   */
  preventDefault?: boolean;
  /**
   * If set to `true`: stops the event's propagation
   */
  stopPropagation?: boolean;
  /**
   * The order in which the shortcut's action runs: 'before' or 'after' the relativeToGroup group of actions
   */
  position?: 'before' | 'after';
  /**
   * The name of a group of actions, used to determine an action's position
   */
  relativeToGroup?: string;
  /**
   * The context object where the event will be forwarded to
   */
  forwardToContext?: ShortcutContext;
}

/**
 * Shortcut definition for storing in the context
 */
export interface ShortcutDefinition {
  callback: ShortcutCallback;
  group: string;
  runOnlyIf: (event: KeyboardEvent) => boolean;
  captureCtrl: boolean;
  preventDefault: boolean;
  stopPropagation: boolean;
  relativeToGroup?: string;
  position?: 'before' | 'after';
  forwardToContext?: ShortcutContext;
}

/**
 * Shortcut callback function
 */
export type ShortcutCallback = (event: KeyboardEvent, keys: string[]) => boolean | void;

/**
 * Options for creating a shortcut manager
 */
export interface ShortcutManagerOptions {
  /**
   * A starting `window` element
   */
  ownerWindow: Window;
  /**
   * A condition on which `event` is handled
   */
  handleEvent: (event: KeyboardEvent) => boolean;
  /**
   * A hook fired before the `keydown` event is handled
   */
  beforeKeyDown: (event: KeyboardEvent) => boolean | void;
  /**
   * A hook fired after the `keydown` event is handled
   */
  afterKeyDown: (event: KeyboardEvent) => void;
}

/**
 * The shortcut manager
 */
export interface ShortcutManager {
  addContext: (contextName: string) => ShortcutContext;
  getActiveContextName: () => string;
  getContext: (contextName: string) => ShortcutContext | undefined;
  setActiveContextName: (contextName: string) => void;
  isCtrlPressed: () => boolean;
  releasePressedKeys: () => void;
  destroy: () => void;
}

/**
 * Keys observer for tracking key state
 */
export interface KeysObserver {
  press: (key: string) => void;
  release: (key: string) => void;
  releaseAll: () => void;
  isPressed: (key: string) => boolean;
}

/**
 * Key recorder for handling keyboard events
 */
export interface KeyRecorder {
  mount: () => void;
  unmount: () => void;
  isPressed: (key: string) => boolean;
  releasePressedKeys: () => void;
}

/**
 * Event listener definition for tracking modifier keys
 */
export interface ModKeyListener {
  event: string;
  listener: (event: KeyboardEvent) => void;
} 