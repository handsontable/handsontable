import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DragToScroll } from '../../dragToScroll';
import { MoveCells } from '../../moveCells';
import { SelectionHandles } from '../selectionHandles';

/**
 * The `selectionHandles` and `moveCells` border elements are created lazily, on the first `appear()`
 * whose visibility predicate resolves truthy. Creating them eagerly in the `Border` constructor cost
 * every instance 8 divs and their listeners per border, per highlight type, per overlay — including
 * the majority that leave both options off.
 *
 * Scope note: this suite covers the OFF case only. jsdom has no real layout, so the visibility
 * predicates never resolve truthy here and the creation path cannot be exercised. The positive case —
 * the elements appearing, and still responding to `mousedown` after their listeners moved into the
 * lazy `create*` methods — needs a real browser and is covered by every drag test in
 * `tests/e2e/selection-handles.spec.ts` and `tests/e2e/move-zone.spec.ts`.
 */
describe('lazily created selection border elements', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(DragToScroll);
    registerPlugin(MoveCells);
    registerPlugin(SelectionHandles);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid and selects a range so the selection borders draw.
   *
   * @param {object} options Setting overrides.
   * @returns {object} The Handsontable instance.
   */
  function buildAndSelect(options) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 'x')),
      licenseKey: 'non-commercial-and-evaluation',
      ...options,
    });

    hot.selectCells([[1, 1, 3, 3]]);
    hot.render();

    return hot;
  }

  // Deliberately NOT a `:visible`-style filter — this must distinguish "never created" from
  // "created but hidden", which is the whole point of the change.
  const countHandles = () => container.querySelectorAll('.wtSelectionHandle').length;
  const countMoveZones = () => container.querySelectorAll('.wtMoveZone').length;

  it('creates no handle or move-zone elements when both options are off', () => {
    buildAndSelect({ selectionHandles: false, moveCells: false });

    expect(countHandles()).toBe(0);
    expect(countMoveZones()).toBe(0);
  });

  it('creates no handle or move-zone elements when neither option is set at all', () => {
    // The defaults: this is what every existing user gets, and the case the regression hit.
    buildAndSelect({});

    expect(countHandles()).toBe(0);
    expect(countMoveZones()).toBe(0);
  });

  it('still draws the ordinary selection borders', () => {
    // Guards the two assertions above from passing vacuously: if no border drew at all, a zero
    // handle/move-zone count would prove nothing about the gating.
    buildAndSelect({ selectionHandles: false, moveCells: false });

    expect(container.querySelectorAll('.wtBorder').length).toBeGreaterThan(0);
  });
});

