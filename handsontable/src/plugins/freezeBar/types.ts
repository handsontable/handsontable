/**
 * The edge of the frozen area. `start` and `end` follow the layout direction.
 */
export type FreezeEdge = 'top' | 'bottom' | 'start' | 'end';

/**
 * What requested a change of the frozen count.
 */
export type FreezeSource = 'drag' | 'keyboard' | 'api';

/**
 * The object form of the `freezeBar` option.
 */
export interface FreezeBarSettings {
  /**
   * Show the bar for frozen rows. Defaults to `true`.
   */
  rows?: boolean;
  /**
   * Show the bar for frozen columns. Defaults to `true`.
   */
  columns?: boolean;
}
