import Core from 'handsontable/core';
import {
  RENDERER_TYPE,
  textRenderer,
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

describe('textRenderer', () => {
  describe('registering', () => {
    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, textRenderer);

      expect(getRegisteredRendererNames()).toEqual([RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    /**
     *
     */
    function getInstance(config = {}) {
      return new Core(document.createElement('div'), config);
    }

    it('should insert placeholder if there is no value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {
        placeholder: 'Placeholder'
      };

      textRenderer(instance, TD, undefined, undefined, undefined, '', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>Placeholder</td>');
    });

    it('should not replace 0 with placeholder', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = { placeholder: 'Placeholder' };

      textRenderer(instance, TD, undefined, undefined, undefined, 0, cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>0</td>');
    });

    it('should not replace false with placeholder', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = { placeholder: 'Placeholder' };

      textRenderer(instance, TD, undefined, undefined, undefined, false, cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>false</td>');
    });

    it('should replace white spaces with nbsp entity', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        trimWhitespace: false,
        wordWrap: false,
      });
      const cellMeta = {};

      textRenderer(instance, TD, undefined, undefined, undefined, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>Long   text </td>');
    });

    it('should trim whitespaces if trimWhitespace is set as true', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        trimWhitespace: false,
      });
      const cellMeta = { trimWhitespace: true }; // cell meta layer has priority

      textRenderer(instance, TD, undefined, undefined, undefined, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>Long   text</td>');
    });

    it('should trim whitespaces if wordWrap is set as true and trimWhitespace is set as true', () => {
      const TD = document.createElement('td');
      const instance = getInstance({
        wordWrap: true,
        trimWhitespace: false
      });
      const cellMeta = { trimWhitespace: true }; // cell meta layer has priority

      textRenderer(instance, TD, undefined, undefined, undefined, 'Long   text ', cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>Long   text</td>');
    });

    describe('line clamp', () => {
      it('should write the text into a clamp wrapper carrying the number of lines', () => {
        const TD = document.createElement('td');
        const instance = getInstance();

        textRenderer(instance, TD, undefined, undefined, undefined, 'Long text', { textEllipsis: 3 });

        expect(TD.children.length).toBe(1);
        expect(TD.firstElementChild!.className).toBe('htLineClamp');
        expect(TD.firstElementChild!.textContent).toBe('Long text');
        expect((TD.firstElementChild as HTMLElement).style.getPropertyValue('--ht-text-line-clamp')).toBe('3');
      });

      it('should mark the cell with the line-clamp class only when it wrote a wrapper', () => {
        const instance = getInstance();
        const clamped = document.createElement('td');
        const plain = document.createElement('td');

        textRenderer(instance, clamped, undefined, undefined, undefined, 'Text', { textEllipsis: 2 });
        textRenderer(instance, plain, undefined, undefined, undefined, 'Text', { textEllipsis: true });

        expect(clamped.classList.contains('htTextLineClamp')).toBe(true);
        expect(plain.classList.contains('htTextLineClamp')).toBe(false);
      });

      it('should keep the same wrapper element across redraws and update its text and line count', () => {
        const TD = document.createElement('td');
        const instance = getInstance();

        textRenderer(instance, TD, undefined, undefined, undefined, 'First', { textEllipsis: 2 });

        const wrapper = TD.firstElementChild as HTMLElement;

        textRenderer(instance, TD, undefined, undefined, undefined, 'Second', { textEllipsis: 4 });

        expect(TD.firstElementChild).toBe(wrapper);
        expect(wrapper.textContent).toBe('Second');
        expect(wrapper.style.getPropertyValue('--ht-text-line-clamp')).toBe('4');
      });

      it('should reuse a wrapper that a whole-cell link moved inside the anchor', () => {
        const TD = document.createElement('td');
        const instance = getInstance();

        textRenderer(instance, TD, undefined, undefined, undefined, 'First', { textEllipsis: 2 });

        // what `wrapCellContent()` does for `autoLink` with `inline: false` and for `HYPERLINK`
        const wrapper = TD.firstElementChild as HTMLElement;
        const link = document.createElement('a');

        link.appendChild(wrapper);
        TD.appendChild(link);

        textRenderer(instance, TD, undefined, undefined, undefined, 'Second', { textEllipsis: 2 });

        expect(TD.children.length).toBe(1);
        expect(TD.firstElementChild).toBe(link);
        expect(link.firstElementChild).toBe(wrapper);
        expect(wrapper.textContent).toBe('Second');
      });

      it('should reuse a wrapper inside a link that holds other nodes before it', () => {
        const TD = document.createElement('td');
        const instance = getInstance();

        textRenderer(instance, TD, undefined, undefined, undefined, 'First', { textEllipsis: 2 });

        // an autocomplete cell: the arrow sits before the wrapper when the link takes every child of the cell
        const wrapper = TD.firstElementChild as HTMLElement;
        const arrow = document.createElement('div');
        const link = document.createElement('a');

        arrow.className = 'htAutocompleteArrow';
        link.appendChild(arrow);
        link.appendChild(wrapper);
        TD.appendChild(link);

        textRenderer(instance, TD, undefined, undefined, undefined, 'Second', { textEllipsis: 2 });

        expect(TD.children.length).toBe(1);
        expect(link.children.length).toBe(1);
        expect(link.firstElementChild).toBe(wrapper);
        expect(wrapper.textContent).toBe('Second');
      });

      it('should remove markup that another renderer put beside the wrapper', () => {
        const TD = document.createElement('td');
        const instance = getInstance();

        textRenderer(instance, TD, undefined, undefined, undefined, 'Text', { textEllipsis: 2 });

        const arrow = document.createElement('div');

        arrow.className = 'htAutocompleteArrow';
        TD.insertBefore(arrow, TD.firstChild);

        textRenderer(instance, TD, undefined, undefined, undefined, 'Text', { textEllipsis: 2 });

        expect(TD.children.length).toBe(1);
        expect(TD.firstElementChild!.className).toBe('htLineClamp');
      });

      it('should drop the wrapper and write the text straight into the cell once the clamp is turned off', () => {
        const TD = document.createElement('td');
        const instance = getInstance();

        textRenderer(instance, TD, undefined, undefined, undefined, 'Text', { textEllipsis: 2 });
        textRenderer(instance, TD, undefined, undefined, undefined, 'Text', { textEllipsis: false });

        expect(TD.outerHTML).toMatchHTML('<td>Text</td>');
      });

      it.each([
        ['true', true, undefined],
        ['1', 1, undefined],
        ['a number with `wordWrap: false`', 3, false],
        ['0', 0, undefined],
        ['a fraction', 2.5, undefined],
      ])('should not use a wrapper when `textEllipsis` is %s', (_, textEllipsis, wordWrap) => {
        const TD = document.createElement('td');
        const instance = getInstance();

        textRenderer(instance, TD, undefined, undefined, undefined, 'Text', { textEllipsis, wordWrap });

        expect(TD.outerHTML).toMatchHTML('<td>Text</td>');
      });

      it('should escape markup in the clamped text', () => {
        const TD = document.createElement('td');
        const instance = getInstance();

        textRenderer(instance, TD, undefined, undefined, undefined, '<b>bold</b>', { textEllipsis: 2 });

        expect(TD.querySelector('b')).toBeNull();
        expect(TD.firstElementChild!.textContent).toBe('<b>bold</b>');
      });
    });

    it('should insert stringified value', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const value = [1, 2, 3];
      const cellMeta = {};

      textRenderer(instance, TD, undefined, undefined, undefined, value, cellMeta);

      expect(TD.outerHTML).toMatchHTML('<td>1,2,3</td>');
    });
  });
});
