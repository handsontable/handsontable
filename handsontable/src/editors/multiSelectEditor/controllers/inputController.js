import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';

/**
 * Controller for managing the input.
 *
 * @private
 * @class InputController
 */
export class InputController {
  /**
   * Cached keyup listener bound to the controller instance.
   * It must be the same function reference for add/remove event listener.
   *
   * @private
   * @type {Function}
   */
  #onKeyUp = null;

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

    this.#onKeyUp = this.onKeyUp.bind(this);
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
   * Listens to the input keyup event.
   */
  listen() {
    this.eventManager.addEventListener(this.input, 'keyup', this.#onKeyUp);
  }

  /**
   * Unlistens to the input keyup event.
   */
  unlisten() {
    this.eventManager.removeEventListener(this.input, 'keyup', this.#onKeyUp);
  }

  /**
   * OnKeyUp listener.
   */
  onKeyUp() {
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
