/**
 * Types for mixins
 */

/**
 * Basic object with hot instance reference
 */
export interface WithHotInstance {
  hot: {
    addHook: (key: string, callback: Function) => void;
    removeHook: (key: string, callback: Function) => void;
  };
}

/**
 * Interface for hooksRefRegisterer mixin
 */
export interface HooksRefRegistererMixin {
  /**
   * Internal hooks storage
   */
  _hooksStorage: {
    [key: string]: Function[];
  };
  
  /**
   * Add hook to the collection
   */
  addHook(key: string, callback: Function): this;
  
  /**
   * Remove all hooks listeners by hook name
   */
  removeHooksByKey(key: string): void;
  
  /**
   * Clear all added hooks
   */
  clearHooks(): void;
  
  /**
   * Mixin name
   */
  readonly MIXIN_NAME: string;
}

/**
 * Interface for localHooks mixin
 */
export interface LocalHooksMixin {
  /**
   * Internal hooks storage
   */
  _localHooks: {
    [key: string]: Function[];
  };
  
  /**
   * Add hook to the collection
   */
  addLocalHook(key: string, callback: Function): this;
  
  /**
   * Run hooks
   */
  runLocalHooks(key: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any): void;
  
  /**
   * Clear all added hooks
   */
  clearLocalHooks(): this;
  
  /**
   * Mixin name
   */
  readonly MIXIN_NAME: string;
} 