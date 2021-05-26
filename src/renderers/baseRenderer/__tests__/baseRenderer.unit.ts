import {
  RENDERER_TYPE,
  baseRenderer,
} from '../';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from '../../registry';

describe('baseRenderer', () => {
  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowError();
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, baseRenderer);

      expect(getRegisteredRendererNames()).toEqual([RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    it('should add className', () => {
      const TD = document.createElement('td');

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', {
        className: 'custom',
      });

      expect(TD.outerHTML).toBe('<td class="custom"></td>');
    });

    it('should manage readOnly class name', () => {
      const TD = document.createElement('td');

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', {
        readOnly: true,
        readOnlyCellClassName: 'read-only',
      });

      expect(TD.outerHTML).toBe('<td class="read-only"></td>');
    });

    it('should manage validation class name', () => {
      const TD = document.createElement('td');
      const cellMeta = {
        valid: false,
        invalidCellClassName: 'invalid',
      };

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', cellMeta);

      expect(TD.outerHTML).toBe('<td class="invalid"></td>');

      cellMeta.valid = true;

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', cellMeta);

      expect(TD.outerHTML).toBe('<td class=""></td>');
    });

    it('should manage wordWrap class name', () => {
      const TD = document.createElement('td');

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', {
        wordWrap: false,
        noWordWrapClassName: 'no-word-wrap',
      });

      expect(TD.outerHTML).toBe('<td class="no-word-wrap"></td>');
    });

    it('should manage placeholder class name', () => {
      const TD = document.createElement('td');

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', {
        placeholder: 'Placeholder',
        placeholderCellClassName: 'placeholder'
      });

      expect(TD.outerHTML).toBe('<td class="placeholder"></td>');
    });
  });

});
