/**
 * Holds the sheets bar's motion back until the grid has been painted. A switch, a tab entrance,
 * or a marker slide made while the grid loads (a host restoring a saved sheet right after the
 * constructor, or in an animation frame it requested then, or a bar turned on through
 * `updateSettings()`) is instant, the way a switch with no theme transition is.
 *
 * The gate starts closed. `arm()` asks for the next animation frame, and in that frame asks for
 * the one after it, and opens the gate there. The first frame is painted before the gate opens,
 * so everything that runs in the task that armed it, in the tasks before the first frame, and in
 * the first frame's own callbacks (a host's `requestAnimationFrame()` scheduled right after the
 * constructor runs after the gate's) stays instant. `close()` cancels whichever frame is pending
 * and shuts the gate again.
 */
export class MotionGate {
  /**
   * Whether motion is allowed.
   */
  #isOpen = false;
  /**
   * The pending animation frame on the way to opening the gate, with the window it was
   * requested from, or `null` when none is pending.
   */
  #frame: { rootWindow: Window, id: number } | null = null;

  /**
   * Tells whether motion is allowed.
   */
  isOpen(): boolean {
    return this.#isOpen;
  }

  /**
   * Opens the gate in the second animation frame of `rootWindow` from now, when `canOpen()`
   * still answers `true` then. Does nothing while the gate is open or a frame is already pending.
   */
  arm(rootWindow: Window, canOpen: () => boolean): void {
    if (this.#isOpen || this.#frame !== null) {
      return;
    }

    this.#frame = {
      rootWindow,
      id: rootWindow.requestAnimationFrame(() => {
        this.#frame = {
          rootWindow,
          id: rootWindow.requestAnimationFrame(() => {
            this.#frame = null;
            this.#isOpen = canOpen();
          }),
        };
      }),
    };
  }

  /**
   * Shuts the gate and cancels the pending frame that would open it.
   */
  close(): void {
    if (this.#frame !== null) {
      this.#frame.rootWindow.cancelAnimationFrame(this.#frame.id);
      this.#frame = null;
    }

    this.#isOpen = false;
  }
}
