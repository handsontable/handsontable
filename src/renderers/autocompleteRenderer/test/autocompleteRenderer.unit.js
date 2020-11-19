import Core from 'handsontable/core';
import {
  getRegisteredRendererNames,
  getRenderer,
} from '../../index';
import autocompleteRenderer from '../index';

describe('autocompleteRenderer', () => {
  describe('registering', () => {
    it('should auto-register renderer after import', () => {
      expect(getRegisteredRendererNames()).toEqual(['base', 'text', 'html', 'autocomplete']);
      expect(getRenderer('autocomplete')).toBeInstanceOf(Function);
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
