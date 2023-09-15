import { setAttribute } from '../../helpers/dom/element';

const ACCESSIBILITY_ATTR_PRESENTATION = ['role', 'presentation'];

/**
 * Installs a focus detector module. The module appends two input elements into the DOM side by side.
 * When the first input is focused, then it means that a user entered to the component using the TAB key
 * from the element above. When the second input is focused, a user enters to the component from
 * the element below the table. Each action, once detected, triggers the specific hook.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @param {{ onFocusFromTop: Function, onFocusFromBottom: Function }} hooks An object with defined callbacks to call.
 * @returns {{ activate: Function, deactivate: Function }}
 */
export function installFocusDetector(hot, hooks = {}) {
  const rootElement = hot.rootElement;
  const inputTrapTop = createInputElement(hot);
  const inputTrapBottom = createInputElement(hot);

  inputTrapTop.addEventListener('focus', () => hooks?.onFocusFromTop());
  inputTrapBottom.addEventListener('focus', () => hooks?.onFocusFromBottom());

  rootElement.firstChild.before(inputTrapTop);
  rootElement.lastChild.after(inputTrapBottom);

  return {
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
  input.classList.add('htFocusCatcher');

  setAttribute(input, getAttributes(hot));

  return input;
}

/**
 * Get a set of accessibility-related attributes to be added to the focus catcher.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @returns {Array[]}
 */
function getAccessibilityAttributes(hot) {
  if (!hot.getSettings().ariaTags) {
    return [];
  }

  return [ACCESSIBILITY_ATTR_PRESENTATION];
}

/**
 * Get the list of all attributes to be added to the focus catcher.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @returns {Array[]}
 */
function getAttributes(hot) {
  return [
    ...getAccessibilityAttributes(hot)
  ];
}
