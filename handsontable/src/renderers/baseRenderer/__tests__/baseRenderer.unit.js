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
  const toMatchHTMLConfig = ['class'];

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

      expect(TD.outerHTML).toMatchHTML('<td class="custom"></td>', toMatchHTMLConfig);
    });

    it('should manage readOnly class name', () => {
      const TD = document.createElement('td');

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', {
        readOnly: true,
        readOnlyCellClassName: 'read-only',
      });

      expect(TD.outerHTML).toMatchHTML('<td class="read-only"></td>', toMatchHTMLConfig);
    });

    it('should manage validation class name', () => {
      const TD = document.createElement('td');
      const cellMeta = {
        valid: false,
        invalidCellClassName: 'invalid',
      };

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td class="invalid"></td>', toMatchHTMLConfig);

      cellMeta.valid = true;

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td class=""></td>', toMatchHTMLConfig);
    });

    it('should manage wordWrap class name', () => {
      const TD = document.createElement('td');

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', {
        wordWrap: false,
        noWordWrapClassName: 'no-word-wrap',
      });

      expect(TD.outerHTML).toMatchHTML('<td class="no-word-wrap"></td>', toMatchHTMLConfig);
    });

    it('should manage placeholder class name', () => {
      const TD = document.createElement('td');

      baseRenderer(void 0, TD, void 0, void 0, void 0, '', {
        placeholder: 'Placeholder',
        placeholderCellClassName: 'placeholder'
      });

      expect(TD.outerHTML).toMatchHTML('<td class="placeholder"></td>', toMatchHTMLConfig);
    });
  });

});
