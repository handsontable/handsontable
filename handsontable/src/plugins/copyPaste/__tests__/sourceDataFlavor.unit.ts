import Handsontable from '../../../index';
import { registerCellType, TextCellType } from '../../../cellTypes';
import { registerPlugin } from '../../registry';
import { CopyPaste } from '../copyPaste';

registerCellType(TextCellType);
registerPlugin(CopyPaste);

const SOURCE_FLAVOR = 'application/ht-source-data-json-html';

type Flavors = Record<string, string>;
type CopyPastePlugin = { onCopy(e: unknown): void, onCut(e: unknown): void, onPaste(e: unknown): void };

const containers: HTMLElement[] = [];

/**
 * Builds a mounted, listening grid.
 *
 * @param {object} settings Grid settings.
 * @returns {object} The Handsontable instance.
 */
function createGrid(settings: Record<string, unknown>) {
  const container = document.createElement('div');

  document.body.appendChild(container);
  containers.push(container);

  const hot = new Handsontable(container, {
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  hot.listen();

  return hot;
}

/**
 * Dispatches a native-shaped clipboard event and returns the flavors the plugin wrote.
 *
 * @param {object} hot The Handsontable instance.
 * @param {'onCopy'|'onCut'} handler The plugin handler to call.
 * @returns {object} The flavors written to the clipboard.
 */
function dispatch(hot: Handsontable, handler: 'onCopy' | 'onCut') {
  const flavors: Flavors = {};

  (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin)[handler]({
    clipboardData: { setData: (type: string, value: string) => { flavors[type] = value; } },
    target: document.body,
    defaultPrevented: false,
    preventDefault() {},
    composedPath: () => [],
  });

  return flavors;
}

/**
 * Pastes the given flavors into the grid at the selected cell.
 *
 * @param {object} hot The Handsontable instance.
 * @param {object} flavors The flavors the clipboard carries.
 */
function paste(hot: Handsontable, flavors: Flavors) {
  (hot.getPlugin('copyPaste') as unknown as CopyPastePlugin).onPaste({
    clipboardData: { types: Object.keys(flavors), getData: (type: string) => flavors[type] ?? '', setData() {} },
    target: document.body,
    defaultPrevented: false,
    preventDefault() {},
    composedPath: () => [],
  });
}

/**
 * Copies the first column of the source grid and pastes it into a fresh `parsePastedValue` grid.
 *
 * @param {object} source The source grid, with its selection already made.
 * @param {'onCopy'|'onCut'} handler The plugin handler to call.
 * @returns {object} The target grid.
 */
function transfer(source: Handsontable, handler: 'onCopy' | 'onCut' = 'onCopy') {
  const flavors = dispatch(source, handler);
  const target = createGrid({
    data: [[null], [null], [null]],
    columns: [{ parsePastedValue: true }],
  });

  target.selectCell(0, 0);
  paste(target, flavors);

  return target;
}

describe('CopyPaste source-data flavor and the beforeCopy / beforeCut hooks', () => {
  let hots: Handsontable[] = [];

  const track = (hot: Handsontable) => {
    hots.push(hot);

    return hot;
  };

  afterEach(() => {
    hots.forEach(hot => hot.destroy());
    hots = [];
    containers.splice(0).forEach(container => container.remove());
  });

  const createSource = (settings: Record<string, unknown>) => {
    const hot = track(createGrid({
      data: [[{ a: 1 }], [{ b: 2 }], [{ c: 3 }]],
      columns: [{ parsePastedValue: true }],
      ...settings,
    }));

    hot.selectCell(0, 0, 1, 0);

    return hot;
  };

  it('should write the unchanged source data when the hook leaves the data alone', () => {
    const source = createSource({});
    const target = track(transfer(source));

    expect(target.getDataAtCell(0, 0)).toEqual({ a: 1 });
    expect(target.getDataAtCell(1, 0)).toEqual({ b: 2 });
  });

  it('should keep the flavors aligned when beforeCopy removes a row', () => {
    const source = createSource({
      beforeCopy(data: unknown[][]) {
        data.splice(0, 1);
      },
    });
    const target = track(transfer(source));

    expect(target.getDataAtCell(0, 0)).toEqual({ b: 2 });
    expect(target.getDataAtCell(1, 0)).toBeNull();
  });

  it('should keep the flavors aligned when beforeCopy reorders rows', () => {
    const source = createSource({
      beforeCopy(data: unknown[][]) {
        data.reverse();
      },
    });
    const target = track(transfer(source));

    expect(target.getDataAtCell(0, 0)).toEqual({ b: 2 });
    expect(target.getDataAtCell(1, 0)).toEqual({ a: 1 });
  });

  it('should not leak the original value of a cell a hook masked', () => {
    const source = createSource({
      beforeCopy(data: unknown[][]) {
        data[0][0] = '';
      },
    });
    const flavors = dispatch(source, 'onCopy');

    expect(flavors['text/plain']).not.toContain('"a"');
    expect(flavors[SOURCE_FLAVOR]).not.toContain('"a"');
    expect(flavors[SOURCE_FLAVOR]).toContain('{"b":2}');

    const target = track(transfer(source));

    expect(target.getDataAtCell(0, 0)).toBe('');
    expect(target.getDataAtCell(1, 0)).toEqual({ b: 2 });
  });

  it('should write an object a hook put into a cell as JSON', () => {
    const source = createSource({
      beforeCopy(data: unknown[][]) {
        data[0][0] = { z: 9 };
      },
    });
    const target = track(transfer(source));

    expect(target.getDataAtCell(0, 0)).toEqual({ z: 9 });
  });

  it('should drop the source-data flavor when a hook swaps a row for a new array', () => {
    const source = createSource({
      beforeCopy(data: unknown[][]) {
        data.splice(0, 1, ['replaced']);
      },
    });
    const flavors = dispatch(source, 'onCopy');

    expect(flavors['text/plain']).toContain('replaced');
    expect(flavors).not.toHaveProperty(SOURCE_FLAVOR);
  });

  it('should drop the source-data flavor when a hook changes a row length', () => {
    const source = createSource({
      beforeCopy(data: unknown[][]) {
        data[0].push('extra');
      },
    });
    const flavors = dispatch(source, 'onCopy');

    expect(flavors).not.toHaveProperty(SOURCE_FLAVOR);
  });

  it('should keep the flavors aligned when beforeCut removes a row', () => {
    const source = createSource({
      beforeCut(data: unknown[][]) {
        data.splice(0, 1);
      },
    });
    const target = track(transfer(source, 'onCut'));

    expect(target.getDataAtCell(0, 0)).toEqual({ b: 2 });
    expect(target.getDataAtCell(1, 0)).toBeNull();
  });

  it('should not leak the original value of a cell beforeCut masked', () => {
    const source = createSource({
      beforeCut(data: unknown[][]) {
        data[1][0] = '';
      },
    });
    const flavors = dispatch(source, 'onCut');

    expect(flavors[SOURCE_FLAVOR]).not.toContain('"b"');
    expect(flavors[SOURCE_FLAVOR]).toContain('{"a":1}');
  });

  it('should not leak a field a hook removed from an object cell in place', () => {
    const source = createSource({
      data: [[{ a: 1, secret: 's' }], [{ b: 2 }]],
      beforeCopy(data: unknown[][]) {
        delete (data[0][0] as Record<string, unknown>).secret;
      },
    });
    const flavors = dispatch(source, 'onCopy');

    expect(flavors[SOURCE_FLAVOR]).not.toContain('secret');
    expect(flavors[SOURCE_FLAVOR]).toContain('{"a":1}');
  });

  it('should write no source-data flavor when the hook cancels the copy', () => {
    const source = createSource({
      beforeCopy: () => false,
    });

    expect(dispatch(source, 'onCopy')).toEqual({});
  });

  it('should keep the neighbor of a changed cell intact in a multi-column copy', () => {
    const source = track(createGrid({
      data: [[{ a: 1 }, { x: 1 }], [{ b: 2 }, { y: 2 }]],
      beforeCopy(data: unknown[][]) {
        data[0][1] = '';
      },
    }));

    source.selectCell(0, 0, 1, 1);

    const flavors = dispatch(source, 'onCopy');

    expect(flavors[SOURCE_FLAVOR]).toContain('{"a":1}');
    expect(flavors[SOURCE_FLAVOR]).not.toContain('{"x":1}');
    expect(flavors[SOURCE_FLAVOR]).toContain('{"y":2}');
  });

  it('should write a blank for a pending AsyncValues cell copied with copyPendingAs "empty"', () => {
    const source = track(createGrid({
      data: [[{ k: 'old' }], [{ b: 2 }]],
      asyncValues: { copyPendingAs: 'empty' },
    }));

    (source.getPlugin('asyncValues') as unknown as {
      setAsyncValue(row: number, col: number, request: () => Promise<unknown>): void,
    }).setAsyncValue(0, 0, () => new Promise(() => {}));

    source.selectCell(0, 0, 1, 0);

    const flavors = dispatch(source, 'onCopy');

    expect(flavors[SOURCE_FLAVOR]).not.toContain('old');
    expect(flavors[SOURCE_FLAVOR]).toContain('{"b":2}');
  });
});
