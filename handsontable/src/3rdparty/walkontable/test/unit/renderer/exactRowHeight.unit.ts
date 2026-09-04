import { applyRowHeight, EXACT_ROW_CLASS } from '../../../src/render/exactRowHeight';
import { CELL_CLIP_CLASS, fastInnerText } from '../../../../../helpers/dom/element';

/**
 * Builds a body row shaped like the engine renders it: a row header holding the `.relative`
 * wrapper (unless `rowHeader` is `false`), then data cells with plain text content.
 *
 * @param {string[]} cellTexts The text of each data cell.
 * @param {object} [options] Row options.
 * @param {boolean} [options.rowHeader=true] Whether the row starts with a row header.
 * @returns {HTMLTableRowElement}
 */
function createRow(cellTexts: string[], { rowHeader = true } = {}): HTMLTableRowElement {
  const TR = document.createElement('tr');

  if (rowHeader) {
    const TH = document.createElement('th');

    TH.innerHTML = '<div class="relative"><span class="rowHeader">1</span></div>';
    TR.appendChild(TH);
  }

  cellTexts.forEach((text) => {
    const TD = document.createElement('td');

    TD.appendChild(document.createTextNode(text));
    TR.appendChild(TD);
  });

  return TR;
}

/**
 * @param {HTMLTableRowElement} TR The row.
 * @returns {HTMLElement[]} The row's cells.
 */
function cellsOf(TR: HTMLTableRowElement): HTMLElement[] {
  return Array.from(TR.children).filter((cell): cell is HTMLElement => cell instanceof HTMLElement);
}

describe('applyRowHeight', () => {
  describe('floor shape', () => {
    it('should write the height to the first cell only', () => {
      const TR = createRow(['a', 'b']);

      applyRowHeight(TR, 40, false, true);

      const [TH, TD1, TD2] = cellsOf(TR);

      expect(TH.style.height).toBe('40px');
      expect(TD1.style.height).toBe('');
      expect(TD2.style.height).toBe('');
      expect(TR.querySelector(`.${CELL_CLIP_CLASS}`)).toBe(null);
      expect(TR.classList.contains(EXACT_ROW_CLASS)).toBe(false);
    });

    it('should subtract the top border in content-box mode', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 40, false, false);

      expect(cellsOf(TR)[0].style.height).toBe('39px');
    });

    it('should clear the height when no height applies', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 40, false, true);
      applyRowHeight(TR, undefined, false, true);

      expect(cellsOf(TR)[0].style.height).toBe('');
    });

    it('should keep the floor shape when the row is exact but has no height', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, undefined, true, true);

      expect(TR.querySelector(`.${CELL_CLIP_CLASS}`)).toBe(null);
      expect(TR.classList.contains(EXACT_ROW_CLASS)).toBe(false);
    });
  });

  describe('exact shape', () => {
    it('should mark the row and write the height to the first cell only', () => {
      const TR = createRow(['a', 'b']);

      applyRowHeight(TR, 10, true, true);

      const [TH, TD1, TD2] = cellsOf(TR);

      expect(TR.classList.contains(EXACT_ROW_CLASS)).toBe(true);
      expect(TH.style.height).toBe('10px');
      expect(TD1.style.height).toBe('');
      expect(TD2.style.height).toBe('');
      // The marker lives on the row: the cells' classes are reset by the renderers on every draw.
      cellsOf(TR).forEach(cell => expect(cell.className).toBe(''));
    });

    it('should subtract the top border in content-box mode', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 10, true, false);

      expect(cellsOf(TR)[0].style.height).toBe('9px');
    });

    it('should move each data cell\'s content into a single clipping wrapper', () => {
      const TR = createRow(['a', 'b']);

      applyRowHeight(TR, 10, true, true);

      const [, TD1, TD2] = cellsOf(TR);

      [TD1, TD2].forEach((TD) => {
        expect(TD.childNodes.length).toBe(1);
        expect(TD.firstElementChild?.className).toBe(CELL_CLIP_CLASS);
      });
      expect(TD1.firstElementChild?.textContent).toBe('a');
      expect(TD2.firstElementChild?.textContent).toBe('b');
    });

    it('should leave the row header\'s own wrapper alone', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 10, true, true);

      const TH = cellsOf(TR)[0];

      expect(TH.firstElementChild?.className).toBe('relative');
      expect(TH.querySelector(`.${CELL_CLIP_CLASS}`)).toBe(null);
    });

    it('should carry the height on the first cell that spans a single row, and still wrap a spanning cell', () => {
      const TR = createRow(['a', 'b'], { rowHeader: false });
      const [merged, TD2] = cellsOf(TR);

      merged.setAttribute('rowspan', '3');

      applyRowHeight(TR, 10, true, true);

      expect(merged.style.height).toBe('');
      expect(merged.firstElementChild?.className).toBe(CELL_CLIP_CLASS);
      expect(TD2.style.height).toBe('10px');
    });

    it('should re-apply the height after the renderers reset the cell, without touching the row class again', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 10, true, true);

      const TH = cellsOf(TR)[0];

      // What the renderers do on every draw.
      TH.removeAttribute('style');
      TR.className = 'custom';
      applyRowHeight(TR, 10, true, true);

      expect(TH.style.height).toBe('10px');
      // A row already tracked as exact is not re-marked: the first application wrote the class.
      expect(TR.className).toBe('custom');
    });

    it('should keep the same wrapper node across draws', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 10, true, true);

      const TD = cellsOf(TR)[1];
      const wrapper = TD.firstElementChild;

      applyRowHeight(TR, 10, true, true);

      expect(TD.childNodes.length).toBe(1);
      expect(TD.firstElementChild).toBe(wrapper);
    });

    it('should keep the wrapper when the text is rewritten through `fastInnerText`', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 10, true, true);

      const TD = cellsOf(TR)[1];
      const wrapper = TD.firstElementChild;

      fastInnerText(TD, 'changed');
      applyRowHeight(TR, 10, true, true);

      expect(TD.firstElementChild).toBe(wrapper);
      expect(wrapper?.textContent).toBe('changed');
    });

    it('should fold a node inserted before the wrapper into it, keeping document order', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 10, true, true);

      const TD = cellsOf(TR)[1];
      const wrapper = TD.firstElementChild;
      const arrow = document.createElement('div');

      arrow.className = 'arrow';
      // What a wrapper-unaware renderer does: insert next to the wrapper, not inside it.
      TD.insertBefore(arrow, TD.firstChild);
      TD.appendChild(document.createTextNode('tail'));

      applyRowHeight(TR, 10, true, true);

      expect(TD.childNodes.length).toBe(1);
      expect(TD.firstElementChild).toBe(wrapper);
      expect(wrapper?.firstElementChild).toBe(arrow);
      expect(wrapper?.textContent).toBe('atail');
    });

    it('should re-wrap a cell a renderer wiped', () => {
      const TR = createRow(['a']);

      applyRowHeight(TR, 10, true, true);

      const TD = cellsOf(TR)[1];

      TD.innerHTML = '<b>fresh</b>';
      applyRowHeight(TR, 10, true, true);

      expect(TD.childNodes.length).toBe(1);
      expect(TD.firstElementChild?.className).toBe(CELL_CLIP_CLASS);
      expect(TD.firstElementChild?.innerHTML).toBe('<b>fresh</b>');
    });
  });

  describe('switching back to the floor shape', () => {
    it('should unmark the row, unwrap the data cells and write the height to the first cell only', () => {
      const TR = createRow(['a', 'b']);

      TR.className = 'custom';
      applyRowHeight(TR, 10, true, true);
      applyRowHeight(TR, 40, false, true);

      const [TH, TD1, TD2] = cellsOf(TR);

      expect(TR.className).toBe('custom');
      expect(TH.style.height).toBe('40px');
      expect(TR.querySelector(`.${CELL_CLIP_CLASS}`)).toBe(null);
      expect(TD1.childNodes.length).toBe(1);
      expect(TD1.textContent).toBe('a');
      expect(TD2.textContent).toBe('b');
    });
  });
});
