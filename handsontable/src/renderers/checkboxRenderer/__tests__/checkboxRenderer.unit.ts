import Core from 'handsontable/core';
import {
  RENDERER_TYPE,
  checkboxRenderer,
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

describe('checkboxRenderer', () => {
  const toMatchHTMLConfig = ['class', 'noValue', 'type', 'autocomplete', 'tabindex', 'data-row', 'data-col', 'style'];

  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual(['text']);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowWithCause(undefined, { handsontable: true });
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, checkboxRenderer);

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

    it('should render checkbox with a proper classname if value is null', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 0, 0, undefined, null, cellMeta);

      // The checkbox tick is a real `<i class="ht-icon ht-icon-checkbox">` element, not a CSS
      // pseudo-element, and it shares a `span.htCheckboxRendererBox` wrapper with the input.
      expect(TD.outerHTML).toMatchHTML([
        '<td><span class="htCheckboxRendererBox"><input class="htCheckboxRendererInput noValue" type="checkbox" ',
        'tabindex="-1" data-row="0" data-col="0"><i class="ht-icon ht-icon-checkbox"></i></span></td>'
      ].join(''), toMatchHTMLConfig);
    });

    it('should render checkbox with its coords as data-attr', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 100, 50, undefined, null, cellMeta);

      expect(TD.outerHTML).toMatchHTML([
        '<td><span class="htCheckboxRendererBox"><input class="htCheckboxRendererInput noValue" type="checkbox" ',
        'tabindex="-1" data-row="100" data-col="50"><i class="ht-icon ht-icon-checkbox"></i></span></td>'
      ].join(''), toMatchHTMLConfig);
    });

    it('should hide checkbox if value cannot be matched to any template', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 100, 50, undefined, 'yes', cellMeta);

      expect(TD.outerHTML).toMatchHTML([
        '<td><input class="htCheckboxRendererInput htBadValue" type="checkbox" ',
        'tabindex="-1" style="display: none;" data-row="100" data-col="50">#bad-value#</td>'
      ].join(''), toMatchHTMLConfig);
    });

    it('should put the input and its tick inside one wrapper in every label arrangement', () => {
      const instance = getInstance();
      const arrangements = [
        { position: 'before', value: 'L' },
        { position: 'after', value: 'L' },
        { position: 'before', value: 'L', separated: true },
        { position: 'after', value: 'L', separated: true },
      ];

      arrangements.forEach((label) => {
        const TD = document.createElement('td');

        checkboxRenderer(instance, TD, 0, 0, undefined, true, { label });

        const boxes = TD.querySelectorAll('.htCheckboxRendererBox');

        expect(boxes.length).toBe(1);
        expect(Array.from(boxes[0].children).map(child => child.className))
          .toEqual(['htCheckboxRendererInput', 'ht-icon ht-icon-checkbox']);

        // The wrapper takes the bare input's 18.1 place: the label's first or last element
        // child, or the cell's when the label is separated.
        const labelElement = TD.querySelector('label')!;
        const host = labelElement.contains(boxes[0]) ? labelElement : TD;
        const expectedIndex = label.position === 'before' ? host.children.length - 1 : 0;

        expect(host.children[expectedIndex]).toBe(boxes[0]);
      });
    });

    it('should not stack wrappers or icons when the renderer runs again on the same cell', () => {
      const TD = document.createElement('td');
      const instance = getInstance();

      checkboxRenderer(instance, TD, 0, 0, undefined, true, {});
      checkboxRenderer(instance, TD, 0, 0, undefined, false, {});
      checkboxRenderer(instance, TD, 0, 0, undefined, null, {});

      expect(TD.querySelectorAll('.htCheckboxRendererBox').length).toBe(1);
      expect(TD.querySelectorAll('.ht-icon').length).toBe(1);
      expect(TD.querySelectorAll('input').length).toBe(1);
    });

    it('should render no wrapper and no tick for a bad value with a separated label', () => {
      const TD = document.createElement('td');
      const instance = getInstance();

      checkboxRenderer(instance, TD, 0, 0, undefined, 'yes', { label: { value: 'L', separated: true } });

      expect(TD.querySelector('.htCheckboxRendererBox')).toBeNull();
      expect(TD.querySelector('.ht-icon')).toBeNull();
      expect(TD.textContent).toBe('#bad-value#');
    });

    it('should reflect the checked state as the `checked` HTML attribute so it survives ' +
      'a custom renderer that rebuilds the cell via `innerHTML` (handsontable/dev-handsontable#342)', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 0, 0, undefined, true, cellMeta);

      const input = TD.querySelector('input') as HTMLInputElement;

      expect(input.checked).toBe(true);
      expect(input.hasAttribute('checked')).toBe(true);

      // Re-serializing and re-parsing the cell (what `TD.innerHTML += ...` does) must keep the checkbox checked.
      TD.innerHTML += ' ( TEST )';

      expect((TD.querySelector('input') as HTMLInputElement).checked).toBe(true);
    });

    it('should not reflect the `checked` attribute for an unchecked value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 0, 0, undefined, false, cellMeta);

      const input = TD.querySelector('input') as HTMLInputElement;

      expect(input.checked).toBe(false);
      expect(input.hasAttribute('checked')).toBe(false);
    });

    // A checkbox has no separate editing gesture, so a cell that names no editor must render its
    // box disabled. Core treats both falsy editor values as "no editor"; `undefined` means "not set".
    it.each([
      { editor: false, disabled: true },
      { editor: null, disabled: true },
      { editor: undefined, disabled: false },
      { editor: 'checkbox', disabled: false },
    ])('should render the input disabled=$disabled when `editor` is $editor', ({ editor, disabled }) => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = { editor };

      checkboxRenderer(instance, TD, 0, 0, undefined, true, cellMeta);

      expect((TD.querySelector('input') as HTMLInputElement).disabled).toBe(disabled);
    });
  });
});
