import {
  getItemCheckedState,
  isItemChecked,
  isItemCheckable,
  MENU_ITEM_MIXED,
} from 'handsontable/plugins/contextMenu/menu/utils';
import readOnlyItem from 'handsontable/plugins/contextMenu/predefinedItems/readOnly';
import readOnlyCommentItem from 'handsontable/plugins/comments/contextMenuItem/readOnlyComment';
import topItem from 'handsontable/plugins/customBorders/contextMenuItem/top';
import bottomItem from 'handsontable/plugins/customBorders/contextMenuItem/bottom';
import leftItem from 'handsontable/plugins/customBorders/contextMenuItem/left';
import rightItem from 'handsontable/plugins/customBorders/contextMenuItem/right';

/**
 * A range covering a single cell, in the shape `getSelectionCheckState` and
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
    // Deliberately no `getCellMeta`. Every one of these factories must read transiently - they
    // walk the whole selection on each menu draw - so a regression back to the materializing read
    // throws here instead of passing silently. Returning the same object from both would make the
    // switch unobservable, which is what the first version of this stub did.
    getTranslatedPhrase: phrase => phrase,
    isRtl: () => false,
  };
}

/**
 * Every item that draws a check mark, with the cell meta that should light it up.
 *
 * `readOnlyComment` takes the Comments plugin instance, but `checked()` no longer reads through it
 * - the state comes from the cell's own meta. The custom-borders items take the plugin only for
 * `hot.isRtl()` and `prepareBorder`, neither of which `checked()` touches.
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
    plugin: () => ({}),
    checkedMeta: { comment: { value: 'a note', readOnly: true } },
    uncheckedMeta: { comment: { value: 'a note' } },
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
  const item = spec.plugin ? spec.build(spec.plugin(), hot) : spec.build(hot);

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

describe('menu items whose selection is only partly on (DEV-124)', () => {
  /**
   * A stub whose selection is two cells, each reporting its own meta.
   *
   * @param {object} firstMeta The meta of cell (0, 0).
   * @param {object} secondMeta The meta of cell (0, 1).
   * @returns {object}
   */
  function createTwoCellHotStub(firstMeta, secondMeta) {
    return {
      getSelectedRange: () => [{
        forAll(callback) {
          if (callback(0, 0) !== false) {
            callback(0, 1);
          }
        },
      }],
      getCellMetaTransient: (row, col) => (col === 0 ? firstMeta : secondMeta),
      getTranslatedPhrase: phrase => phrase,
    };
  }

  const MIXED_ITEMS = [
    {
      label: 'make_read_only',
      build: () => readOnlyItem(),
      onMeta: { readOnly: true },
      offMeta: { readOnly: false },
    },
    {
      label: 'commentsReadOnly',
      build: () => readOnlyCommentItem({}),
      onMeta: { comment: { value: 'a note', readOnly: true } },
      offMeta: { comment: { value: 'another note' } },
    },
  ];

  MIXED_ITEMS.forEach((spec) => {
    describe(spec.label, () => {
      it('should report mixed, not checked, when one cell is on and the other is off', () => {
        const hot = createTwoCellHotStub(spec.onMeta, spec.offMeta);
        const item = spec.build();

        expect(getItemCheckedState(item, hot)).toBe(MENU_ITEM_MIXED);
        // The two-state reader must not read a partly-on selection as checked.
        expect(isItemChecked(item, hot)).toBe(false);
      });

      it('should still report checked when every cell is on', () => {
        const hot = createTwoCellHotStub(spec.onMeta, spec.onMeta);

        expect(getItemCheckedState(spec.build(), hot)).toBe(true);
      });

      it('should still report unchecked when no cell is on', () => {
        const hot = createTwoCellHotStub(spec.offMeta, spec.offMeta);

        expect(getItemCheckedState(spec.build(), hot)).toBe(false);
      });
    });
  });

  it('should keep the toggle acting on "at least one", so a mixed selection is cleared', () => {
    const cells = [{ readOnly: true }, { readOnly: false }];
    const setCellMeta = jest.fn();
    const hot = {
      ...createTwoCellHotStub(cells[0], cells[1]),
      setCellMeta,
      render: jest.fn(),
    };

    readOnlyItem().callback.call(hot);

    // Unchanged since 2014 and pinned by `readOnly.spec.js`: the mark changed, the action did not.
    expect(setCellMeta.mock.calls).toEqual([
      [0, 0, 'readOnly', false],
      [0, 1, 'readOnly', false],
    ]);
  });

  it('should decide the toggle from the first read-only cell, without reading the rest', () => {
    // The mark has to walk a fully read-only selection to the end; the click does not, and on a
    // 100k-cell column that is 100k meta reads before the writes even start.
    const getCellMetaTransient = jest.fn(() => ({ readOnly: true }));
    const hot = {
      ...createTwoCellHotStub({}, {}),
      getCellMetaTransient,
      setCellMeta: jest.fn(),
      render: jest.fn(),
    };

    readOnlyItem().callback.call(hot);

    expect(getCellMetaTransient).toHaveBeenCalledTimes(1);
    expect(hot.setCellMeta).toHaveBeenCalledTimes(2);
  });

  describe('the "Read-only comment" click', () => {
    /**
     * Clicks the item over a two-cell selection and returns the comment meta it wrote.
     *
     * @param {object} firstMeta The meta of cell (0, 0).
     * @param {object} secondMeta The meta of cell (0, 1).
     * @returns {Array[]}
     */
    function clickCommentItem(firstMeta, secondMeta) {
      const hot = createTwoCellHotStub(firstMeta, secondMeta);
      const updateCommentMeta = jest.fn();
      const plugin = {
        getCommentMeta: (row, col, key) => (col === 0 ? firstMeta : secondMeta).comment?.[key],
        updateCommentMeta,
      };

      hot.getSelectedRangeActive = () => hot.getSelectedRange()[0];
      readOnlyCommentItem(plugin).callback.call(hot);

      return updateCommentMeta.mock.calls;
    }

    it('should make every comment writable when one is read-only, so a mixed mark clears', () => {
      // Flipping each cell on its own turned a mixed selection into the opposite mixed selection,
      // so the dash came back after every click.
      expect(clickCommentItem(
        { comment: { value: 'a note', readOnly: true } },
        { comment: { value: 'another note' } },
      )).toEqual([
        [0, 0, { readOnly: false }],
        [0, 1, { readOnly: false }],
      ]);
    });

    it('should make every comment read-only when none is', () => {
      expect(clickCommentItem(
        { comment: { value: 'a note' } },
        { comment: { value: 'another note' } },
      )).toEqual([
        [0, 0, { readOnly: true }],
        [0, 1, { readOnly: true }],
      ]);
    });

    it('should not write to a cell without a comment, or to a hidden merged cell', () => {
      expect(clickCommentItem({ comment: { value: 'a note' } }, {}))
        .toEqual([[0, 0, { readOnly: true }]]);
      expect(clickCommentItem({ comment: { value: 'a note' } }, { hidden: true, comment: { value: 'x' } }))
        .toEqual([[0, 0, { readOnly: true }]]);
    });
  });

  describe('cells that do not take part in the mark', () => {
    it('should read a merged block by its top-left cell, not by the hidden cells under it', () => {
      // MergeCells stretches the selection over the whole block and marks every covered cell
      // `hidden`, but the block's `readOnly` usually sits on the top-left cell alone.
      const hot = createTwoCellHotStub({ readOnly: true }, { hidden: true });

      expect(getItemCheckedState(readOnlyItem(), hot)).toBe(true);
    });

    it('should read a merged block\'s comment by its top-left cell as well', () => {
      const hot = createTwoCellHotStub(
        { comment: { value: 'a note', readOnly: true } },
        { hidden: true, comment: { value: 'stale', readOnly: false } },
      );

      expect(getItemCheckedState(readOnlyCommentItem({}), hot)).toBe(true);
    });

    it('should judge the comment item only by the cells that hold a comment', () => {
      const readOnlyComment = { comment: { value: 'a note', readOnly: true } };

      // No comment at all, and comment meta with no value – which the item's own callback leaves
      // behind on a cell without a comment – both stay out of it.
      expect(getItemCheckedState(readOnlyCommentItem({}), createTwoCellHotStub(readOnlyComment, {})))
        .toBe(true);
      expect(getItemCheckedState(readOnlyCommentItem({}),
        createTwoCellHotStub(readOnlyComment, { comment: { readOnly: false } }))).toBe(true);
    });

    it('should still report mixed when a commented cell is writable', () => {
      const hot = createTwoCellHotStub(
        { comment: { value: 'a note', readOnly: true } },
        { comment: { value: 'another note' } },
      );

      expect(getItemCheckedState(readOnlyCommentItem({}), hot)).toBe(MENU_ITEM_MIXED);
    });
  });
});

describe('resolving the checked state of an item', () => {
  it('should pass the mixed literal through, from a value or from a function', () => {
    expect(getItemCheckedState({ checked: MENU_ITEM_MIXED }, {})).toBe(MENU_ITEM_MIXED);
    expect(getItemCheckedState({ checked: () => MENU_ITEM_MIXED }, {})).toBe(MENU_ITEM_MIXED);
  });

  it('should read anything other than `true` or the mixed literal as unchecked', () => {
    // Items written against the two-state API keep behaving as they did: a truthy value that is
    // not `true` was never checked, and a string other than the literal is not a third state.
    [false, undefined, null, 1, 'true', 'Mixed', {}].forEach((checked) => {
      expect(getItemCheckedState({ checked }, {})).toBe(false);
      expect(getItemCheckedState({ checked: () => checked }, {})).toBe(false);
    });
  });

  it('should call a `checked` function with the Handsontable instance as `this`', () => {
    const hot = {};
    let receiver;

    getItemCheckedState({ checked() {
      receiver = this;

      return true;
    } }, hot);

    expect(receiver).toBe(hot);
  });

  it('should treat a static mixed state as checkable, and no other string', () => {
    // A mark drawn on a plain `menuitem` has no accessible equivalent, so a static `'mixed'` must
    // announce as a checkbox. An unrelated string property named `checked` must still not.
    expect(isItemCheckable({ checked: MENU_ITEM_MIXED })).toBe(true);
    expect(isItemCheckable({ checked: 'something else' })).toBe(false);
  });
});
