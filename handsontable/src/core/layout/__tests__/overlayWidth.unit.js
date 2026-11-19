import { getOverlayLayerWidth } from '../overlayWidth';
import { registerAsRootInstance } from '../../../utils/rootInstance';

describe('getOverlayLayerWidth', () => {
  /**
   * Builds a side slot element with a stubbed layout width, which jsdom does not compute on its
   * own. A non-zero width also puts one child into the slot (an empty slot counts as no slot).
   *
   * @param {number} width The slot width.
   * @returns {HTMLElement}
   */
  function createSlot(width) {
    const slot = document.createElement('div');

    Object.defineProperty(slot, 'offsetWidth', { value: width, configurable: true });

    if (width > 0) {
      slot.appendChild(document.createElement('div'));
    }

    return slot;
  }

  /**
   * Builds the slice of a root grid instance the helper reads.
   *
   * @param {object} options The stub options.
   * @param {boolean} options.byWindow Whether the window scrolls the columns.
   * @param {number} options.startWidth The start slot width.
   * @param {number} options.endWidth The end slot width.
   * @param {boolean} options.followsContent Whether the wrapper carries `ht-grid-width-follows-content`.
   * @returns {object}
   */
  function stubInstance({ byWindow = false, startWidth = 0, endWidth = 0, followsContent = false } = {}) {
    const rootWrapperElement = document.createElement('div');

    Object.defineProperty(rootWrapperElement, 'clientWidth', { value: 1200, configurable: true });

    if (followsContent) {
      rootWrapperElement.classList.add('ht-grid-width-follows-content');
    }

    const instance = {
      view: {
        isHorizontallyScrollableByWindow: () => byWindow,
        getWorkspaceWidth: () => 500,
        getTotalTableWidth: () => 2000,
      },
      rootWrapperElement,
      rootSlotStartElement: createSlot(startWidth),
      rootSlotEndElement: createSlot(endWidth),
    };

    registerAsRootInstance(instance);

    return instance;
  }

  it('returns the workspace width when the side slots are empty', () => {
    expect(getOverlayLayerWidth(stubInstance())).toBe(500);
  });

  it('adds the start and end slot widths to the workspace width', () => {
    expect(getOverlayLayerWidth(stubInstance({ startWidth: 160, endWidth: 120 }))).toBe(780);
    expect(getOverlayLayerWidth(stubInstance({ startWidth: 160 }))).toBe(660);
    expect(getOverlayLayerWidth(stubInstance({ endWidth: 120 }))).toBe(620);
  });

  it('uses the total table width when the window scrolls the columns and no side slot is filled', () => {
    expect(getOverlayLayerWidth(stubInstance({ byWindow: true }))).toBe(2000);
  });

  it('adds the side slots to the total table width while the track follows the table', () => {
    expect(getOverlayLayerWidth(stubInstance({
      byWindow: true, startWidth: 160, endWidth: 120, followsContent: true,
    }))).toBe(2280);
  });

  it('takes the wrapper width when the window scrolls a table that fits between the side slots', () => {
    expect(getOverlayLayerWidth(stubInstance({ byWindow: true, startWidth: 160, endWidth: 120 }))).toBe(1200);
  });
});
