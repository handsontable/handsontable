import Core from 'handsontable/core';
import {
  getRegisteredRendererNames,
  getRenderer,
} from '../../renderers';
import passwordRenderer from '../index';

describe('passwordRenderer', () => {
  describe('registering', () => {
    it('should auto-register renderer after import', () => {
      expect(getRegisteredRendererNames()).toEqual(['base', 'text', 'password']);
      expect(getRenderer('password')).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    function getInstance() {
      return new Core(document.createElement('div'), {});
    }

    it('should render asterisks instead of value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      passwordRenderer(instance, TD, void 0, void 0, void 0, 'password', cellMeta);

      expect(TD.outerHTML).toBe('<td>********</td>');
    });

    it('should render custom symbols instead of value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {
        hashSymbol: '!'
      };

      passwordRenderer(instance, TD, void 0, void 0, void 0, 'password', cellMeta);

      expect(TD.outerHTML).toBe('<td>!!!!!!!!</td>');
    });

    it('should render hashed value on the defined length', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {
        hashLength: 10
      };

      passwordRenderer(instance, TD, void 0, void 0, void 0, 'password', cellMeta);

      expect(TD.outerHTML).toBe('<td>**********</td>');
    });
  });
});
