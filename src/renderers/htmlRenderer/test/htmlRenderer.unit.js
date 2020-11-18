import {
  getRegisteredRendererNames,
  getRenderer,
} from '../../index';
import htmlRenderer from '../index';

describe('textRenderer', () => {
  describe('registering', () => {
    it('should auto-register renderer after import', () => {
      expect(getRegisteredRendererNames()).toEqual(['base', 'html']);
      expect(getRenderer('html')).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    it('should left an empty element if value is null', () => {
      const TD = document.createElement('td');
      const value = null;

      htmlRenderer(void 0, TD, void 0, void 0, void 0, value, {});

      expect(TD.outerHTML).toBe('<td></td>');
    });

    it('should left an empty element if value is undefined', () => {
      const TD = document.createElement('td');
      const value = void 0;

      htmlRenderer(void 0, TD, void 0, void 0, void 0, value, {});

      expect(TD.outerHTML).toBe('<td></td>');
    });

    it('should insert HTML value', () => {
      const TD = document.createElement('td');
      const value = '<p><span>HTML value</span></p>';

      htmlRenderer(void 0, TD, void 0, void 0, void 0, value, {});

      expect(TD.outerHTML).toBe('<td><p><span>HTML value</span></p></td>');
    });
  });
});
