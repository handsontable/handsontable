import { mixin } from '../../../../helpers/object';
import localHooks from '../../../../mixins/localHooks';

/**
 * Controller for managing the input.
 *
 * @private
 * @class InputController
 */
export class InputController {
  /**
   * Creates a new InputController.
   *
   * @param {object} options Options object.
   * @param {HTMLInputElement} options.input Input element.
   * @param {EventManager} options.eventManager Event manager.
   */
  constructor({ input, eventManager }) {
    this.input = input;
    this.eventManager = eventManager;

    this.onInput = this.onInput.bind(this);
  }

  /**
   * Gets the input element.
   *
   * @returns {HTMLInputElement} The input element.
   */
  getInputElement() {
    return this.input;
  }

  /**
   * Toggles the input.
   *
   * @param {boolean} enabled If true, the input will be enabled.
   */
  toggle(enabled) {
    if (this.input) {
      if (enabled) {
        this.listen();

      } else {
        this.unlisten();
      }
    }
  }

  /**
   * Listens to the input keyup event.
   */
  listen() {
    this.eventManager.addEventListener(this.input, 'input', this.onInput);
  }

  /**
   * Unlistens to the input keyup event.
   */
  unlisten() {
    this.eventManager.removeEventListener(this.input, 'input', this.onInput);
  }

  /**
   * OnInput listener.
   */
  onInput() {
    this.#triggerFilter(this.input.value);
  }

  /**
   * Triggers the filtering.
   *
   * @param {string} value The value of the input.
   */
  #triggerFilter(value) {
    this.runLocalHooks('triggerFilter', value);
  }
}

mixin(InputController, localHooks);
