import {
  RENDERER_TYPE,
  htmlRenderer,
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

describe('htmlRenderer', () => {
  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual(['text']);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowError();
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, htmlRenderer);

      expect(getRegisteredRendererNames()).toEqual(['text', RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    it('should left an empty element if value is null', () => {
      const TD = document.createElement('td');
      const value = null;

      htmlRenderer(undefined, TD, undefined, undefined, undefined, value, {});

      expect(TD.outerHTML).toMatchHTML('<td></td>');
    });

    it('should left an empty element if value is undefined', () => {
      const TD = document.createElement('td');
      const value = undefined;

      htmlRenderer(undefined, TD, undefined, undefined, undefined, value, {});

      expect(TD.outerHTML).toMatchHTML('<td></td>');
    });

    it('should insert HTML value', () => {
      const TD = document.createElement('td');
      const value = '<p><span>HTML value</span></p>';

      htmlRenderer(undefined, TD, undefined, undefined, undefined, value, {});

      expect(TD.outerHTML).toMatchHTML('<td><p><span>HTML value</span></p></td>');
    });
  });
});
