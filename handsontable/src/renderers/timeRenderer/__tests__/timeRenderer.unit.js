import Core from 'handsontable/core';
import {
  RENDERER_TYPE,
  timeRenderer,
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

describe('timeRenderer', () => {
  const toMatchHTMLConfig = ['dir'];

  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual(['text']);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowError();
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, timeRenderer);

      expect(getRegisteredRendererNames()).toEqual(['text', RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    function getInstance(config = {}) {
      return new Core(document.createElement('div'), config);
    }

    it('should insert placeholder if there is no value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {
        placeholder: 'Placeholder'
      };

      timeRenderer(instance, TD, undefined, undefined, undefined, '', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td dir="ltr">Placeholder</td>', toMatchHTMLConfig);
    });

    it('should replace white spaces with nbsp entity', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        trimWhitespace: false,
        wordWrap: false,
      });
      const cellMeta = {};

      timeRenderer(instance, TD, undefined, undefined, undefined, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td dir="ltr">Long   text </td>', toMatchHTMLConfig);
    });

    it('should trim whitespaces if trimWhitespace is set as true', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        trimWhitespace: false,
      });
      const cellMeta = { trimWhitespace: true }; // cell meta layer has priority

      timeRenderer(instance, TD, undefined, undefined, undefined, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td dir="ltr">Long   text</td>', toMatchHTMLConfig);
    });

    it('should trim whitespaces if wordWrap is set as true and trimWhitespace is set as true', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        wordWrap: true,
        trimWhitespace: false
      });
      const cellMeta = { trimWhitespace: true }; // cell meta layer has priority

      timeRenderer(instance, TD, undefined, undefined, undefined, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td dir="ltr">Long   text</td>', toMatchHTMLConfig);
    });

    it('should insert stringified value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const value = [1, 2, 3];
      const cellMeta = {};

      timeRenderer(instance, TD, undefined, undefined, undefined, value, cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td dir="ltr">1,2,3</td>', toMatchHTMLConfig);
    });

    it('should apply "dir" attribute as "ltr" to the TD element', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const value = [1, 2, 3];
      const cellMeta = {};

      timeRenderer(instance, TD, undefined, undefined, undefined, value, cellMeta);

      expect(TD.dir).toBe('ltr');
    });
  });
});
