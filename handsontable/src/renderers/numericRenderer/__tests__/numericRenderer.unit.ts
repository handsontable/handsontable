import Core from 'handsontable/core';
import {
  RENDERER_TYPE,
  numericRenderer,
} from '../';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from '../../registry';
import {
  registerCellType,
  TextCellType,
} from '../../../cellTypes';

registerCellType(TextCellType);

describe('numericRenderer', () => {
  const toMatchHTMLConfig = ['dir', 'class'];

  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual(['text']);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowWithCause(undefined, { handsontable: true });
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, numericRenderer);

      expect(getRegisteredRendererNames()).toEqual(['text', RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    /**
     *
     */
    function getInstance() {
      return new Core(document.createElement('div'), {});
    }

    describe('formatting', () => {
      it('should format value with numericFormat (Intl.NumberFormat format)', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          locale: 'de-DE',
          numericFormat: {
            style: 'currency',
            currency: 'EUR',
          }
        };
        const cellValue = 1.002;
        const formattedValue = numericRenderer.valueFormatter(cellValue, cellMeta);

        spyOn(instance, 'getDataAtCell').and.returnValue(cellValue);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1,00&nbsp;€</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htRight htNumeric');
      });

      it('should format integers near Number.MAX_SAFE_INTEGER without losing a digit', () => {
        const instance = getInstance();
        const cellMeta = {
          instance,
          locale: 'en-US',
          numericFormat: {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        };

        // `9007199254740990` is exactly representable as a double, so formatting must not shift
        // it to `...989`. The removed numbro dependency did, because it rounded through
        // `value * 100`, which overflows the safe-integer range.
        expect(numericRenderer.valueFormatter(9007199254740988, cellMeta)).toBe('9,007,199,254,740,988.00');
        expect(numericRenderer.valueFormatter(9007199254740989, cellMeta)).toBe('9,007,199,254,740,989.00');
        expect(numericRenderer.valueFormatter(9007199254740990, cellMeta)).toBe('9,007,199,254,740,990.00');
        expect(numericRenderer.valueFormatter(9007199254740991, cellMeta)).toBe('9,007,199,254,740,991.00');
      });

      it('should format a numeric string literal above Number.MAX_SAFE_INTEGER exactly', () => {
        const instance = getInstance();
        const cellMeta = {
          instance,
          locale: 'en-US',
          numericFormat: {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        };

        // `Intl.NumberFormat#format` reads a string operand as an exact decimal and never routes
        // it through a double, so a literal kept by `preserveNumericLiteral` renders every digit.
        // The same value as a number collapses to `...992` - hence `Number()` here rather than a
        // literal, which `no-loss-of-precision` rejects.
        const literal = '9007199254740993';

        expect(numericRenderer.valueFormatter(literal, cellMeta)).toBe('9,007,199,254,740,993.00');
        expect(numericRenderer.valueFormatter(Number(literal), cellMeta)).toBe('9,007,199,254,740,992.00');
      });

      it('should emit an unsupported-format warning once per instance when numericFormat.pattern is present', () => {
        /* eslint-disable no-console */
        /* eslint-disable no-restricted-globals */
        const originalWarn = console.warn;

        console.warn = jasmine.createSpy('warn');

        try {
          const instance = getInstance();
          const TD1 = document.createElement('td');
          const cellMeta = {
            instance,
            numericFormat: { pattern: '$0,0.00' }
          };

          spyOn(instance, 'getDataAtCell').and.returnValue(1000);

          numericRenderer(instance, TD1, 0, 0, 0, 1000, cellMeta);

          expect(console.warn).toHaveBeenCalledTimes(1);
          expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(
            'numericFormat.pattern and numericFormat.culture options are not supported'
          ));

          // Second call with the same instance — should NOT warn again
          const TD2 = document.createElement('td');

          numericRenderer(instance, TD2, 0, 0, 0, 1000, cellMeta);

          expect(console.warn).toHaveBeenCalledTimes(1);
        } finally {
          console.warn = originalWarn;
        }
        /* eslint-enable no-restricted-globals */
        /* eslint-enable no-console */
      });

      it('should emit an unsupported-format warning when numericFormat.culture is present', () => {
        /* eslint-disable no-console */
        /* eslint-disable no-restricted-globals */
        const originalWarn = console.warn;

        console.warn = jasmine.createSpy('warn');

        try {
          const instance = getInstance();
          const TD = document.createElement('td');
          const cellMeta = {
            instance,
            numericFormat: { culture: 'de-DE' }
          };

          spyOn(instance, 'getDataAtCell').and.returnValue(1000);

          numericRenderer(instance, TD, 0, 0, 0, 1000, cellMeta);

          expect(console.warn).toHaveBeenCalledTimes(1);
        } finally {
          console.warn = originalWarn;
        }
        /* eslint-enable no-restricted-globals */
        /* eslint-enable no-console */
      });

      it('should not emit an unsupported-format warning when only Intl.NumberFormat options are present', () => {
        /* eslint-disable no-console */
        /* eslint-disable no-restricted-globals */
        const originalWarn = console.warn;

        console.warn = jasmine.createSpy('warn');

        try {
          const instance = getInstance();
          const TD = document.createElement('td');
          const cellMeta = {
            instance,
            locale: 'en-US',
            numericFormat: { style: 'currency', currency: 'USD' }
          };

          spyOn(instance, 'getDataAtCell').and.returnValue(1000);

          numericRenderer(instance, TD, 0, 0, 0, 1000, cellMeta);

          expect(console.warn).not.toHaveBeenCalled();
        } finally {
          console.warn = originalWarn;
        }
        /* eslint-enable no-restricted-globals */
        /* eslint-enable no-console */
      });
    });

    describe('class names management', () => {
      it('should add default class names for numeric values', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
        };
        const cellValue = 1;
        const formattedValue = numericRenderer.valueFormatter(cellValue, cellMeta);

        spyOn(instance, 'getDataAtCell').and.returnValue(cellValue);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htRight htNumeric');
      });

      it('should add default class names for numeric values passed as a string', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
        };
        const cellValue = 100;
        const formattedValue = numericRenderer.valueFormatter(cellValue, cellMeta);

        spyOn(instance, 'getDataAtCell').and.returnValue(cellValue);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">100</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htRight htNumeric');
      });

      it('should add default class names only if value is numeric', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
        };
        const cellValue = 'A';
        const formattedValue = numericRenderer.valueFormatter(cellValue, cellMeta);

        spyOn(instance, 'getDataAtCell').and.returnValue(cellValue);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td>A</td>');
        expect(cellMeta.className).toBe(undefined);
      });

      it('should add default class names when `className` is an array', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          className: ['foo', 'bar'],
        };
        const cellValue = 1;
        const formattedValue = numericRenderer.valueFormatter(cellValue, cellMeta);

        spyOn(instance, 'getDataAtCell').and.returnValue(cellValue);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('foo bar htRight htNumeric');
      });

      it('should not mutate an array `className` inherited through the cell meta prototype chain', () => {
        const instance = getInstance();
        // A grid-level or column-level `className` array is one instance that every cell meta reads
        // through its prototype (`dataMap/metaManager/metaLayers/cellMeta.ts`). Pushing into the value
        // the renderer was handed leaks the numeric classes onto every cell sharing that array.
        const sharedClassName = ['foo', 'bar'];
        const higherLayerMeta = {
          instance,
          className: sharedClassName,
        };
        const numericCellMeta = Object.create(higherLayerMeta);
        const siblingCellMeta = Object.create(higherLayerMeta);

        spyOn(instance, 'getDataAtCell').and.returnValue(1);

        numericRenderer(
          instance, document.createElement('td'), 0, 0, undefined,
          numericRenderer.valueFormatter(1, numericCellMeta), numericCellMeta
        );

        expect(numericCellMeta.className).toBe('foo bar htRight htNumeric');
        expect(sharedClassName).toEqual(['foo', 'bar']);
        expect(siblingCellMeta.className).toBe(sharedClassName);
      });

      it('should add only htNumeric class name if any alignment was defined', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          className: 'htCenter'
        };
        const cellValue = 1;
        const formattedValue = numericRenderer.valueFormatter(cellValue, cellMeta);

        spyOn(instance, 'getDataAtCell').and.returnValue(cellValue);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htCenter htNumeric');
      });
    });
  });
});
