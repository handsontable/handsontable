import { ItemsFactory } from 'handsontable/plugins/contextMenu/itemsFactory';

/**
 * `ItemsFactory` only needs `hot.rootElement` — it is the scope the "warn once" state binds to.
 *
 * @returns {object} A minimal Handsontable stand-in.
 */
function hotMock() {
  return { rootElement: {} };
}

/**
 * Describes every produced item so a resolved entry is distinguishable from a placeholder, which
 * is the whole subject of these tests.
 *
 * A resolved item carries a `name` FUNCTION returning the translated phrase, and is reported as
 * `<its key>`. A placeholder carries the raw key string as its `name` — the value that used to be
 * rendered into the menu verbatim — and is reported as that string.
 *
 * @param {object[]} items The produced menu items.
 * @returns {string[]}
 */
function namesOf(items) {
  return items.map(item => (typeof item.name === 'function' ? `<${item.key}>` : item.name));
}

describe('contextMenu/ItemsFactory', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('the pass before the default-options hook has run', () => {
    // This is the pass whose output is handed to `afterContextMenuDefaultOptions`. Plugin keys are
    // legitimately unknown here, so a placeholder MUST still be emitted for a plugin to merge its
    // rich entry into. See the merge comment in `setPredefinedItems` and issue #9894.
    it('emits a placeholder for a key it cannot resolve yet', () => {
      const factory = new ItemsFactory(hotMock());

      const items = factory.getItems(['row_above', 'borders']);

      expect(namesOf(items)).toEqual(['<row_above>', 'borders']);
    });

    it('does not warn, because the key may still be contributed', () => {
      const factory = new ItemsFactory(hotMock());

      factory.getItems(['borders']);

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('keeps the list non-empty, which plugins that splice by index depend on', () => {
      // `nestedRows/ui/contextMenu.ts` runs `rangeEach(0, items.length - 1, …)` and inserts its
      // entries only when the list is NOT empty. Dropping unknown keys on this pass would make
      // `contextMenu: ['add_child']` produce an empty list, nestedRows would never insert, and
      // `add_child` would vanish — re-breaking issue #9894.
      const factory = new ItemsFactory(hotMock());

      expect(factory.getItems(['add_child'])).toHaveLength(1);
    });
  });

  describe('the pass after the default-options hook has run', () => {
    it('skips a key that still resolves to nothing', () => {
      const factory = new ItemsFactory(hotMock());

      // What the plugins contributed. `borders` was never among them, so it stays unresolvable.
      factory.setPredefinedItems(factory.getItems(['row_above', 'borders']));

      const items = factory.getItems(['row_above', 'borders']);

      // Before this fix the unresolved key became `{ name: 'borders', key: '0' }` and the menu
      // rendered a row reading `borders` that did nothing when clicked (issues #5429, #5027).
      expect(namesOf(items)).toEqual(['<row_above>']);
    });

    it('warns once per unresolved key so a typo is findable', () => {
      const factory = new ItemsFactory(hotMock());

      factory.setPredefinedItems(factory.getItems(['row_abvoe']));
      factory.getItems(['row_abvoe']);
      factory.getItems(['row_abvoe']);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('row_abvoe');
    });

    it('warns separately for each distinct unresolved key', () => {
      const factory = new ItemsFactory(hotMock());

      factory.setPredefinedItems(factory.getItems(['row_abvoe', 'col_lfet']));
      factory.getItems(['row_abvoe', 'col_lfet']);

      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('still resolves a key a plugin did contribute', () => {
      const factory = new ItemsFactory(hotMock());
      const contributed = factory.getItems(['borders']);

      // Stand in for what `customBorders` pushes from the hook when it is enabled.
      contributed.push({ key: 'borders', name: 'Borders', submenu: { items: [] } });
      factory.setPredefinedItems(contributed);

      // Resolved to the rich entry, so it keeps its translated name rather than being skipped.
      expect(namesOf(factory.getItems(['borders']))).toEqual(['Borders']);
    });

    it('never skips an array entry that is a full item definition object', () => {
      const factory = new ItemsFactory(hotMock());
      const custom = { name: 'My own item', callback() {} };

      factory.setPredefinedItems(factory.getItems([custom]));

      // An object entry is a definition, not a key to look up, so the unresolved-key path must
      // not touch it.
      expect(namesOf(factory.getItems([custom]))).toEqual(['My own item']);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('leaves the object form of `items` alone', () => {
      const factory = new ItemsFactory(hotMock());
      const pattern = { items: { 'alignment:left': { name: 'Left' } } };

      factory.setPredefinedItems(factory.getItems(pattern));

      // Only the array form looks a bare string up in the registry. The object form declares the
      // item inline, so its key is taken verbatim and the entry is kept.
      expect(namesOf(factory.getItems(pattern))).toEqual(['Left']);
    });
  });

  describe('keys that name a built-in item with no entry', () => {
    it('are dropped without a warning, as they always were', () => {
      const factory = new ItemsFactory(hotMock());

      // `ITEMS` members are known names, so an absent entry is an availability question, not a
      // mistake — the `allowInsert*`/`allowRemove*` options hide these at render time instead.
      factory.setPredefinedItems([]);

      expect(factory.getItems(['row_above'])).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
