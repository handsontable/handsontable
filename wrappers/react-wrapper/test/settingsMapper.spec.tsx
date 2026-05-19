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
          { label: { value: 'first label' }},
          { label: { value: 'second label' }}
        ],
        afterChange: () => {
          return 'works!';
        },
        afterRender: () => {
          return 'also works!';
        }
      };
      const result = SettingsMapper.getSettings(initial);

      expect(!!result.width && !!result.height && !!result.contextMenu && !!result.columns && !!result.afterChange && !!result.afterRender).toEqual(true);
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

      expect(result.dataSchema).toBe(void 0);
      expect(result.columns).toBe(void 0);
      expect(result.readOnly).toBe(false);
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

      expect(result.renderAllRows).toBe(void 0);
      expect(result.renderAllColumns).toBe(void 0);
      expect(result.layoutDirection).toBe(void 0);
      expect(result.ariaTags).toBe(void 0);
      expect(result.width).toBe(500);
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
