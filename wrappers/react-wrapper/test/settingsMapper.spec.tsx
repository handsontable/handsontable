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
  });
});
