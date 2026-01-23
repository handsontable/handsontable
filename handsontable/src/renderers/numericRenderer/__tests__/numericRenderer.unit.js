import numbro from 'numbro';
import deDE from 'numbro/languages/de-DE';
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
      }).toThrowError();
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, numericRenderer);

      expect(getRegisteredRendererNames()).toEqual(['text', RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    function getInstance() {
      return new Core(document.createElement('div'), {});
    }

    describe('formatting', () => {
      it('should format value with numericFormat (numbro.js format)', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          rawValue: 1.002,
          numericFormat: {
            culture: 'de-DE',
            pattern: {
              mantissa: 2,
              output: 'currency',
            }
          }
        };

        numbro.registerLanguage(deDE);

        const formattedValue = numericRenderer.valueFormatter(cellMeta.rawValue, cellMeta);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1,00€</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htRight htNumeric');
      });

      it('should format value with numericFormat (Intl.NumberFormat format)', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          rawValue: 1.002,
          locale: 'de-DE',
          numericFormat: {
            style: 'currency',
            currency: 'EUR',
          }
        };
        const formattedValue = numericRenderer.valueFormatter(cellMeta.rawValue, cellMeta);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1,00&nbsp;€</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htRight htNumeric');
      });
    });

    describe('class names management', () => {
      it('should add default class names for numeric values', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          rawValue: 1,
        };
        const formattedValue = numericRenderer.valueFormatter(cellMeta.rawValue, cellMeta);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htRight htNumeric');
      });

      it('should add default class names for numeric values passed as a string', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          rawValue: 100,
        };
        const formattedValue = numericRenderer.valueFormatter(cellMeta.rawValue, cellMeta);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">100</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htRight htNumeric');
      });

      it('should add default class names only if value is numeric', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          rawValue: 'A',
        };
        const formattedValue = numericRenderer.valueFormatter(cellMeta.rawValue, cellMeta);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td>A</td>');
        expect(cellMeta.className).toBe(undefined);
      });

      it('should add only htNumeric class name if any alignment was defined', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          instance,
          rawValue: 1,
          className: 'htCenter'
        };
        const formattedValue = numericRenderer.valueFormatter(cellMeta.rawValue, cellMeta);

        numericRenderer(instance, TD, undefined, undefined, undefined, formattedValue, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1</td>', toMatchHTMLConfig);
        expect(cellMeta.className).toBe('htCenter htNumeric');
      });
    });
  });
});
