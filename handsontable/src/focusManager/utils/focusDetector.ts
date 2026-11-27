import type { HotInstance } from '../../core/types';
import { getDeepActiveElement, isHTMLElement } from '../../helpers/dom/element';
import { FOCUS_SOURCES } from '../constants';

/**
 * @typedef {object} FocusDetector
 * @property {function(): void} activate Activates the focus detector.
 * @property {function(): void} deactivate Deactivates the focus detector.
 * @property {function(): void} destroy Destroys the focus detector.
 */
/**
 * @typedef {object} TabEntry
 * @property {function(): void} arm Makes the entry a Tab stop.
 * @property {function(): void} disarm Takes the entry out of the Tab order.
 * @property {function(): void} destroy Gives back what the entry changed on an element that stays.
 */
type TabEntry = {
  arm: () => void;
  disarm: () => void;
  destroy: () => void;
};

/**
 * Installs a focus detector module. The module appends two catcher elements into the DOM side by side.
 * When the first catcher is focused, then it means that a user entered to the component using the TAB key
 * from the element above. When the second catcher is focused, a user enters to the component from
 * the element below the table.
 *
 * When the top catcher sits right before the grid's root element, the root element takes the Tab entry
 * from above instead, and the top catcher is never focusable. Chromium exposes every focusable element to
 * assistive technology, so an armed catcher in front of the grid was read as an empty item ("blank" in
 * NVDA's browse mode) where the table should be.
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

  const rootElement = hot.rootElement;
  const topEntry = isHTMLElement(rootElement) && inputTrapTop.nextElementSibling === rootElement ?
    createRootEntry(hot, rootElement) :
    createCatcherEntry(inputTrapTop);
  const bottomEntry = createCatcherEntry(inputTrapBottom);

  return {
    /**
     * Activates the detector by making both entries Tab stops.
     */
    activate() {
      topEntry.arm();
      bottomEntry.arm();
    },
    /**
     * Deactivates the detector by taking both entries out of the Tab order.
     */
    deactivate() {
      topEntry.disarm();
      bottomEntry.disarm();
    },
    /**
     * Destroys the focus detector.
     */
    destroy() {
      topEntry.destroy();
      bottomEntry.destroy();
      inputTrapTop.remove();
      inputTrapBottom.remove();
    },
  };
}

/**
 * Creates a Tab entry that is the catcher element itself: armed with `tabindex="0"`, disarmed with
 * `tabindex="-1"`.
 *
 * @param {HTMLElement} catcher The catcher element.
 * @returns {TabEntry}
 */
function createCatcherEntry(catcher: HTMLElement): TabEntry {
  return {
    arm: () => {
      catcher.tabIndex = 0;
    },
    disarm: () => {
      catcher.tabIndex = -1;
    },
    destroy: () => {},
  };
}

/**
 * Creates the Tab entry from above that is the grid's root element. Armed, the root is a Tab stop
 * (`tabindex="0"`) that names its focus source (`data-ht-focus-source="tab_from_above"`), so the scope
 * manager reads it the way it reads a catcher. Disarmed, the root gets back the `tabindex` it had before
 * (none by default) and loses the focus source, so a click or a programmatic focus is never a Tab entry,
 * and Shift+Tab from a cell skips it. A root that holds the focus while it is disarmed keeps
 * `tabindex="-1"`, because removing the attribute from the focused element would drop the focus.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @param {HTMLElement} rootElement The grid's root element.
 * @returns {TabEntry}
 */
function createRootEntry(hot: HotInstance, rootElement: HTMLElement): TabEntry {
  const initialTabIndex = rootElement.getAttribute('tabindex');

  /**
   * Gives the root back the `tabindex` attribute it had before the detector was installed.
   */
  const restoreTabIndex = () => {
    if (initialTabIndex === null) {
      rootElement.removeAttribute('tabindex');
    } else {
      rootElement.setAttribute('tabindex', initialTabIndex);
    }
  };

  return {
    arm: () => {
      rootElement.tabIndex = 0;
      rootElement.dataset.htFocusSource = FOCUS_SOURCES.TAB_FROM_ABOVE;
    },
    disarm: () => {
      delete rootElement.dataset.htFocusSource;

      if (initialTabIndex === null && getDeepActiveElement(hot.rootDocument) === rootElement) {
        rootElement.tabIndex = -1;
      } else {
        restoreTabIndex();
      }
    },
    destroy: () => {
      delete rootElement.dataset.htFocusSource;
      restoreTabIndex();
    },
  };
}

/**
 * Creates a new catcher element. It carries no `tabindex` until a Tab entry arms it.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @param {'from_above' | 'from_below'} focusSource The source of the focus event.
 * @returns {HTMLElement}
 */
function createInputElement(hot: HotInstance, focusSource: string) {
  const rootDocument = hot.rootDocument;
  const catcher = rootDocument.createElement('div');

  catcher.style.display = 'none';
  catcher.classList.add('htFocusCatcher');
  catcher.dataset.htFocusSource = focusSource;

  return catcher;
}
