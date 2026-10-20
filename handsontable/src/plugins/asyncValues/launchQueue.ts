/**
 * One call of a source (a single cell or a batch) waiting for, or holding, a concurrency slot.
 */
export class Launch {
  /**
   * Calls the source. It receives `release`, which it calls once the source settled.
   */
  readonly #run: (release: () => void) => void;

  /**
   * Tells whether the launch still has a cell to compute.
   */
  readonly #isLive: () => boolean;

  /**
   * Frees the slot the launch holds.
   */
  #onRelease: (() => void) | null = null;

  /**
   * Whether the source was called.
   */
  #started = false;

  /**
   * Whether the slot was freed (or the launch never took one).
   */
  #released = false;

  /**
   * Creates a launch.
   *
   * @param {Function} run Calls the source, with a function to call once it settled.
   * @param {Function} isLive Tells whether the launch still has a cell to compute.
   */
  constructor(run: (release: () => void) => void, isLive: () => boolean) {
    this.#run = run;
    this.#isLive = isLive;
  }

  /**
   * Tells whether the launch still has a cell to compute.
   *
   * @returns {boolean}
   */
  isLive(): boolean {
    return !this.#released && this.#isLive();
  }

  /**
   * Whether the source was called.
   *
   * @returns {boolean}
   */
  isStarted(): boolean {
    return this.#started;
  }

  /**
   * Calls the source, holding a slot until `release()`.
   *
   * @param {Function} onRelease Frees the slot.
   */
  start(onRelease: () => void): void {
    this.#started = true;
    this.#onRelease = onRelease;
    this.#run(this.release);
  }

  /**
   * Frees the slot. Safe to call more than once, and before the source settles: a launch whose cells were
   * all canceled gives its slot back at once, even when its source ignores the abort signal.
   */
  readonly release = (): void => {
    if (this.#released) {
      return;
    }

    this.#released = true;

    const onRelease = this.#onRelease;

    this.#onRelease = null;
    onRelease?.();
  };
}

/**
 * How many started launches the queue keeps at its head before it compacts the array.
 */
const COMPACT_THRESHOLD = 1024;

/**
 * Runs launches with at most `limit()` of them holding a slot at once, first in, first out.
 */
export class LaunchQueue {
  /**
   * The launches waiting for a slot, from `#head` on.
   */
  #waiting: Launch[] = [];

  /**
   * The index of the first waiting launch. A head index rather than `shift()`, which moves every waiting
   * launch on each start.
   */
  #head = 0;

  /**
   * The number of slots taken.
   */
  #active = 0;

  /**
   * Whether `pump()` is running. A source that starts a request runs inside `pump()`, and the outer loop
   * picks the new launch up.
   */
  #pumping = false;

  /**
   * Reads the slot limit, so a settings update takes effect on the next pump.
   */
  readonly #limit: () => number;

  /**
   * Creates a queue.
   *
   * @param {Function} limit Returns the number of slots.
   */
  constructor(limit: () => number) {
    this.#limit = limit;
  }

  /**
   * Queues a launch and starts what fits.
   *
   * @param {Launch} launch The launch.
   */
  push(launch: Launch): void {
    this.#waiting.push(launch);
    this.pump();
  }

  /**
   * Starts waiting launches while slots are free. A launch with nothing left to compute is dropped.
   */
  pump(): void {
    if (this.#pumping) {
      return;
    }

    this.#pumping = true;

    try {
      while (this.#head < this.#waiting.length && this.#active < this.#limit()) {
        const launch = this.#waiting[this.#head];

        this.#head += 1;

        if (launch.isLive()) {
          this.#active += 1;
          launch.start(this.#onRelease);
        }
      }

    } finally {
      this.#pumping = false;

      if (this.#head === this.#waiting.length) {
        this.clear();

      } else if (this.#head > COMPACT_THRESHOLD && this.#head * 2 > this.#waiting.length) {
        // With a standing backlog the array never empties, so the started launches (and the cells their
        // closures hold) are cut off here.
        this.#waiting = this.#waiting.slice(this.#head);
        this.#head = 0;
      }
    }
  }

  /**
   * Drops every waiting launch. Running ones keep their slots until they release them.
   */
  clear(): void {
    this.#waiting = [];
    this.#head = 0;
  }

  /**
   * Frees a slot and starts the next launch.
   */
  readonly #onRelease = (): void => {
    this.#active -= 1;
    this.pump();
  };
}
