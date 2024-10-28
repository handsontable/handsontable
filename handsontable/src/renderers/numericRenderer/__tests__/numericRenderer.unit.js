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
      it('should format value with numericFormat', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          numericFormat: {
            culture: 'de-DE',
            pattern: {
              mantissa: 2,
              output: 'currency',
            }
          }
        };

        numbro.registerLanguage(deDE);

        numericRenderer(instance, TD, undefined, undefined, undefined, 1.002, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr" class="htRight htNumeric">1,00€</td>', toMatchHTMLConfig);
      });
    });

    describe('class names management', () => {
      it('should add default class names for numeric values', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {};

        numericRenderer(instance, TD, undefined, undefined, undefined, 1, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr" class="htRight htNumeric">1</td>', toMatchHTMLConfig);
      });

      it('should add default class names for numeric values passed as a string', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {};

        numericRenderer(instance, TD, undefined, undefined, undefined, '100', cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr" class="htRight htNumeric">100</td>', toMatchHTMLConfig);
      });

      it('should add default class names only if value is numeric', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {};

        numericRenderer(instance, TD, undefined, undefined, undefined, 'A', cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td>A</td>');
      });

      it('should add only htNumeric class name if any alignment was defined', () => {
        const TD = document.createElement('td');
        const instance = getInstance();
        const cellMeta = {
          className: 'htCenter'
        };

        numericRenderer(instance, TD, undefined, undefined, undefined, 1, cellMeta);

        expect(TD.outerHTML).toMatchHTML('<td dir="ltr" class="htCenter htNumeric">1</td>', toMatchHTMLConfig);
      });
    });
  });
});
