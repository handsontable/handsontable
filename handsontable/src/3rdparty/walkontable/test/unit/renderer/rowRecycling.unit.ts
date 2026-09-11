import { RowsRenderer } from 'walkontable/render/rows';
import type { TableRenderer } from 'walkontable/render/tableRenderer';

interface Fixture {
  renderer: RowsRenderer;
  rootNode: HTMLElement;
  state: { offset: number; size: number; recyclable: boolean };
  /**
   * Renders the band and stamps every TR with the source row the cell pass would paint into it.
   */
  draw(offset: number, size: number, recyclable: boolean): void;
  /**
   * The source rows the TRs carried into this draw, in DOM order (before the stamp of that draw).
   */
  sources(): string[];
}

/**
 * Builds a rows renderer over a real TBODY with the smallest table stub `render()` reads.
 *
 * @returns {Fixture}
 */
function createFixture(): Fixture {
  const rootNode = document.createElement('tbody');
  const renderer = new RowsRenderer(rootNode);
  const state = { offset: 0, size: 0, recyclable: false };

  renderer.setTable({
    rootDocument: document,
    get rowsToRender() {
      return state.size;
    },
    renderedRowToSource: (renderedRow: number) => state.offset + renderedRow,
    isAriaEnabled: () => false,
    isRowRecyclingAllowed: () => state.recyclable,
  } as unknown as TableRenderer);

  const sources = () => Array.from(rootNode.children, tr => (tr as HTMLElement).dataset.source ?? '');
  const draw = (offset: number, size: number, recyclable: boolean) => {
    state.offset = offset;
    state.size = size;
    state.recyclable = recyclable;
    renderer.render();
    // Simulate the cell pass: after a draw every TR shows the row of its position.
    Array.from(rootNode.children).forEach((tr, index) => {
      (tr as HTMLElement).dataset.source = String(offset + index);
    });
  };

  return { renderer, rootNode, state, draw, sources };
}

describe('RowsRenderer row recycling', () => {
  it('should keep the TR of every row that stays in the band when the band moves down', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(0, 5, false);

    const trs = Array.from(rootNode.children);

    state.offset = 2;
    state.recyclable = true;
    renderer.render();

    // Rows 2, 3, 4 kept their elements at the top; rows 0 and 1 wrapped to the bottom, in order.
    expect(sources()).toEqual(['2', '3', '4', '0', '1']);
    expect(rootNode.children[0]).toBe(trs[2]);
    expect(rootNode.children[1]).toBe(trs[3]);
    expect(rootNode.children[2]).toBe(trs[4]);
    expect(rootNode.children[3]).toBe(trs[0]);
    expect(rootNode.children[4]).toBe(trs[1]);
    expect(rootNode.children.length).toBe(5);
  });

  it('should keep the TR of every row that stays in the band when the band moves up', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(4, 5, false);

    const trs = Array.from(rootNode.children);

    state.offset = 1;
    state.recyclable = true;
    renderer.render();

    // Rows 4 and 5 kept their elements; rows 6, 7, 8 wrapped to the top, in order.
    expect(sources()).toEqual(['6', '7', '8', '4', '5']);
    expect(rootNode.children[3]).toBe(trs[0]);
    expect(rootNode.children[4]).toBe(trs[1]);
    expect(rootNode.children[0]).toBe(trs[2]);
    expect(rootNode.children.length).toBe(5);
  });

  it('should carry the elements across consecutive scroll draws', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(0, 5, false);
    draw(2, 5, true);

    const rowFour = Array.from(rootNode.children).find(tr => (tr as HTMLElement).dataset.source === '4');

    state.offset = 3;
    renderer.render();

    expect(sources()).toEqual(['3', '4', '5', '6', '2']);
    expect(rootNode.children[1]).toBe(rowFour);
  });

  it('should not rotate on a draw that is not scroll-driven', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(0, 5, false);

    const trs = Array.from(rootNode.children);

    state.offset = 2;
    state.recyclable = false;
    renderer.render();

    expect(sources()).toEqual(['0', '1', '2', '3', '4']);
    expect(Array.from(rootNode.children)).toEqual(trs);
  });

  it('should not rotate when the band did not move', () => {
    const { rootNode, draw, state, renderer } = createFixture();

    draw(3, 5, false);

    const trs = Array.from(rootNode.children);

    state.recyclable = true;
    renderer.render();

    expect(Array.from(rootNode.children)).toEqual(trs);
  });

  it('should not rotate when the band moved by at least its own size', () => {
    const { rootNode, draw, state, renderer } = createFixture();

    draw(0, 5, false);

    const trs = Array.from(rootNode.children);

    state.offset = 5;
    state.recyclable = true;
    renderer.render();

    expect(Array.from(rootNode.children)).toEqual(trs);

    state.offset = 30;
    renderer.render();

    expect(Array.from(rootNode.children)).toEqual(trs);
  });

  it('should not rotate when no row would survive the move upwards into a smaller band', () => {
    const { rootNode, draw, state, renderer } = createFixture();

    draw(20, 10, false);

    const trs = Array.from(rootNode.children);

    // Scrolling up by 6 into a band of 5: the band now wants rows 14-18, and the previous band held
    // 20-29 - none of the elements that would move carries a row the new band wants.
    state.offset = 14;
    state.size = 5;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(5);
    expect(Array.from(rootNode.children)).toEqual(trs.slice(0, 5));
  });

  it('should rotate when the band shrinks while scrolling down and some rows still survive', () => {
    const { rootNode, draw, state, renderer } = createFixture();

    draw(0, 10, false);

    const trs = Array.from(rootNode.children);

    // Scrolling down by 5 into a band of 2: rows 5 and 6 survive, at old positions 5 and 6. Only the
    // previous size bounds the survival scrolling down; the new, smaller size does not.
    state.offset = 5;
    state.size = 2;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(2);
    expect(rootNode.children[0]).toBe(trs[5]);
    expect(rootNode.children[1]).toBe(trs[6]);
  });

  it('should not rotate when scrolling up past the rows the band held, even into a bigger band', () => {
    const { rootNode, draw, state, renderer } = createFixture();

    draw(20, 10, false);

    const trs = Array.from(rootNode.children);

    // Scrolling up by 15 into a band of 20: rows 20-24 would survive, but only 10 elements exist
    // and the move takes the rows from the end, so there is nothing to rotate them with. The band
    // is rebuilt in place instead; the draw must not throw.
    state.offset = 5;
    state.size = 20;
    state.recyclable = true;

    expect(() => renderer.render()).not.toThrow();
    expect(rootNode.children.length).toBe(20);
    expect(Array.from(rootNode.children).slice(0, 10)).toEqual(trs);
  });

  it('should keep the focus on a cell whose row leaves the band', () => {
    const { rootNode, draw, state, renderer } = createFixture();
    const table = document.createElement('table');

    table.appendChild(rootNode);
    document.body.appendChild(table);
    draw(0, 5, false);

    const td = document.createElement('td');

    td.tabIndex = -1;
    rootNode.children[1].appendChild(td);
    td.focus();

    expect(document.activeElement).toBe(td);

    state.offset = 3;
    state.recyclable = true;
    renderer.render();

    // Row 1 left the band: its TR wrapped to the end, and the element it carries is still focused.
    expect(rootNode.children[3]).toBe(td.parentElement);
    expect(document.activeElement).toBe(td);

    table.remove();
  });

  it('should not rotate when the band is empty', () => {
    const { rootNode, draw, state, renderer } = createFixture();

    draw(12, 6, false);

    const trs = Array.from(rootNode.children);

    state.size = 0;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(0);
    // Every TR was dropped by the view, and none of them was pointlessly moved first.
    expect(trs.every(tr => tr.parentNode === null)).toBe(true);
  });

  it('should not rotate on the first draw', () => {
    const { rootNode, state, renderer } = createFixture();

    state.offset = 7;
    state.size = 4;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(4);
  });

  it('should rotate by the previous band and then grow the band at the bottom', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(0, 5, false);

    const trs = Array.from(rootNode.children);

    state.offset = 2;
    state.size = 7;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(7);
    expect(sources().slice(0, 5)).toEqual(['2', '3', '4', '0', '1']);
    expect(rootNode.children[0]).toBe(trs[2]);
    expect(rootNode.children[4]).toBe(trs[1]);
  });

  it('should rotate by the previous band and then shrink the band at the bottom', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(0, 5, false);

    const trs = Array.from(rootNode.children);

    state.offset = 1;
    state.size = 3;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(3);
    expect(sources()).toEqual(['1', '2', '3']);
    expect(rootNode.children[0]).toBe(trs[1]);
    expect(rootNode.children[2]).toBe(trs[3]);
  });

  it('should leave the DOM alone when the root node no longer holds the previous band', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(0, 5, false);
    rootNode.removeChild(rootNode.lastChild as Node);

    state.offset = 2;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(5);
    expect(sources().slice(0, 4)).toEqual(['0', '1', '2', '3']);
  });
});
