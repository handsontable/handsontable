import type { EngineContext } from '../wire';
import { requestAnimationFrame } from '../../../../helpers/feature';
import { warn } from '../../../../helpers/console';

/**
 * Assembles the ResizeMonitor's dependencies from the engine composition context. It needs only the
 * settings accessor (to fire the `onContainerElementResize` setting) and the master table (for the
 * wrapper element it observes) — no callback back into the owning Overlays coordinator.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The ResizeMonitor dependency set.
 */
export function createResizeMonitorDeps(ctx: EngineContext) {
  return {
    wtSettings: ctx.wtSettings,
    wtTable: ctx.getWtTable(),
  };
}

/**
 * The ResizeMonitor dependencies, inferred from `createResizeMonitorDeps`.
 */
export type ResizeMonitorDeps = ReturnType<typeof createResizeMonitorDeps>;

/**
 * Watches the Walkontable wrapper's parent element for size changes and fires the
 * `onContainerElementResize` setting when one is detected.
 *
 * The class owns the `ResizeObserver` plus the endless-loop guard: a dynamic parent size (for example
 * `dvh` units) can make the observer callback re-trigger itself indefinitely, so a rolling count with
 * a short reset window disconnects the observer once the callback fires too many times in direct
 * succession. Extracted from the Overlays coordinator so the loop-guard lifecycle stays self-contained.
 *
 * @class ResizeMonitor
 */
export class ResizeMonitor {
  /**
   * The ResizeMonitor dependencies.
   *
   * @type {ResizeMonitorDeps}
   */
  readonly #deps: ResizeMonitorDeps;

  /**
   * The amount of times the ResizeObserver callback was fired in direct succession.
   *
   * @type {number}
   */
  #containerDomResizeCount = 0;

  /**
   * The timeout ID for the ResizeObserver endless-loop-blocking logic.
   *
   * @type {number}
   */
  #containerDomResizeCountTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * The instance of the ResizeObserver that observes the size of the Walkontable wrapper element.
   * In case of the size change detection the `onContainerElementResize` is fired.
   *
   * @type {ResizeObserver}
   */
  #resizeObserver = new ResizeObserver((entries) => {
    requestAnimationFrame(() => {
      if (!Array.isArray(entries) || !entries.length) {
        return;
      }

      this.#containerDomResizeCount += 1;

      if (this.#containerDomResizeCount === 300) {
        warn('The ResizeObserver callback was fired too many times in direct succession.' +
          '\nThis may be due to an infinite loop caused by setting a dynamic height/width (for example, ' +
          'with the `dvh` units) to a Handsontable container\'s parent. ' +
          '\nThe observer will be disconnected.');

        this.#resizeObserver.disconnect();
      }

      // This logic is required to prevent an endless loop of the ResizeObserver callback.
      // https://github.com/handsontable/dev-handsontable/issues/1898#issuecomment-2154794817
      if (this.#containerDomResizeCountTimeout !== null) {
        clearTimeout(this.#containerDomResizeCountTimeout);
      }

      this.#containerDomResizeCountTimeout = setTimeout(() => {
        this.#containerDomResizeCount = 0;
      }, 100);

      this.#deps.wtSettings.getSetting('onContainerElementResize');
    });
  });

  /**
   * @param {ResizeMonitorDeps} deps The ResizeMonitor dependencies.
   */
  constructor(deps: ResizeMonitorDeps) {
    this.#deps = deps;
  }

  /**
   * Starts observing the Walkontable wrapper's parent element for size changes. No-op when the
   * wrapper has no parent element.
   */
  observe() {
    const parentElement = this.#deps.wtTable.wtRootElement.parentElement;

    if (parentElement) {
      this.#resizeObserver.observe(parentElement);
    }
  }

  /**
   * Resets the direct-succession resize counter. Called when a window resize accounts for the size
   * change, so it is excluded from the endless-loop-blocking logic.
   */
  resetResizeCount() {
    this.#containerDomResizeCount = 0;
  }

  /**
   * Cleans up on destroy: clears the pending reset timeout and disconnects the observer.
   */
  destroy() {
    if (this.#containerDomResizeCountTimeout !== null) {
      clearTimeout(this.#containerDomResizeCountTimeout);
      this.#containerDomResizeCountTimeout = null;
    }

    this.#resizeObserver.disconnect();
  }
}
