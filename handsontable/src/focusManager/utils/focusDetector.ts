import type { HotInstance } from '../../core/types';
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
export function installFocusDetector(hot: HotInstance, wrapperElement: HTMLElement) {
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
function createInputElement(hot: HotInstance, focusSource: string) {
  const rootDocument = hot.rootDocument;
  const catcher = rootDocument.createElement('div');

  catcher.style.display = 'none';
  catcher.classList.add('htFocusCatcher');
  catcher.dataset.htFocusSource = focusSource;

  return catcher;
}
