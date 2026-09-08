import { isItemChecked, isItemCheckable } from 'handsontable/plugins/contextMenu/menu/utils';
import readOnlyItem from 'handsontable/plugins/contextMenu/predefinedItems/readOnly';
import readOnlyCommentItem from 'handsontable/plugins/comments/contextMenuItem/readOnlyComment';
import topItem from 'handsontable/plugins/customBorders/contextMenuItem/top';
import bottomItem from 'handsontable/plugins/customBorders/contextMenuItem/bottom';
import leftItem from 'handsontable/plugins/customBorders/contextMenuItem/left';
import rightItem from 'handsontable/plugins/customBorders/contextMenuItem/right';

/**
 * A range covering a single cell, in the shape `checkSelectionConsistency` and
 * `checkSelectionBorders` both walk.
 *
 * @returns {object}
 */
function singleCellRange() {
  return {
    forAll(callback) {
      callback(0, 0);
    },
  };
}

/**
 * The slice of a Handsontable instance these item factories read.
 *
 * @param {object} cellMeta The meta the single selected cell reports.
 * @returns {object}
 */
function createHotStub(cellMeta = {}) {
  return {
    getSelectedRange: () => [singleCellRange()],
    getCellMetaTransient: () => cellMeta,
    getCellMeta: () => cellMeta,
    getTranslatedPhrase: phrase => phrase,
    isRtl: () => false,
  };
}

/**
 * Every item that draws a check mark, with the cell meta that should light it up.
 *
 * `readOnlyComment` takes the Comments plugin rather than reading cell meta, so it carries its own
 * factory arguments. The custom-borders items take the plugin only for `hot.isRtl()` and
 * `prepareBorder`, neither of which `checked()` touches.
 */
const CHECKED_ITEMS = [
  {
    label: 'make_read_only',
    build: () => readOnlyItem(),
    checkedMeta: { readOnly: true },
    uncheckedMeta: { readOnly: false },
  },
  {
    label: 'commentsReadOnly',
    build: plugin => readOnlyCommentItem(plugin),
    plugin: checked => ({ getCommentMeta: () => checked }),
    checkedMeta: {},
    uncheckedMeta: {},
  },
  {
    label: 'borders:top',
    build: hot => topItem({ hot }),
    checkedMeta: { borders: { top: {} } },
    uncheckedMeta: {},
  },
  {
    label: 'borders:bottom',
    build: hot => bottomItem({ hot }),
    checkedMeta: { borders: { bottom: {} } },
    uncheckedMeta: {},
  },
  {
    label: 'borders:left',
    build: hot => leftItem({ hot }),
    checkedMeta: { borders: { start: {} } },
    uncheckedMeta: {},
  },
  {
    label: 'borders:right',
    build: hot => rightItem({ hot }),
    checkedMeta: { borders: { end: {} } },
    uncheckedMeta: {},
  },
];

/**
 * Builds one item against a stub in the requested state.
 *
 * @param {object} spec An entry of `CHECKED_ITEMS`.
 * @param {boolean} checked Whether the stub should report the checked state.
 * @returns {{ item: object, hot: object }}
 */
function buildItem(spec, checked) {
  const hot = createHotStub(checked ? spec.checkedMeta : spec.uncheckedMeta);
  const item = spec.plugin ? spec.build(spec.plugin(checked), hot) : spec.build(hot);

  return { item, hot };
}

describe('menu items that draw a check mark', () => {
  // Guards the wiring the renderer unit test cannot see: it builds synthetic items, so a `checked`
  // block silently dropped from one of these six factories would leave every suite green while
  // users lose the mark. The legacy positioning specs only ever query `Read only`.

  CHECKED_ITEMS.forEach((spec) => {
    describe(spec.label, () => {
      it('should report checked when the selection is in that state', () => {
        const { item, hot } = buildItem(spec, true);

        expect(isItemChecked(item, hot)).toBe(true);
      });

      it('should report unchecked otherwise', () => {
        const { item, hot } = buildItem(spec, false);

        expect(isItemChecked(item, hot)).toBe(false);
      });

      it('should be announced as a checkbox, so the mark has an accessible equivalent', () => {
        const { item } = buildItem(spec, true);

        expect(isItemCheckable(item)).toBe(true);
      });

      it('should keep markup out of its label', () => {
        const { item, hot } = buildItem(spec, true);
        const name = typeof item.name === 'function' ? item.name.call(hot) : item.name;

        // The whole point of DEV-2650. A label carrying `<span class="selected">` reaches
        // `innerHTML` through `fastInnerHTML` and throws under a CSP enforcing Trusted Types.
        expect(name).not.toContain('<');
        expect(name).not.toContain('selected');
      });
    });
  });

  it('should cover every item that declares the flag', () => {
    // A tripwire against this list falling behind: if a seventh item starts drawing a mark, it
    // has to be added here rather than shipping untested.
    expect(CHECKED_ITEMS.length).toBe(6);
  });
});
