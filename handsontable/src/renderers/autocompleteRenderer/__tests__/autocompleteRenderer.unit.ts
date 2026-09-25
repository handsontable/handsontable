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
import {
  registerCellType,
  TextCellType,
} from '../../../cellTypes';

registerCellType(TextCellType);

describe('autocompleteRenderer', () => {
  const toMatchHTMLConfig = ['class'];

  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual(['text']);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowWithCause(undefined, { handsontable: true });
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, autocompleteRenderer);

      expect(getRegisteredRendererNames()).toEqual(['text', RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    /**
     *
     */
    function getInstance() {
      return new Core(document.createElement('div'), {});
    }

    it('should render basic template if no value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      autocompleteRenderer(instance, TD, undefined, undefined, undefined, undefined, cellMeta);

      // DEV-3003: the arrow glyph is now a real `<i class="ht-icon ht-icon-select-arrow">`
      // sibling of the text-glyph fallback, not a CSS pseudo-element.
      expect(TD.outerHTML).toMatchHTML(
        '<td class="htAutocomplete"><div class="htAutocompleteArrow">▼' +
        '<i class="ht-icon ht-icon-select-arrow"></i></div></td>',
        toMatchHTMLConfig
      );
    });
  });
});
