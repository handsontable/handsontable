/**
 * Installs a focus detector module. The module appends two input elements into the DOM side by side.
 * When the first input is focused, then it means that a user entered the component using the TAB key
 * from the element above. When the second input is focused, a user enters the component from
 * the element below the table. Each action, once detected, triggers the specific hook.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @param {{ onFocusFromTop: Function, onFocusFromBottom: Function }} hooks An object with defined callbacks to call.
 * @returns {{ activate: Function, deactivate: Function }}
 */
export function installFocusDetector(hot, hooks = {}) {
  const rootDocument = hot.rootDocument;
  const rootElement = hot.rootElement;
  const inputTrapTop = createInputElement(rootDocument);
  const inputTrapBottom = createInputElement(rootDocument);

  inputTrapTop.addEventListener('focus', () => hooks?.onFocusFromTop());
  inputTrapBottom.addEventListener('focus', () => hooks?.onFocusFromBottom());

  rootElement.insertBefore(inputTrapBottom, rootElement.firstChild);
  rootElement.insertBefore(inputTrapTop, rootElement.firstChild);

  return {
    activate() {
      hot._registerTimeout(() => {
        inputTrapTop.tabIndex = 0;
        inputTrapBottom.tabIndex = 0;
      }, 10);
    },
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
 * @param {Document} rootDocument The owner document element.
 * @returns {HTMLInputElement}
 */
function createInputElement(rootDocument) {
  const input = rootDocument.createElement('input');

  input.type = 'text';
  input.classList.add('htFocusCatcher');

  return input;
}
