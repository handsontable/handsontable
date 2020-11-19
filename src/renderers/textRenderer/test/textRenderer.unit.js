import Core from 'handsontable/core';
import {
  getRegisteredRendererNames,
  getRenderer,
} from '../../renderers';
import textRenderer from '../index';

describe('textRenderer', () => {
  describe('registering', () => {
    it('should auto-register renderer after import', () => {
      expect(getRegisteredRendererNames()).toEqual(['base', 'text']);
      expect(getRenderer('text')).toBeInstanceOf(Function);
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

      textRenderer(instance, TD, void 0, void 0, void 0, '', cellMeta);

      expect(TD.outerHTML).toBe('<td>Placeholder</td>');
    });

    it('should replace white spaces with nbsp entity', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        trimWhitespace: false,
        wordWrap: false,
      });
      const cellMeta = {};

      textRenderer(instance, TD, void 0, void 0, void 0, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toBe('<td>Long&nbsp;&nbsp;&nbsp;text&nbsp;</td>');
    });

    it('should left whitespaces if trimWhitespace is set as true', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        trimWhitespace: true,
      });
      const cellMeta = {};

      textRenderer(instance, TD, void 0, void 0, void 0, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toBe('<td>Long   text </td>');
    });

    it('should left whitespaces if wordWrap is set as true', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        wordWrap: true,
      });
      const cellMeta = {};

      textRenderer(instance, TD, void 0, void 0, void 0, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toBe('<td>Long   text </td>');
    });

    it('should insert stringified value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const value = [1, 2, 3];
      const cellMeta = {};

      textRenderer(instance, TD, void 0, void 0, void 0, value, cellMeta);

      expect(TD.outerHTML).toBe('<td>1,2,3</td>');
    });
  });
});
