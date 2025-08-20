import { setAttribute } from '../helpers/dom/element';
import { A11Y_LABEL } from '../helpers/a11y';

/**
 * @typedef {object} FocusDetector
 * @property {() => void} activate Activates the focus detector.
 * @property {() => void} deactivate Deactivates the focus detector.
 * @property {(direction: 'from_above' | 'from_below') => void} focus Focuses the input element in the given direction.
 */
/**
 * Installs a focus detector module. The module appends two input elements into the DOM side by side.
 * When the first input is focused, then it means that a user entered to the component using the TAB key
 * from the element above. When the second input is focused, a user enters to the component from
 * the element below the table. Each action, once detected, triggers the specific hook.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @param {HTMLElement} wrapperElement The wrapper element to install the focus detector into.
 * @param {{ onFocus: Function }} hooks An object with defined callbacks to call.
 * @returns {FocusDetector}
 */
export function installFocusDetector(hot, wrapperElement, hooks = {}) {
  const inputTrapTop = createInputElement(hot);
  const inputTrapBottom = createInputElement(hot);

  inputTrapTop.addEventListener('focus', () => hooks?.onFocus('from_above'));
  inputTrapBottom.addEventListener('focus', () => hooks?.onFocus('from_below'));

  wrapperElement.prepend(inputTrapTop);
  wrapperElement.append(inputTrapBottom);

  return {
    /**
     * Focuses the input element in the given direction.
     *
     * @param {string} direction The direction to focus the input element in.
     */
    focus(direction) {
      if (direction === 'from_above') {
        inputTrapTop.focus();
      } else {
        inputTrapBottom.focus();
      }
    },
    /**
     * Activates the detector by resetting the tabIndex of the input elements.
     */
    activate() {
      hot._registerTimeout(() => {
        inputTrapTop.tabIndex = 0;
        inputTrapBottom.tabIndex = 0;
      }, 10);
    },
    /**
     * Deactivates the detector by setting tabIndex to -1.
     */
    deactivate() {
      hot._registerTimeout(() => {
        inputTrapTop.tabIndex = -1;
        inputTrapBottom.tabIndex = -1;
      }, 10);
    },
  };
}

/**
 * Creates a new HTML input element.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @returns {HTMLInputElement}
 */
function createInputElement(hot) {
  const rootDocument = hot.rootDocument;
  const input = rootDocument.createElement('input');

  input.type = 'text';
  input.name = 'htFocusCatcher';
  input.classList.add('htFocusCatcher');

  if (hot.getSettings().ariaTags) {
    setAttribute(input, [
      A11Y_LABEL('Focus catcher')
    ]);
  }

  return input;
}
