import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

/**
 * Module that observes the editor size after it has been resized by the user.
 *
 * @private
 * @class EditorResizeObserver
 */
export class EditorResizeObserver {
  /**
   * The flag that indicates if the initial call should be ignored. It is used to prevent the initial call
   * that happens after the observer is attached to the element.
   *
   * @type {boolean}
   */
  #ignoreInitialCall = true;
  /**
   * The element that is observed by the observer.
   *
   * @type {HTMLElement}
   */
  #observedElement = null;
  /**
   * The ResizeObserver instance.
   *
   * @type {ResizeObserver}
   */
  #observer = new ResizeObserver(entries => this.#onResize(entries));

  /**
   * Sets the observed element.
   *
   * @param {HTMLElement} element The element to observe.
   */
  setObservedElement(element) {
    this.#observedElement = element;
  }

  /**
   * Stops observing the element.
   */
  unobserve() {
    this.#observer.unobserve(this.#observedElement);
  }

  /**
   * Starts observing the element.
   */
  observe() {
    this.#ignoreInitialCall = true;
    this.#observer.observe(this.#observedElement);
  }

  /**
   * Destroys the observer.
   */
  destroy() {
    this.#observer.disconnect();
  }

  /**
   * Listens for event from the ResizeObserver and forwards the through the local hooks.
   *
   * @param {*} entries The entries from the ResizeObserver.
   */
  #onResize(entries) {
    if (this.#ignoreInitialCall || !Array.isArray(entries) || !entries.length) {
      this.#ignoreInitialCall = false;

      return;
    }

    entries.forEach(({ borderBoxSize }) => {
      const { inlineSize, blockSize } = borderBoxSize[0];

      this.runLocalHooks('resize', inlineSize, blockSize);
    });
  }
}

mixin(EditorResizeObserver, localHooks);
