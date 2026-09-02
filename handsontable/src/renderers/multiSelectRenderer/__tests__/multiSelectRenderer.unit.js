import {
  RENDERER_TYPE,
  multiSelectRenderer,
} from '../';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from '../../registry';
import {
  registerCellType,
  MultiSelectCellType,
} from '../../../cellTypes';
import {
  removeValueByKey,
} from '../utils/utils';

registerCellType(MultiSelectCellType);

describe('multiSelectRenderer', () => {
  describe('registering', () => {
    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, multiSelectRenderer);

      expect(getRegisteredRendererNames()).toEqual([RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('reading the source data (#12812)', () => {
    it('should read source data using the physical row and the visual column index', () => {
      // `getSourceDataAtCell` expects a physical row but a visual column. Converting the
      // column to a physical index here double-translates it once columns are reordered,
      // which made the renderer display a neighbouring column's value.
      const visualRow = 2;
      const visualColumn = 3;
      const physicalRow = 7;
      const getSourceDataAtCell = jest.fn(() => []);
      const toPhysicalColumn = jest.fn(() => 9);
      const hotInstance = {
        rootDocument: document,
        // The renderer registers the dropdown indicator's delegated listener on the root element,
        // and an `afterDestroy` hook to tear it down.
        rootElement: document.createElement('div'),
        addHookOnce: jest.fn(),
        getSettings: () => ({ ariaTags: false }),
        toPhysicalRow: () => physicalRow,
        toPhysicalColumn,
        getSourceDataAtCell,
      };
      const TD = document.createElement('td');

      multiSelectRenderer(hotInstance, TD, visualRow, visualColumn, visualColumn, 'value', {});

      expect(getSourceDataAtCell).toHaveBeenCalledWith(physicalRow, visualColumn);
      expect(toPhysicalColumn).not.toHaveBeenCalled();
    });
  });

  describe('removeValueByKey (#12966)', () => {
    it('should remove the entry matching the given key from a plain string array', () => {
      expect(removeValueByKey(['Red', 'Green', 'Blue'], 'Green')).toEqual(['Red', 'Blue']);
    });

    it('should remove the entry matching the given key from a key/value object array', () => {
      const source = [
        { key: 'r', value: 'Red' },
        { key: 'g', value: 'Green' },
        { key: 'b', value: 'Blue' },
      ];

      expect(removeValueByKey(source, 'g')).toEqual([
        { key: 'r', value: 'Red' },
        { key: 'b', value: 'Blue' },
      ]);
    });
  });

  describe('dropdown indicator (#13316)', () => {
    const ARROW_SELECTOR = '.ht-multi-select-arrow';

    /**
     * Builds the smallest instance stub the renderer needs to reach all three of its render paths.
     *
     * @param {object} [options] Stub options.
     * @param {Array} [options.values] Value returned by `getSourceDataAtCell`.
     * @param {boolean} [options.ariaTags] Value of the `ariaTags` setting.
     * @returns {object} The stubbed Handsontable instance.
     */
    function createHotStub({ values = [], ariaTags = false } = {}) {
      return {
        rootDocument: document,
        rootElement: document.createElement('div'),
        getSettings: () => ({ ariaTags }),
        toPhysicalRow: row => row,
        getSourceDataAtCell: () => values,
        getColWidth: () => 200,
        addHook: jest.fn(),
        addHookOnce: jest.fn(),
      };
    }

    it('should render the indicator in a cell that holds chips', () => {
      const TD = document.createElement('td');

      multiSelectRenderer(
        createHotStub({ values: ['Red', 'Green'] }), TD, 0, 0, 0, ['Red', 'Green'], {}
      );

      expect(TD.querySelectorAll(ARROW_SELECTOR)).toHaveLength(1);
      expect(TD.querySelectorAll('.ht-multi-select-chip')).toHaveLength(2);
    });

    it('should render the indicator in an empty cell, so the cell still reads as a list cell', () => {
      const TD = document.createElement('td');

      multiSelectRenderer(createHotStub({ values: [] }), TD, 0, 0, 0, null, {});

      expect(TD.querySelectorAll(ARROW_SELECTOR)).toHaveLength(1);
    });

    it('should render the indicator alongside the placeholder', () => {
      const TD = document.createElement('td');

      multiSelectRenderer(
        createHotStub({ values: [] }), TD, 0, 0, 0, null, { placeholder: 'Select items' }
      );

      expect(TD.querySelectorAll(ARROW_SELECTOR)).toHaveLength(1);
      expect(TD.textContent).toContain('Select items');
    });

    describe.each([
      ['placeholder', { placeholder: 'Select items' }, []],
      ['empty', {}, []],
      ['chips', {}, ['Red', 'Green']],
    ])('re-rendering a reused TD (%s branch)', (unusedName, cellProperties, values) => {
      it('should leave exactly one indicator, discarding the one from the previous render', () => {
        // Handsontable reuses TD elements between renders. The renderer relies on each branch
        // clearing the cell first rather than de-duplicating, so seed a stale indicator and prove
        // it does not survive. A plain re-render cannot prove this: it would also pass if the
        // clearing stopped happening but the indicator were merely never added twice.
        const hotInstance = createHotStub({ values });
        const TD = document.createElement('td');
        const stale = document.createElement('span');

        stale.className = 'ht-multi-select-arrow';
        stale.dataset.row = '99';
        TD.appendChild(stale);

        multiSelectRenderer(hotInstance, TD, 0, 0, 0, values.length ? values : null, cellProperties);

        const arrows = TD.querySelectorAll(ARROW_SELECTOR);

        expect(arrows).toHaveLength(1);
        // The survivor is the fresh one, not the seeded stale element.
        expect(arrows[0].dataset.row).toBe('0');
      });
    });

    it('should carry the visual coordinates so one delegated listener can serve every cell', () => {
      const TD = document.createElement('td');

      multiSelectRenderer(createHotStub({ values: ['Red'] }), TD, 4, 7, 7, ['Red'], {});

      const arrow = TD.querySelector(ARROW_SELECTOR);

      expect(arrow.dataset.row).toBe('4');
      expect(arrow.dataset.col).toBe('7');
    });

    it('should hide the indicator from assistive technology when ariaTags is enabled', () => {
      const TD = document.createElement('td');

      multiSelectRenderer(
        createHotStub({ values: ['Red'], ariaTags: true }), TD, 0, 0, 0, ['Red'], {}
      );

      expect(TD.querySelector(ARROW_SELECTOR).getAttribute('aria-hidden')).toBe('true');
    });

    it('should not set aria-hidden when ariaTags is disabled', () => {
      const TD = document.createElement('td');

      multiSelectRenderer(
        createHotStub({ values: ['Red'], ariaTags: false }), TD, 0, 0, 0, ['Red'], {}
      );

      expect(TD.querySelector(ARROW_SELECTOR).hasAttribute('aria-hidden')).toBe(false);
    });
  });
});
