import { applyRowHeight, EXACT_HEIGHT_CLASS } from '../../../src/render/exactRowHeight';
import { CELL_CLIP_CLASS, fastInnerText } from '../../../../../helpers/dom/element';

/**
 * Builds a body row shaped like the engine renders it: a row header holding the `.relative`
 * wrapper, then data cells with plain text content.
 *
 * @param {string[]} cellTexts The text of each data cell.
 * @returns {HTMLTableRowElement}
 */
function createRow(cellTexts: string[]): HTMLTableRowElement {
  const TR = document.createElement('tr');
  const TH = document.createElement('th');

  TH.innerHTML = '<div class="relative"><span class="rowHeader">1</span></div>';
  TR.appendChild(TH);

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
      expect(TR.querySelector(`.${EXACT_HEIGHT_CLASS}`)).toBe(null);
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
      expect(TR.querySelector(`.${EXACT_HEIGHT_CLASS}`)).toBe(null);
    });
  });

  describe('exact shape', () => {
    it('should write the height and the class to every cell', () => {
      const TR = createRow(['a', 'b']);

      applyRowHeight(TR, 10, true, true);

      cellsOf(TR).forEach((cell) => {
        expect(cell.style.height).toBe('10px');
        expect(cell.classList.contains(EXACT_HEIGHT_CLASS)).toBe(true);
      });
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
      expect(TH.classList.contains(EXACT_HEIGHT_CLASS)).toBe(true);
    });

    it('should not write a height to a cell spanning several rows, but still wrap it', () => {
      const TR = createRow(['a', 'b']);
      const merged = cellsOf(TR)[2];

      merged.setAttribute('rowspan', '3');

      applyRowHeight(TR, 10, true, true);

      expect(merged.style.height).toBe('');
      expect(merged.classList.contains(EXACT_HEIGHT_CLASS)).toBe(true);
      expect(merged.firstElementChild?.className).toBe(CELL_CLIP_CLASS);
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
    it('should unwrap the data cells and write the height to the first cell only', () => {
      const TR = createRow(['a', 'b']);

      applyRowHeight(TR, 10, true, true);
      applyRowHeight(TR, 40, false, true);

      const [TH, TD1, TD2] = cellsOf(TR);

      expect(TH.style.height).toBe('40px');
      expect(TR.querySelector(`.${CELL_CLIP_CLASS}`)).toBe(null);
      expect(TD1.childNodes.length).toBe(1);
      expect(TD1.textContent).toBe('a');
      expect(TD2.textContent).toBe('b');
    });
  });
});
