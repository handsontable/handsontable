import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import { getWordAtCaret, getValuesFromString } from '../utils/utils';

const COMMIT_KEYS = [','];
const IRRELEVANT_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', ' '];

/**
 * Controller for managing the input.
 *
 * @private
 * @class InputController
 */
export class InputController {

  /**
   * Cache for the input controller.
   *
   * @private
   * @type {object}
   */
  #cache = {
    lastInputValue: null,
  };

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
   *
   * @param {KeyboardEvent} event The keyboard event object.
   */
  onKeyUp(event) {
    if (this.#cache.lastInputValue === this.input.value) {
      return;
    }

    this.#cache.lastInputValue = this.input.value;

    if (COMMIT_KEYS.includes(event.key)) {
      this.#commit();

    } else if (IRRELEVANT_KEYS.includes(event.key)) {
      // eslint-disable-next-line no-useless-return
      return;

    } else {
      const wordAtCaret = getWordAtCaret(this.input);

      if (wordAtCaret === '') {
        this.#commit();
      }

      this.#triggerFilter(wordAtCaret);
    }
  }

  /**
   * Commits the input value.
   */
  #commit() {
    this.runLocalHooks('commit', getValuesFromString(this.input.value));
  }

  /**
   * Triggers the filtering.
   *
   * @param {string} wordAtCaret The word at the caret position.
   */
  #triggerFilter(wordAtCaret) {
    this.runLocalHooks('triggerFilter', wordAtCaret);
  }
}

mixin(InputController, localHooks);
