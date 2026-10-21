import { RowsRenderer } from 'walkontable/render/rows';
import type { TableRenderer } from 'walkontable/render/tableRenderer';

interface Fixture {
  renderer: RowsRenderer;
  rootNode: HTMLElement;
  state: { offset: number; size: number; recyclable: boolean; renderEpoch: number };
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
  const state = { offset: 0, size: 0, recyclable: false, renderEpoch: 0 };

  renderer.setTable({
    rootDocument: document,
    get rowsToRender() {
      return state.size;
    },
    renderedRowToSource: (renderedRow: number) => state.offset + renderedRow,
    isAriaEnabled: () => false,
    isRowRecyclingAllowed: () => state.recyclable,
    get renderEpoch() {
      return state.renderEpoch;
    },
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

/**
 * Makes the rotation behave like an engine that blurs a detached element at once. jsdom, like
 * Chromium, keeps the focus on an element through a synchronous detach and re-attach, so without this
 * the restore branch of the renderer never runs and a focus test proves nothing. The fragment the
 * renderer moves the rows through is wrapped so that a row carrying the focused control (or its
 * shadow host) blurs it on the way out.
 *
 * @returns {jest.SpyInstance} The spy, restored by the caller.
 */
function emulateEagerBlur(): jest.SpyInstance {
  const create = document.createDocumentFragment.bind(document);

  return jest.spyOn(document, 'createDocumentFragment').mockImplementation(() => {
    const fragment = create();
    const blurDetached = (node: Node) => {
      let active: Element | null = document.activeElement;

      while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
      }

      const host = active?.getRootNode();
      const lightNode = host instanceof ShadowRoot ? host.host : active;

      if (lightNode && node.contains(lightNode)) {
        (active as HTMLElement).blur();
      }
    };
    const { appendChild, insertBefore } = fragment;

    fragment.appendChild = <T extends Node>(node: T): T => {
      blurDetached(node);

      return appendChild.call(fragment, node) as T;
    };
    fragment.insertBefore = <T extends Node>(node: T, child: Node | null): T => {
      blurDetached(node);

      return insertBefore.call(fragment, node, child) as T;
    };

    return fragment;
  });
}

describe('RowsRenderer row recycling', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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
    const fragmentSpy = jest.spyOn(document, 'createDocumentFragment');

    state.offset = 2;
    state.recyclable = false;
    renderer.render();

    expect(sources()).toEqual(['0', '1', '2', '3', '4']);
    expect(Array.from(rootNode.children)).toEqual(trs);
    // Not "rotated by zero": the rows never went through the fragment.
    expect(fragmentSpy).not.toHaveBeenCalled();
  });

  it('should not rotate when the render epoch moved since the previous draw', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(0, 5, false);

    const trs = Array.from(rootNode.children);
    const fragmentSpy = jest.spyOn(document, 'createDocumentFragment');

    // A row mapping change with no render in between: the offsets no longer name the same rows.
    state.renderEpoch = 1;
    state.offset = 2;
    state.recyclable = true;
    renderer.render();

    expect(sources()).toEqual(['0', '1', '2', '3', '4']);
    expect(Array.from(rootNode.children)).toEqual(trs);
    expect(fragmentSpy).not.toHaveBeenCalled();

    // The next scroll draw in the new epoch rotates again.
    draw(2, 5, true);
    state.offset = 4;
    renderer.render();

    expect(sources()).toEqual(['4', '5', '6', '2', '3']);
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

  it('should keep the TR of every tail row when the band moves up and grows past its old end', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(10, 20, false);

    const trs = Array.from(rootNode.children);

    // Rows 8-35 replace rows 10-29: no row leaves, two enter at the front and six at the end.
    state.offset = 8;
    state.size = 28;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(28);
    // Every old TR sits two slots further down, so the tail rows 28 and 29 kept their elements.
    expect(Array.from(rootNode.children).slice(2, 22)).toEqual(trs);
    // The front slots and the new tail are fresh elements, not rotated ones.
    expect(sources().slice(0, 2)).toEqual(['', '']);
    expect(sources().slice(22)).toEqual(['', '', '', '', '', '']);
  });

  it('should rotate only the tail rows that leave when the band moves up and grows', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();

    draw(10, 20, false);

    const trs = Array.from(rootNode.children);

    // Rows 5-26 replace rows 10-29: rows 27-29 leave at the end and wrap to the front, rows 5 and 6
    // get fresh elements, rows 10-26 keep theirs.
    state.offset = 5;
    state.size = 22;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(22);
    expect(sources().slice(0, 2)).toEqual(['', '']);
    expect(sources().slice(2, 5)).toEqual(['27', '28', '29']);
    expect(Array.from(rootNode.children).slice(5)).toEqual(trs.slice(0, 17));
  });

  it('should give the focus back to a cell whose row leaves the band, on an engine that blurs a detached element', () => {
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

    const blurSpy = jest.spyOn(td, 'blur');

    jest.spyOn(document, 'hasFocus').mockReturnValue(true);
    emulateEagerBlur();
    state.offset = 3;
    state.recyclable = true;
    renderer.render();

    // Row 1 left the band: its TR wrapped to the end, the emulated engine blurred the element on the
    // way out (the spy proves the emulation fired), and the renderer gave it the focus back.
    expect(blurSpy).toHaveBeenCalledTimes(1);
    expect(rootNode.children[3]).toBe(td.parentElement);
    expect(document.activeElement).toBe(td);

    table.remove();
  });

  it('should keep the focused element in the band when the leaving row would be trimmed by a shrink', () => {
    const { rootNode, draw, sources, state, renderer } = createFixture();
    const table = document.createElement('table');

    table.appendChild(rootNode);
    document.body.appendChild(table);
    draw(0, 5, false);

    const td = document.createElement('td');

    td.tabIndex = -1;
    rootNode.children[0].appendChild(td);
    td.focus();

    // Rows 2-4 replace rows 0-4: the two leaving rows wrap to the end, and a band of three keeps
    // only the survivors, so both wrapped TRs would be dropped, the focused one included.
    state.offset = 2;
    state.size = 3;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(3);
    expect(td.isConnected).toBe(true);
    expect(document.activeElement).toBe(td);
    // The focused TR took the last slot; the row that slot holds is rebuilt in it.
    expect(rootNode.children[2]).toBe(td.parentElement);
    expect(sources().slice(0, 2)).toEqual(['2', '3']);
    expect(sources()[2]).toBe('0');

    table.remove();
  });

  it('should leave the focus alone when the document does not hold it', () => {
    const { rootNode, draw, state, renderer } = createFixture();
    const table = document.createElement('table');

    table.appendChild(rootNode);
    document.body.appendChild(table);
    draw(0, 5, false);

    const td = document.createElement('td');

    td.tabIndex = -1;
    rootNode.children[1].appendChild(td);
    td.focus();

    // A blurred frame: `activeElement` still names the cell, but giving it the focus back would pull
    // the focus into the frame.
    jest.spyOn(document, 'hasFocus').mockReturnValue(false);
    emulateEagerBlur();
    state.offset = 3;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children[3]).toBe(td.parentElement);
    expect(document.activeElement).not.toBe(td);

    table.remove();
  });

  it('should give the focus back to a control inside a shadow root of a cell whose row leaves the band, on an engine that blurs a detached element', () => {
    const { rootNode, draw, state, renderer } = createFixture();
    const table = document.createElement('table');

    table.appendChild(rootNode);
    document.body.appendChild(table);
    draw(0, 5, false);

    const td = document.createElement('td');
    const host = document.createElement('div');
    const input = document.createElement('input');

    host.attachShadow({ mode: 'open' }).appendChild(input);
    td.appendChild(host);
    rootNode.children[1].appendChild(td);
    input.focus();

    // The document sees the host; the control itself sits behind the shadow boundary.
    expect(document.activeElement).toBe(host);
    expect(host.shadowRoot!.activeElement).toBe(input);

    const blurSpy = jest.spyOn(input, 'blur');

    jest.spyOn(document, 'hasFocus').mockReturnValue(true);
    emulateEagerBlur();
    state.offset = 3;
    state.recyclable = true;
    renderer.render();

    expect(blurSpy).toHaveBeenCalledTimes(1);
    expect(rootNode.children[3]).toBe(td.parentElement);
    expect(document.activeElement).toBe(host);
    expect(host.shadowRoot!.activeElement).toBe(input);

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
    const fragmentSpy = jest.spyOn(document, 'createDocumentFragment');

    state.offset = 7;
    state.size = 4;
    state.recyclable = true;
    renderer.render();

    expect(rootNode.children.length).toBe(4);
    expect(fragmentSpy).not.toHaveBeenCalled();
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
