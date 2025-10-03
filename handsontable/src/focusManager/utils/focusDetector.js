import { setAttribute } from '../../helpers/dom/element';
import { A11Y_LABEL } from '../../helpers/a11y';
import { FOCUS_SOURCES } from '../constants';

/**
 * @typedef {object} FocusDetector
 * @property {function(): void} activate Activates the focus detector.
 * @property {function(): void} deactivate Deactivates the focus detector.
 * @property {function(): void} destroy Destroys the focus detector.
 */
/**
 * Installs a focus detector module. The module appends two input elements into the DOM side by side.
 * When the first input is focused, then it means that a user entered to the component using the TAB key
 * from the element above. When the second input is focused, a user enters to the component from
 * the element below the table.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @param {HTMLElement} wrapperElement The wrapper element to install the focus detector into.
 * @returns {FocusDetector}
 */
export function installFocusDetector(hot, wrapperElement) {
  const inputTrapTop = createInputElement(hot, FOCUS_SOURCES.TAB_FROM_ABOVE);
  const inputTrapBottom = createInputElement(hot, FOCUS_SOURCES.TAB_FROM_BELOW);

  wrapperElement.prepend(inputTrapTop);
  wrapperElement.append(inputTrapBottom);

  return {
    /**
     * Activates the detector by resetting the tabIndex of the input elements.
     */
    activate() {
      inputTrapTop.tabIndex = 0;
      inputTrapBottom.tabIndex = 0;
    },
    /**
     * Deactivates the detector by setting tabIndex to -1.
     */
    deactivate() {
      inputTrapTop.tabIndex = -1;
      inputTrapBottom.tabIndex = -1;
    },
    /**
     * Destroys the focus detector.
     */
    destroy() {
      inputTrapTop.remove();
      inputTrapBottom.remove();
    },
  };
}

/**
 * Creates a new HTML input element.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @param {'from_above' | 'from_below'} focusSource The source of the focus event.
 * @returns {HTMLInputElement}
 */
function createInputElement(hot, focusSource) {
  const rootDocument = hot.rootDocument;
  const input = rootDocument.createElement('input');
  const inputStyle = input.style;

  input.type = 'text';
  input.name = 'htFocusCatcher';
  input.classList.add('htFocusCatcher');
  input.dataset.htFocusSource = focusSource;

  [
    ['position', 'absolute'],
    ['width', '0'],
    ['height', '0'],
    ['opacity', '0'],
    ['zIndex', '-1'],
    ['border', 'none'],
    ['outline', 'none'],
    ['padding', '0'],
    ['margin', '0']
  ].forEach(([property, value]) => {
    inputStyle[property] = value;
  });

  if (hot.getSettings().ariaTags) {
    setAttribute(input, [
      A11Y_LABEL('Focus catcher')
    ]);
  }

  return input;
}
