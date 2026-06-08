import ClipboardData from './clipboardData';

/**
 * @private
 */
export default class PasteEvent {
  /**
   * The simulated clipboard data object attached to this paste event.
   */
  declare clipboardData: ClipboardData;
  /**
   * Initializes the paste event with an empty `ClipboardData` instance.
   */
  constructor() {
    this.clipboardData = new ClipboardData();
  }
  /**
   * No-op implementation of `preventDefault` to satisfy the event interface contract.
   */
  preventDefault() { // intentionally empty
  }
  /**
   * Returns an empty array as a stub for the composed path of this synthetic event.
   */
  composedPath(): unknown[] {
    return [];
  }
}
