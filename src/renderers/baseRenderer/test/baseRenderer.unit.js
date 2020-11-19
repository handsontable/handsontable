import {
  getRegisteredRendererNames,
  getRenderer,
} from '../../renderers';
import baseRenderer from '../index';

describe('baseRenderer', () => {
  describe('registering', () => {
    it('should auto-register renderer after import', () => {
      expect(getRegisteredRendererNames()).toEqual(['base']);
      expect(getRenderer('base')).toBeInstanceOf(Function);
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
