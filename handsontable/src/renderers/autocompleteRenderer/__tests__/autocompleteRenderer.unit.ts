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

      // The arrow glyph is now a real `<i class="ht-icon ht-icon-select-arrow">`
      // sibling of the text-glyph fallback, not a CSS pseudo-element.
      expect(TD.outerHTML).toMatchHTML(
        '<td class="htAutocomplete"><div class="htAutocompleteArrow">▼' +
        '<i class="ht-icon ht-icon-select-arrow"></i></div></td>',
        toMatchHTMLConfig
      );
    });

    describe('a press on the arrow', () => {
      /**
       * Renders a cell into a grid whose `onCellDblClick` setting is recorded.
       *
       * @returns {{ arrow: HTMLElement, getSetting: jest.Mock, instance: Core }}
       */
      function renderIntoGrid() {
        const instance = getInstance();
        const getSetting = jest.fn();
        const TD = document.createElement('td');

        // A grid that was never initialized has no view; the listener reads only these two members.
        Object.assign(instance, {
          view: { _wt: { getSetting } },
          _createCellCoords: (row: number, col: number) => ({ row, col }),
        });
        instance.rootElement.appendChild(TD);
        document.body.appendChild(instance.rootElement);
        const cellMeta = {};

        autocompleteRenderer(instance, TD, 1, 2, 2, 'x', cellMeta);

        return { arrow: TD.querySelector('.htAutocompleteArrow') as HTMLElement, getSetting, instance };
      }

      it('should open the editor', () => {
        const { arrow, getSetting, instance } = renderIntoGrid();

        arrow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));

        expect(getSetting).toHaveBeenCalledWith('onCellDblClick', null, { row: 1, col: 2 }, expect.anything());
        instance.rootElement.remove();
      });

      it('should not open the editor when an earlier listener claimed the press', () => {
        // The FormulaBuilder plugin picks the cell as a formula reference and sets only the grid's
        // flag, so the press still bubbles to this listener.
        const { arrow, getSetting, instance } = renderIntoGrid();
        const event = new MouseEvent('mousedown', { bubbles: true, button: 0 });

        (event as MouseEvent & { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled = false;
        arrow.dispatchEvent(event);

        expect(getSetting).not.toHaveBeenCalled();
        instance.rootElement.remove();
      });
    });
  });
});
