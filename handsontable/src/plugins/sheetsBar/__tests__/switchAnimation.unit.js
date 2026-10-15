import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';
import { SheetSwitchAnimation } from '../ui/switchAnimation/switchAnimation';
import { collectVisibleCells } from '../ui/switchAnimation/visibleCells';
import { CellStyles } from '../ui/switchAnimation/cellStyles';
import { LayerBuilder } from '../ui/switchAnimation/layerBuilder';
import { resolveSwitchTransition } from '../ui/switchTiming';

/**
 * Builds a grid stand-in whose visible range covers `rows` × `columns` cells with no frozen
 * bands and no headers, and whose `getCell()` answers through `cellAt`.
 *
 * @param {number} rows The visible row count.
 * @param {number} columns The visible column count.
 * @param {Function} cellAt Returns the element for a visual `(row, column)` pair.
 * @returns {object}
 */
function createHotStub(rows, columns, cellAt) {
  const rootElement = document.createElement('div');
  const rootGridElement = document.createElement('div');
  const identity = {
    getVisualFromRenderableIndex: index => index,
    getRenderableFromVisualIndex: index => index,
    getRenderableIndexesLength: () => rows,
  };

  rootGridElement.appendChild(rootElement);
  document.body.appendChild(rootGridElement);

  return {
    rootElement,
    rootGridElement,
    rootWindow: window,
    rootDocument: document,
    rowIndexMapper: identity,
    columnIndexMapper: { ...identity, getRenderableIndexesLength: () => columns },
    view: {
      countRenderableRows: () => rows,
      countRenderableColumns: () => columns,
      countNotHiddenFixedRowsTop: () => 0,
      countNotHiddenFixedRowsBottom: () => 0,
      countNotHiddenFixedColumnsStart: () => 0,
      countNotHiddenFixedColumnsEnd: () => 0,
      _wt: { wtTable: { holder: document.createElement('div') } },
    },
    countCols: () => columns,
    countColHeaders: () => 0,
    countRowHeaders: () => 0,
    isRtl: () => false,
    getFirstPartiallyVisibleRow: () => 0,
    getLastPartiallyVisibleRow: () => rows - 1,
    getFirstPartiallyVisibleColumn: () => 0,
    getLastPartiallyVisibleColumn: () => columns - 1,
    getCell: jest.fn(cellAt),
    _registerTimeout: (callback, delay) => setTimeout(callback, delay),
  };
}

/**
 * Creates a cell element that reports a laid out size, which jsdom never computes.
 *
 * @returns {HTMLTableCellElement}
 */
function createSizedCell() {
  const cell = document.createElement('td');

  Object.defineProperty(cell, 'clientWidth', { value: 50 });
  Object.defineProperty(cell, 'clientHeight', { value: 20 });

  return cell;
}

describe('SheetsBar switch animation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('collectVisibleCells', () => {
    it('answers null without a view', () => {
      expect(collectVisibleCells({ view: undefined })).toBeNull();
    });

    it('takes a merged cell once, by its element', () => {
      const merged = createSizedCell();
      const single = createSizedCell();
      const hot = createHotStub(1, 3, (row, column) => (column < 2 ? merged : single));

      const visible = collectVisibleCells(hot);

      expect(visible.cells.map(cell => cell.element)).toEqual([merged, single]);
      expect(visible.cells.map(cell => cell.key)).toEqual(['0:0', '0:2']);
      expect(visible.groupCount).toBe(2);
    });

    it('skips hidden and unrendered cells', () => {
      const cell = createSizedCell();
      const hot = createHotStub(1, 3, (row, column) => (column === 1 ? cell : null));

      const visible = collectVisibleCells(hot);

      expect(visible.cells.map(entry => entry.key)).toEqual(['0:1']);
      expect(visible.cells[0].group).toBe(0);
    });

    it('takes the frozen bottom rows from the rows the grid renders, not from the rows it holds', () => {
      const hot = createHotStub(10, 1, () => createSizedCell());

      hot.view.countRenderableRows = () => 5;
      hot.view.countNotHiddenFixedRowsBottom = () => 2;
      hot.getFirstPartiallyVisibleRow = () => 0;
      hot.getLastPartiallyVisibleRow = () => 1;

      expect(collectVisibleCells(hot).cells.map(cell => cell.key)).toEqual(['0:0', '1:0', '3:0', '4:0']);
    });

    it('never walks a hidden row between the first and the last visible one', () => {
      const hot = createHotStub(3, 1, () => createSizedCell());

      hot.rowIndexMapper = {
        getRenderableFromVisualIndex: visual => [0, null, 1][visual],
        getVisualFromRenderableIndex: renderable => [0, 2][renderable],
        getRenderableIndexesLength: () => 2,
      };
      hot.view.countRenderableRows = () => 2;
      hot.getLastPartiallyVisibleRow = () => 2;

      expect(collectVisibleCells(hot).cells.map(cell => cell.key)).toEqual(['0:0', '2:0']);
      expect(hot.getCell.mock.calls.map(([row]) => row)).toEqual([0, 2]);
    });

    it('measures a header where its pane draws it once the pane follows the scrollable part', () => {
      const clone = document.createElement('div');
      const cloneHolder = document.createElement('div');
      const header = createSizedCell();
      const hot = createHotStub(1, 1, row => (row < 0 ? header : null));

      clone.className = 'ht_clone_top';
      cloneHolder.className = 'wtHolder';
      clone.appendChild(cloneHolder);
      const row = cloneHolder.appendChild(document.createElement('table')).appendChild(document.createElement('tr'));

      row.appendChild(header);
      hot.rootElement.appendChild(clone);
      hot.countColHeaders = () => 1;
      Object.defineProperty(cloneHolder, 'scrollLeft', { value: 120 });
      Object.defineProperty(hot.view._wt.wtTable.holder, 'scrollLeft', { value: 20 });
      header.getBoundingClientRect = () => ({ left: 10, top: 0, right: 60, bottom: 20 });

      const [cell] = collectVisibleCells(hot).cells;

      expect(cell.pane).toBe('ht_clone_top');
      expect(cell.box.left).toBe(110);
      expect(cell.box.top).toBe(0);
    });

    it('collects a view of exactly 1,500 cells', () => {
      const hot = createHotStub(100, 15, () => createSizedCell());

      expect(collectVisibleCells(hot).cells).toHaveLength(1500);
    });

    it('answers null for a view of 1,501 cells without resolving a single cell', () => {
      const hot = createHotStub(1501, 1, () => createSizedCell());

      expect(collectVisibleCells(hot)).toBeNull();
      expect(hot.getCell).not.toHaveBeenCalled();
    });
  });

  describe('CellStyles#content', () => {
    it('copies a cell\'s elements without their ids and inline event handlers', () => {
      const cell = document.createElement('td');

      cell.innerHTML = '<span id="label" onclick="x()" class="kept"><b ONMOUSEOVER="y()">A</b></span>';

      const { fragment } = new CellStyles(window).content(cell);
      const span = fragment.querySelector('span');

      expect(span.hasAttribute('id')).toBe(false);
      expect(span.hasAttribute('onclick')).toBe(false);
      expect(span.getAttribute('class')).toBe('kept');
      expect(fragment.querySelector('b').hasAttribute('onmouseover')).toBe(false);
      expect(cell.querySelector('span').id).toBe('label');
    });

    it('keeps the visible text of a cell holding a script, without the script\'s source', () => {
      const cell = document.createElement('td');

      cell.innerHTML = 'Total <b>12</b><svg><script>window.ran = 1;</script></svg>';

      expect(new CellStyles(window).content(cell)).toEqual({ text: 'Total 12', fragment: null, marks: [] });
    });

    it('keeps the comment mark a commented cell draws on itself, and no mark for any other class', () => {
      const commented = document.createElement('td');
      const plain = document.createElement('td');

      commented.className = 'htCommentCell current';
      commented.textContent = 'A1';
      plain.className = 'current area';
      plain.innerHTML = '<b>B1</b>';

      expect(new CellStyles(window).content(commented).marks).toEqual(['comment']);
      expect(new CellStyles(window).content(plain).marks).toEqual([]);
    });
  });

  describe('LayerBuilder', () => {
    /**
     * Builds a copy entry of a multi-line cell at `top`, styled by its own box declarations.
     *
     * @param {number} top The cell's top edge.
     * @param {string} boxDeclarations The cell's non-inherited text styles.
     * @param {string[]} [marks] The marks the cell draws on itself.
     * @returns {object}
     */
    function entryAt(top, boxDeclarations, marks = []) {
      return {
        cell: { key: `${top}:0`, group: 0, pane: 'ht_master', box: { left: 0, top, width: 50, height: 20 } },
        style: {
          declarations: 'color:red;',
          boxDeclarations,
          boxVariables: `--ht-private-sheet-switch-cell-${boxDeclarations}`,
          metrics: null,
        },
        content: { text: `${top}`, fragment: null, marks },
      };
    }

    /**
     * Builds a copy entry of a single-line cell at `top`, in a column of 20px rows with a 1px line between them.
     *
     * @param {number} top The cell's top edge.
     * @param {string[]} marks The marks the cell draws on itself.
     * @returns {object}
     */
    function lineAt(top, marks) {
      const entry = entryAt(top, 'padding-top:4px;', marks);

      entry.style.metrics = { lineHeight: 12, paddingTop: 4, paddingBottom: 4, verticalAlign: 'top' };

      return entry;
    }

    it('draws a marked cell as a copy of its own that carries the mark, and the rest as lines', () => {
      const builder = new LayerBuilder(document, () => ({ left: 0, top: 0, width: 200, height: 200 }));

      builder.addCopy('out', lineAt(0, []));
      builder.addCopy('out', lineAt(21, []));
      builder.addCopy('out', lineAt(42, ['comment']));
      builder.addCopy('out', lineAt(63, []));
      builder.addCopy('out', lineAt(84, []));

      const copies = Array.from(builder.build().querySelectorAll('.ht-sheet-switch__out .ht-sheet-switch__cell'));
      const marked = copies.filter(copy => copy.classList.contains('ht-sheet-switch__cell--comment'));

      expect(copies.map(copy => copy.textContent)).toEqual(['0\n21', '42', '63\n84']);
      expect(marked.map(copy => copy.textContent)).toEqual(['42']);
    });

    it('carries the first copy\'s box styles on the side, and writes them only on a copy that differs', () => {
      const builder = new LayerBuilder(document, () => ({ left: 0, top: 0, width: 200, height: 200 }));

      builder.addCopy('in', entryAt(0, 'padding-top:4px;'));
      builder.addCopy('in', entryAt(40, 'padding-top:4px;'));
      builder.addCopy('in', entryAt(80, 'padding-top:9px;'));

      const side = builder.build().querySelector('.ht-sheet-switch__in');
      const copies = Array.from(side.querySelectorAll('.ht-sheet-switch__cell'));

      expect(side.style.getPropertyValue('--ht-private-sheet-switch-cell-padding-top')).toBe('4px');
      expect(side.style.color).toBe('red');
      expect(copies.map(copy => copy.style.paddingTop)).toEqual(['', '', '9px']);
      expect(copies.map(copy => copy.style.color)).toEqual(['', '', '']);
    });
  });

  describe('SheetSwitchAnimation#prepare', () => {
    it('answers null and reads no cell when the switch does not animate', () => {
      const hot = createHotStub(1, 1, () => createSizedCell());
      const animation = new SheetSwitchAnimation(hot);

      expect(animation.prepare(0)).toBeNull();
      expect(hot.getCell).not.toHaveBeenCalled();
      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);
    });

    it('answers null on a jsdom grid, which carries no transition token', () => {
      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: [[1, 2], [3, 4]],
        licenseKey: 'non-commercial-and-evaluation',
      });
      const animation = new SheetSwitchAnimation(hot);

      expect(animation.prepare(resolveSwitchTransition(hot))).toBeNull();
      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);

      hot.destroy();
    });
  });

  describe('SheetSwitchAnimation over the cell limit', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('swaps no content and still fades the selection in after the switch', () => {
      const hot = createHotStub(1501, 1, () => createSizedCell());
      const animation = new SheetSwitchAnimation(hot);
      const snapshot = animation.prepare(150);

      expect(hot.rootGridElement.getAttribute('data-ht-sheet-switch')).toBe('pending');

      animation.play(snapshot);

      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).toBeNull();
      expect(hot.rootGridElement.getAttribute('data-ht-sheet-switch')).toBe('reveal');

      jest.advanceTimersByTime(149);

      expect(hot.rootGridElement.getAttribute('data-ht-sheet-switch')).toBe('reveal');

      jest.advanceTimersByTime(1);

      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);
    });
  });

  describe('SheetSwitchAnimation#play and #finish', () => {
    it('draws nothing for a snapshot that finish() dropped', () => {
      const hot = createHotStub(1, 1, () => createSizedCell());
      const animation = new SheetSwitchAnimation(hot);
      const snapshot = animation.prepare(150);

      expect(snapshot).not.toBeNull();
      expect(hot.rootGridElement.getAttribute('data-ht-sheet-switch')).toBe('pending');

      animation.finish();
      animation.play(snapshot);

      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).toBeNull();
      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);
    });

    it('removes the switch state and rethrows when the swap fails to build', () => {
      const hot = createHotStub(1, 1, () => createSizedCell());
      const animation = new SheetSwitchAnimation(hot);
      const snapshot = animation.prepare(150);

      hot.getCell.mockImplementationOnce(() => {
        throw new Error('getCell failed');
      });

      expect(() => animation.play(snapshot)).toThrowError('getCell failed');
      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);
      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).toBeNull();
    });

    it('writes the selection fade timing on the grid element once per transition, and removes it on release', () => {
      const hot = createHotStub(1, 1, () => createSizedCell());
      const animation = new SheetSwitchAnimation(hot);
      const { style } = hot.rootGridElement;
      const setProperty = jest.spyOn(style, 'setProperty');

      animation.prepare(150);

      expect(style.getPropertyValue('--ht-private-sheet-switch-mark-delay')).toBe('50ms');
      expect(style.getPropertyValue('--ht-private-sheet-switch-mark-duration')).toBe('100ms');

      animation.finish();
      setProperty.mockClear();
      animation.prepare(150);

      expect(setProperty).not.toHaveBeenCalled();

      animation.finish();
      animation.prepare(300);

      expect(style.getPropertyValue('--ht-private-sheet-switch-mark-delay')).toBe('100ms');
      expect(style.getPropertyValue('--ht-private-sheet-switch-mark-duration')).toBe('200ms');

      animation.release();

      expect(style.getPropertyValue('--ht-private-sheet-switch-mark-delay')).toBe('');
      expect(style.getPropertyValue('--ht-private-sheet-switch-mark-duration')).toBe('');
      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);
    });

    it('keeps finish() free of DOM work when nothing runs, as the grid calls it on every key press, pointer press, and data change', () => {
      const hot = createHotStub(1, 1, () => createSizedCell());
      const animation = new SheetSwitchAnimation(hot);
      const hasAttribute = jest.spyOn(hot.rootGridElement, 'hasAttribute');
      const removeAttribute = jest.spyOn(hot.rootGridElement, 'removeAttribute');

      animation.finish();

      expect(hasAttribute).not.toHaveBeenCalled();
      expect(removeAttribute).not.toHaveBeenCalled();
    });
  });

  describe('SheetSwitchAnimation awaiting a server sheet\'s rows', () => {
    /**
     * Builds a one-row grid stand-in with a row header, a column header, and a sized scrollable
     * part, whose timeouts run on Jest's fake timers.
     *
     * @returns {object}
     */
    function createAwaitingHot() {
      const hot = createHotStub(1, 1, (row, column) => {
        const cell = createSizedCell();

        cell.textContent = `${row}:${column}`;

        return cell;
      });
      const master = document.createElement('div');
      const holder = document.createElement('div');

      master.className = 'ht_master';
      holder.className = 'wtHolder';
      Object.defineProperty(holder, 'clientWidth', { value: 200 });
      Object.defineProperty(holder, 'clientHeight', { value: 100 });
      master.appendChild(holder);
      hot.rootElement.appendChild(master);
      hot.view._wt.wtTable.holder = holder;

      hot.countColHeaders = () => 1;
      hot.countRowHeaders = () => 1;
      hot._registerTimeout = (callback, delay) => setTimeout(callback, delay);

      return hot;
    }

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('keeps the selection hidden and draws nothing until the awaited rows land', () => {
      const hot = createAwaitingHot();
      const animation = new SheetSwitchAnimation(hot);
      const context = {};

      animation.awaitRows(context, 150);
      animation.fadeInLandedRows();
      animation.rowsLanded({});
      animation.fadeInLandedRows();

      expect(animation.isAwaitingRows()).toBe(true);
      expect(hot.rootGridElement.getAttribute('data-ht-sheet-switch')).toBe('awaiting');
      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).toBeNull();
    });

    it('fades the landed rows in with no leaving copies, then reveals the selection', () => {
      const hot = createAwaitingHot();
      const animation = new SheetSwitchAnimation(hot);
      const context = {};

      animation.awaitRows(context, 150);
      animation.rowsLanded(context);

      expect(animation.isAwaitingRows()).toBe(false);

      animation.fadeInLandedRows();

      const layer = hot.rootGridElement.querySelector('.ht-sheet-switch');
      const entering = Array.from(layer.querySelectorAll('.ht-sheet-switch__in .ht-sheet-switch__cell'))
        .map(copy => copy.textContent);

      expect(layer.classList.contains('ht-sheet-switch--fade')).toBe(true);
      expect(layer.style.getPropertyValue('--ht-private-sheet-switch-stagger')).toBe('0ms');
      expect(layer.style.getPropertyValue('--ht-private-sheet-switch-in-delay')).toBe('');
      expect(layer.style.getPropertyValue('--ht-private-sheet-switch-in-duration')).toBe('');
      expect(layer.querySelector('.ht-sheet-switch__out')).toBeNull();
      expect(entering.sort()).toEqual(['0:-1', '0:0']);

      jest.advanceTimersByTime(149);

      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).not.toBeNull();

      jest.advanceTimersByTime(1);

      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).toBeNull();
      expect(hot.rootGridElement.getAttribute('data-ht-sheet-switch')).toBe('reveal');

      jest.advanceTimersByTime(150);

      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);
    });

    it('fades nothing in once finish() dropped the wait', () => {
      const hot = createAwaitingHot();
      const animation = new SheetSwitchAnimation(hot);
      const context = {};

      animation.awaitRows(context, 150);
      animation.finish();
      animation.rowsLanded(context);
      animation.fadeInLandedRows();

      expect(animation.isAwaitingRows()).toBe(false);
      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).toBeNull();
      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);
    });

    it('ends a running swap and its timeout before it waits', () => {
      const hot = createAwaitingHot();
      const animation = new SheetSwitchAnimation(hot);

      animation.play(animation.prepare(150));

      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).not.toBeNull();

      animation.awaitRows({}, 150);

      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).toBeNull();
      expect(hot.rootGridElement.getAttribute('data-ht-sheet-switch')).toBe('awaiting');

      jest.advanceTimersByTime(10_000);

      expect(hot.rootGridElement.getAttribute('data-ht-sheet-switch')).toBe('awaiting');
    });

    it('waits for nothing when the switch does not animate', () => {
      const hot = createAwaitingHot();
      const animation = new SheetSwitchAnimation(hot);

      animation.awaitRows({}, 0);

      expect(animation.isAwaitingRows()).toBe(false);
      expect(hot.rootGridElement.hasAttribute('data-ht-sheet-switch')).toBe(false);
    });
  });

  describe('SheetSwitchAnimation header swap', () => {
    /**
     * Builds a one-cell grid stand-in with a column header that reads `A` and sits at `left`.
     *
     * @param {object} position The header's position.
     * @param {number} position.left The header's left edge.
     * @returns {object}
     */
    function createHeaderHot(position) {
      const hot = createHotStub(1, 1, (row) => {
        const cell = createSizedCell();

        if (row < 0) {
          cell.textContent = 'A';
          cell.getBoundingClientRect = () => ({ left: position.left, top: 0, right: position.left + 50, bottom: 20 });
        } else {
          cell.textContent = 'body';
        }

        return cell;
      });
      const holder = document.createElement('div');

      Object.defineProperty(holder, 'clientWidth', { value: 400 });
      Object.defineProperty(holder, 'clientHeight', { value: 100 });
      hot.view._wt.wtTable.holder = holder;
      hot.countColHeaders = () => 1;

      return hot;
    }

    /**
     * Reads the texts of the copies a side of the running layer draws.
     *
     * @param {object} hot The grid stand-in.
     * @param {string} side The side, `in` or `out`.
     * @returns {string[]}
     */
    function copiesOf(hot, side) {
      return Array.from(hot.rootGridElement.querySelectorAll(`.ht-sheet-switch__${side} .ht-sheet-switch__cell`))
        .map(copy => copy.textContent)
        .sort();
    }

    it('leaves out a header that kept its text and its box', () => {
      const position = { left: 10 };
      const hot = createHeaderHot(position);
      const animation = new SheetSwitchAnimation(hot);

      animation.play(animation.prepare(150));

      expect(copiesOf(hot, 'in')).toEqual(['body']);
      expect(copiesOf(hot, 'out')).toEqual(['body']);
    });

    it('swaps a header that kept its text but moved', () => {
      const position = { left: 10 };
      const hot = createHeaderHot(position);
      const animation = new SheetSwitchAnimation(hot);
      const snapshot = animation.prepare(150);

      position.left = 60;
      animation.play(snapshot);

      expect(copiesOf(hot, 'in')).toEqual(['A', 'body']);
      expect(copiesOf(hot, 'out')).toEqual(['A', 'body']);
    });
  });

  describe('a switch on a grid without the transition token', () => {
    beforeAll(() => {
      registerPlugin(SheetsBar);
    });

    it('draws no layer and sets no switch state', () => {
      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [
            { name: 'Alpha', data: [['A1']] },
            { name: 'Beta', data: [['B1']] },
          ],
        },
        licenseKey: 'non-commercial-and-evaluation',
      });
      const observer = new MutationObserver(() => {});

      observer.observe(hot.rootGridElement, { attributes: true, attributeFilter: ['data-ht-sheet-switch'] });

      expect(hot.getPlugin('sheetsBar').setActiveSheet('Beta')).toBe(true);

      const records = observer.takeRecords();

      observer.disconnect();

      expect(hot.getDataAtCell(0, 0)).toBe('B1');
      expect(hot.rootGridElement.querySelector('.ht-sheet-switch')).toBeNull();
      expect(records.map(record => record.attributeName)).toEqual([]);

      hot.destroy();
    });
  });
});
