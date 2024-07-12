import Core from 'handsontable/core';
import {
  RENDERER_TYPE,
  passwordRenderer,
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

describe('passwordRenderer', () => {
  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual(['text']);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowError();
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, passwordRenderer);

      expect(getRegisteredRendererNames()).toEqual(['text', RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
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

      passwordRenderer(instance, TD, undefined, undefined, undefined, 'password', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>********</td>');
    });

    it('should render custom symbols instead of value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {
        hashSymbol: '!'
      };

      passwordRenderer(instance, TD, undefined, undefined, undefined, 'password', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>!!!!!!!!</td>');
    });

    it('should render hashed value on the defined length', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {
        hashLength: 10
      };

      passwordRenderer(instance, TD, undefined, undefined, undefined, 'password', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>**********</td>');
    });
  });
});
