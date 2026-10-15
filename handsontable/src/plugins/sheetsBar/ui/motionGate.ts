/**
 * Holds the sheets bar's motion back until the grid has been on screen for a frame. A switch, a
 * tab entrance, or a marker slide made while the grid loads (a host restoring a saved sheet right
 * after the constructor, or a bar turned on through `updateSettings()`) is instant, the way a
 * switch with no theme transition is.
 *
 * The gate starts closed. `arm()` asks for the next animation frame and opens the gate in it, so
 * everything that runs in the task that armed it, and in the tasks before that frame, stays
 * instant. `close()` cancels the frame and shuts the gate again.
 */
export class MotionGate {
  /**
   * Whether motion is allowed.
   */
  #isOpen = false;
  /**
   * The animation frame that opens the gate, with the window it was requested from, or `null`
   * when none is pending.
   */
  #frame: { rootWindow: Window, id: number } | null = null;

  /**
   * Tells whether motion is allowed.
   */
  isOpen(): boolean {
    return this.#isOpen;
  }

  /**
   * Opens the gate in the next animation frame of `rootWindow`, when `canOpen()` still answers
   * `true` then. Does nothing while the gate is open or a frame is already pending.
   */
  arm(rootWindow: Window, canOpen: () => boolean): void {
    if (this.#isOpen || this.#frame !== null) {
      return;
    }

    const id = rootWindow.requestAnimationFrame(() => {
      this.#frame = null;
      this.#isOpen = canOpen();
    });

    this.#frame = { rootWindow, id };
  }

  /**
   * Shuts the gate and cancels the frame that would open it.
   */
  close(): void {
    if (this.#frame !== null) {
      this.#frame.rootWindow.cancelAnimationFrame(this.#frame.id);
      this.#frame = null;
    }

    this.#isOpen = false;
  }
}
