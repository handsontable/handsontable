import { SettingsMapper } from '../src/settingsMapper';
import { HotTableProps } from '../src/types';

describe('Settings mapper unit tests', () => {
  describe('getSettings', () => {
    it('should return a valid settings object, when provided an object with settings (including the hooks)', () => {
      const initial: HotTableProps = {
        width: 300,
        height: 300,
        contextMenu: true,
        columns: [
          { label: { value: 'first label' } },
          { label: { value: 'second label' } }
        ],
        afterChange: () => {
          return 'works!';
        },
        afterRender: () => {
          return 'also works!';
        }
      };
      const result = SettingsMapper.getSettings(initial);

      expect(
        !!result.width && !!result.height && !!result.contextMenu &&
        !!result.columns && !!result.afterChange && !!result.afterRender
      ).toEqual(true);
      expect(Object.keys(initial).length).toEqual(Object.keys(result).length);
      expect(result.width).toEqual(300);
      expect(result.height).toEqual(300);
      expect(result.contextMenu).toEqual(true);
      expect(JSON.stringify(initial.columns)).toEqual(JSON.stringify(result.columns));
      expect(JSON.stringify(result.afterChange)).toEqual(JSON.stringify(initial.afterChange));
      expect(JSON.stringify(result.afterRender)).toEqual(JSON.stringify(initial.afterRender));
      expect((result.afterChange as any)()).toEqual('works!');
      expect((result.afterRender as any)()).toEqual('also works!');
    });

    it('should skip deep-equal `dataSchema` and `columns` when updating settings', () => {
      const prevProps: HotTableProps = {
        dataSchema: {
          paymentDivision: '',
          totals: {
            quantity: 0,
            price: 0,
          },
        },
        columns: [
          {
            data: 'paymentDivision',
            type: 'autocomplete',
            source: ['A', 'B', 'C'],
            strict: true,
            allowInvalid: true,
          },
          {
            data: 'totals.quantity',
            type: 'numeric',
          },
        ],
        readOnly: false,
      };
      const nextProps: HotTableProps = {
        dataSchema: {
          paymentDivision: '',
          totals: {
            quantity: 0,
            price: 0,
          },
        },
        columns: [
          {
            data: 'paymentDivision',
            type: 'autocomplete',
            source: ['A', 'B', 'C'],
            strict: true,
            allowInvalid: true,
          },
          {
            data: 'totals.quantity',
            type: 'numeric',
          },
        ],
        readOnly: false,
      };

      const result = SettingsMapper.getSettings(nextProps, {
        prevProps,
        isInit: false,
      });

      expect(result.dataSchema).toBe(undefined);
      expect(result.columns).toBe(undefined);
      expect(result.readOnly).toBe(false);
    });

    // Issue #4371. Passing `rowHeights` or `colWidths` to `updateSettings()` re-declares the sizes
    // and discards the ones the user produced by dragging. A re-render must not do that, and an app
    // commonly writes the value inline, which is a new array on every render.
    it('should skip `rowHeights` and `colWidths` when the value did not change', () => {
      const prevProps: HotTableProps = {
        rowHeights: [50, 50, 50],
        colWidths: 100,
        readOnly: false,
      };
      const nextProps: HotTableProps = {
        // A new array with the same contents, as an inline prop produces on every render.
        rowHeights: [50, 50, 50],
        colWidths: 100,
        readOnly: false,
      };

      const settings = SettingsMapper.getSettings(nextProps, { prevProps, isInit: false });

      expect(settings.rowHeights).toBeUndefined();
      expect(settings.colWidths).toBeUndefined();
      expect(settings.readOnly).toBe(false);
    });

    it('should keep `rowHeights` and `colWidths` when the value changed', () => {
      const prevProps: HotTableProps = {
        rowHeights: [50, 50, 50],
        colWidths: 100,
      };
      const nextProps: HotTableProps = {
        rowHeights: [150, 150, 150],
        colWidths: 120,
      };

      const settings = SettingsMapper.getSettings(nextProps, { prevProps, isInit: false });

      expect(settings.rowHeights).toEqual([150, 150, 150]);
      expect(settings.colWidths).toBe(120);
    });

    it('should compare `rowHeights` against the live grid settings, not the previous props', () => {
      // Angular and Vue already diff against the grid. Comparing props alone would stop re-asserting
      // the prop after something changed the size through the instance ref.
      const props: HotTableProps = { rowHeights: 50 };

      // The grid was moved to 100 imperatively, so the unchanged prop still has to be forwarded.
      const settings = SettingsMapper.getSettings(props, {
        prevProps: props,
        isInit: false,
        currentSettings: { rowHeights: 100 },
      });

      expect(settings.rowHeights).toBe(50);
    });

    it('should skip `rowHeights` when the live grid settings already match', () => {
      const props: HotTableProps = { rowHeights: 50 };

      const settings = SettingsMapper.getSettings(props, {
        prevProps: props,
        isInit: false,
        currentSettings: { rowHeights: 50 },
      });

      expect(settings.rowHeights).toBeUndefined();
    });

    it('should skip a setting equal by content to the value it passed last, and pass a changed one', () => {
      const forwardedSettings = new Map();
      const props: HotTableProps = { columnSorting: { indicator: true }, pagination: { pageSize: 5 }, readOnly: false };

      SettingsMapper.getSettings(props, { isInit: true, forwardedSettings });

      const unchanged: HotTableProps = {
        columnSorting: { indicator: true },
        pagination: { pageSize: 5 },
        readOnly: false,
      };

      expect(SettingsMapper.getSettings(unchanged, { prevProps: props, isInit: false, forwardedSettings })).toEqual({});

      const changed: HotTableProps = {
        columnSorting: { indicator: false },
        pagination: { pageSize: 5 },
        readOnly: true,
      };

      expect(SettingsMapper.getSettings(changed, { prevProps: unchanged, isInit: false, forwardedSettings }))
        .toEqual({ columnSorting: { indicator: false }, readOnly: true });
    });

    it('should pass a setting the app changed in place, though the grid holds the same object', () => {
      const forwardedSettings = new Map();
      const mergeCells = [{ row: 0, col: 0, rowspan: 2, colspan: 2 }];
      const props: HotTableProps = { mergeCells };

      SettingsMapper.getSettings(props, { isInit: true, forwardedSettings });
      mergeCells.push({ row: 2, col: 2, rowspan: 2, colspan: 2 });

      const settings = SettingsMapper.getSettings(props, {
        prevProps: props,
        isInit: false,
        currentSettings: { mergeCells },
        forwardedSettings,
      });

      expect(settings.mergeCells).toBe(mergeCells);
    });

    it('should forward a function setting that is a new function, and skip the same one', () => {
      const forwardedSettings = new Map();
      const cells = () => ({});

      SettingsMapper.getSettings({ cells }, { isInit: true, forwardedSettings });

      expect(SettingsMapper.getSettings({ cells }, { isInit: false, forwardedSettings })).toEqual({});

      const nextCells = () => ({});

      expect(SettingsMapper.getSettings({ cells: nextCells }, { isInit: false, forwardedSettings }))
        .toEqual({ cells: nextCells });
    });

    it('should always forward `data`, even when it passed the same array last time', () => {
      const forwardedSettings = new Map();
      const data = [{ id: 1 }];

      SettingsMapper.getSettings({ data }, { isInit: true, forwardedSettings });

      expect(SettingsMapper.getSettings({ data }, { isInit: false, forwardedSettings }).data).toBe(data);
    });

    it('should compare `sheetsBar` by reference, so a new value with the same content is passed', () => {
      const forwardedSettings = new Map();
      const sheetsBar = { sheets: [{ name: 'Sheet1', data: [[1]] }] };

      SettingsMapper.getSettings({ sheetsBar }, { isInit: true, forwardedSettings });

      expect(SettingsMapper.getSettings({ sheetsBar }, { isInit: false, forwardedSettings })).toEqual({});

      const nextSheetsBar = { sheets: [{ name: 'Sheet1', data: [[1]] }] };

      expect(SettingsMapper.getSettings({ sheetsBar: nextSheetsBar }, { isInit: false, forwardedSettings }).sheetsBar)
        .toBe(nextSheetsBar);
    });

    it('should compare a value with a cycle without overflowing the stack', () => {
      const forwardedSettings = new Map();
      const makeTree = () => {
        const parent: Record<string, unknown> = { id: 1 };
        const child: Record<string, unknown> = { id: 2, parent };

        parent.__children = [child];

        return { rows: [parent] };
      };

      SettingsMapper.getSettings({ treeOption: makeTree() }, { isInit: true, forwardedSettings });

      expect(SettingsMapper.getSettings({ treeOption: makeTree() }, { isInit: false, forwardedSettings }))
        .toEqual({});
    });

    it('should keep `rowHeights` and `colWidths` when initializing', () => {
      const props: HotTableProps = {
        rowHeights: [50, 50, 50],
        colWidths: 100,
      };

      const settings = SettingsMapper.getSettings(props, { prevProps: props, isInit: true });

      expect(settings.rowHeights).toEqual([50, 50, 50]);
      expect(settings.colWidths).toBe(100);
    });

    it('should keep `dataSchema` in updated settings when the schema changes', () => {
      const prevProps: HotTableProps = {
        dataSchema: {
          quantity: 0,
        },
      };
      const nextProps: HotTableProps = {
        dataSchema: {
          quantity: 1,
        },
      };

      const result = SettingsMapper.getSettings(nextProps, {
        prevProps,
        isInit: false,
      });

      expect(result.dataSchema).toEqual({
        quantity: 1,
      });
    });

    it('should keep `columns` in updated settings when a RegExp validator changes', () => {
      const prevProps: HotTableProps = {
        columns: [
          {
            data: 'quantity',
            validator: /^\d+$/,
          }
        ],
      };
      const nextProps: HotTableProps = {
        columns: [
          {
            data: 'quantity',
            validator: /^[a-z]+$/,
          }
        ],
      };

      const result = SettingsMapper.getSettings(nextProps, {
        prevProps,
        isInit: false,
      });

      expect(result.columns).toEqual(nextProps.columns);
    });

    it('should keep `dataSchema` in updated settings when a Date value changes', () => {
      const prevProps: HotTableProps = {
        dataSchema: {
          createdAt: new Date(0),
        },
      };
      const nextProps: HotTableProps = {
        dataSchema: {
          createdAt: new Date(99999),
        },
      };

      const result = SettingsMapper.getSettings(nextProps, {
        prevProps,
        isInit: false,
      });

      expect(result.dataSchema).toEqual(nextProps.dataSchema);
    });

    it('should keep `columns` in updated settings when a Set value changes', () => {
      const prevProps: HotTableProps = {
        columns: [
          {
            data: 'type',
            source: new Set(['A']),
          },
        ],
      };
      const nextProps: HotTableProps = {
        columns: [
          {
            data: 'type',
            source: new Set(['B']),
          },
        ],
      };

      const result = SettingsMapper.getSettings(nextProps, {
        prevProps,
        isInit: false,
      });

      expect(result.columns).toEqual(nextProps.columns);
    });

    it('should always skip init-only settings when not initializing, even if the value changed', () => {
      const prevProps: HotTableProps = {
        renderAllRows: false,
        renderAllColumns: false,
        layoutDirection: 'ltr',
        ariaTags: true,
        width: 300,
      };
      const nextProps: HotTableProps = {
        renderAllRows: true,
        renderAllColumns: true,
        layoutDirection: 'rtl',
        ariaTags: false,
        width: 500,
      };

      const result = SettingsMapper.getSettings(nextProps, {
        prevProps,
        isInit: false,
        initOnlySettingKeys: ['renderAllRows', 'renderAllColumns', 'layoutDirection', 'ariaTags'] as any,
      });

      expect(result.renderAllRows).toBe(undefined);
      expect(result.renderAllColumns).toBe(undefined);
      expect(result.layoutDirection).toBe(undefined);
      expect(result.ariaTags).toBe(undefined);
      expect(result.width).toBe(500);
    });

    it('should skip props whose value is `undefined`, but keep `null` and `false`', () => {
      const props: HotTableProps = {
        copyPaste: undefined,
        fillHandle: null as any,
        undo: false,
        width: 300,
      };

      [{ isInit: true }, { isInit: false, prevProps: {} }].forEach((options) => {
        const result = SettingsMapper.getSettings(props, options);

        expect(Object.keys(result)).toEqual(['fillHandle', 'undo', 'width']);
        expect(result.fillHandle).toBe(null);
        expect(result.undo).toBe(false);
      });
    });

    it('should forward the option default on update only for a prop that had a value before', () => {
      const result = SettingsMapper.getSettings(
        { colWidths: undefined, copyPaste: undefined, undo: undefined },
        { isInit: false, prevProps: { colWidths: [50, 60], copyPaste: false } }
      );

      expect(Object.keys(result)).toEqual(['colWidths', 'copyPaste']);
      expect(result.colWidths).toBe(undefined);
      expect(result.copyPaste).toBe(true);
    });

    it('should forward `null` on update for `height` and `width` props that had a value before', () => {
      const result = SettingsMapper.getSettings(
        { height: undefined, width: undefined, colWidths: undefined },
        { isInit: false, prevProps: { height: 300, width: 500, colWidths: [50, 60] } }
      );
      const notPassedBefore = SettingsMapper.getSettings(
        { height: undefined, width: undefined },
        { isInit: false, prevProps: {} }
      );

      expect(Object.keys(notPassedBefore)).toEqual([]);
      expect(Object.keys(result)).toEqual(['height', 'width', 'colWidths']);
      expect(result.height).toBe(null);
      expect(result.width).toBe(null);
      expect(result.colWidths).toBe(undefined);
    });

    it('should forward `null` on update for a hook prop that had a callback before', () => {
      const afterChange = () => {};
      const beforeChange = () => {};
      const result = SettingsMapper.getSettings(
        { afterChange: undefined, beforeChange: undefined, afterSelection: undefined },
        { isInit: false, prevProps: { afterChange, beforeChange: [beforeChange] } }
      );

      expect(Object.keys(result)).toEqual(['afterChange', 'beforeChange']);
      expect(result.afterChange).toBe(null);
      expect(result.beforeChange).toBe(null);
    });

    it('should forward `null` on update for a hook prop that is no longer passed', () => {
      const result = SettingsMapper.getSettings(
        { width: 300 },
        { isInit: false, prevProps: { width: 300, height: 200, afterChange: () => {}, afterSelection: undefined } }
      );

      expect(Object.keys(result)).toEqual(['width', 'afterChange']);
      expect(result.afterChange).toBe(null);
    });

    it('should forward `null` on update for a hook prop that holds no callback', () => {
      const afterChange = jest.fn();
      const result = SettingsMapper.getSettings(
        { afterChange: false as any, beforeChange: [afterChange], copyPaste: false },
        { isInit: false, prevProps: { afterChange, beforeChange: [afterChange], copyPaste: true } }
      );

      expect(result.afterChange).toBe(null);
      expect(result.beforeChange).toEqual([afterChange]);
      expect(result.copyPaste).toBe(false);
    });

    it('should not forward a hook prop that is `undefined` during initialization', () => {
      const result = SettingsMapper.getSettings(
        { afterChange: undefined },
        { isInit: true, prevProps: { afterChange: () => {} } }
      );

      expect(Object.keys(result)).toEqual([]);
    });

    it('should not forward `undefined` during initialization even when previous props are given', () => {
      const result = SettingsMapper.getSettings(
        { height: undefined },
        { isInit: true, prevProps: { height: 300 } }
      );

      expect(Object.keys(result)).toEqual([]);
    });

    it('should include init-only settings during initialization', () => {
      const nextProps: HotTableProps = {
        renderAllRows: true,
        width: 300,
      };

      const result = SettingsMapper.getSettings(nextProps, {
        isInit: true,
        initOnlySettingKeys: ['renderAllRows'] as any,
      });

      expect(result.renderAllRows).toBe(true);
      expect(result.width).toBe(300);
    });
  });
});
