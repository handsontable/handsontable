import { TableRenderer } from 'walkontable/render/tableRenderer';
import Settings from 'walkontable/settings';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_INLINE_END,
  CLONE_INLINE_START,
  CLONE_TOP,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_TOP_INLINE_START_CORNER,
} from 'walkontable/overlay/constants';

const END_CLONES = [CLONE_INLINE_END, CLONE_TOP_INLINE_END_CORNER, CLONE_BOTTOM_INLINE_END_CORNER];
const OTHER_TABLES = [
  'master',
  CLONE_TOP,
  CLONE_BOTTOM,
  CLONE_INLINE_START,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
];

/**
 * Builds a renderer on top of the REAL settings accessor (so `fixedColumnsEnd` is clamped for real).
 *
 * @param {object} options The grid shape.
 * @param {number} [options.totalColumns=10] Renderable columns.
 * @param {number} [options.fixedColumnsStart=0] Frozen start columns.
 * @param {number} [options.fixedColumnsEnd=0] Requested frozen end columns.
 * @returns {TableRenderer}
 */
function createRenderer({ totalColumns = 10, fixedColumnsStart = 0, fixedColumnsEnd = 0 } = {}) {
  const wtSettings = new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => 5,
    totalColumns: () => totalColumns,
    fixedColumnsStart: () => fixedColumnsStart,
    fixedColumnsEnd: () => fixedColumnsEnd,
  });
  const renderer = new TableRenderer(document.createElement('table'), { cellRenderer: () => {} });

  renderer.setAxisUtils({ wtSettings } as unknown as Parameters<typeof renderer.setAxisUtils>[0],
    {} as unknown as Parameters<typeof renderer.setAxisUtils>[1]);

  return renderer;
}

describe('TableRenderer#getFreezeLineOverlap', () => {
  it('should be 1 in every end table while a column precedes the band', () => {
    const overlaps = END_CLONES.map((overlayName) => {
      const renderer = createRenderer({ totalColumns: 10, fixedColumnsEnd: 2 });

      renderer.setActiveOverlayName(overlayName);

      return [overlayName, renderer.getFreezeLineOverlap()];
    });

    expect(overlaps).toEqual(END_CLONES.map(overlayName => [overlayName, 1]));
  });

  it('should be 0 in every other table', () => {
    const overlaps = OTHER_TABLES.map((overlayName) => {
      const renderer = createRenderer({ totalColumns: 10, fixedColumnsEnd: 2 });

      renderer.setActiveOverlayName(overlayName);

      return [overlayName, renderer.getFreezeLineOverlap()];
    });

    expect(overlaps).toEqual(OTHER_TABLES.map(overlayName => [overlayName, 0]));
  });

  it('should be 0 when the band covers every column (nothing to reach over)', () => {
    const renderer = createRenderer({ totalColumns: 3, fixedColumnsEnd: 3 });

    renderer.setActiveOverlayName(CLONE_INLINE_END);

    expect(renderer.getFreezeLineOverlap()).toBe(0);
  });

  it('should be 0 when no end column is frozen, or the start band takes them all', () => {
    const noBand = createRenderer({ totalColumns: 10, fixedColumnsEnd: 0 });
    const clamped = createRenderer({ totalColumns: 10, fixedColumnsStart: 10, fixedColumnsEnd: 5 });

    noBand.setActiveOverlayName(CLONE_INLINE_END);
    clamped.setActiveOverlayName(CLONE_INLINE_END);

    expect(noBand.getFreezeLineOverlap()).toBe(0);
    expect(clamped.getFreezeLineOverlap()).toBe(0);
  });
});
