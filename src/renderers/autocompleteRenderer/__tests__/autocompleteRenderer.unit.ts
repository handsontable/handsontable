import Core from 'handsontable/core';
import {
  RENDERER_TYPE,
  autocompleteRenderer,
} from '..';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from '../../registry';

describe('autocompleteRenderer', () => {
  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowError();
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, autocompleteRenderer);

      expect(getRegisteredRendererNames()).toEqual([RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    function getInstance() {
      return new Core(document.createElement('div'), {});
    }

    it('should render basic template if no value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      autocompleteRenderer(instance, TD, void 0, void 0, void 0, void 0, cellMeta);

      expect(TD.outerHTML).toBe('<td class="htAutocomplete"><div class="htAutocompleteArrow">▼</div></td>');
    });
  });
});
