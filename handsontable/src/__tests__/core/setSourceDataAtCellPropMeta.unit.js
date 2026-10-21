import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

describe('setSourceDataAtCell with a prop name', () => {
  let grids = [];

  afterEach(() => {
    grids.forEach(({ hot, container }) => {
      hot.destroy();
      container.remove();
    });
    grids = [];
  });

  const create = (settings) => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: [{ id: 1, name: 'ok' }, { id: 2, name: 'ok' }],
      autoRowSize: false,
      autoColumnSize: false,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    grids.push({ hot, container });

    return { hot, container };
  };

  it('should apply the column-level `sourceDataValidator`', () => {
    const grid = create({
      columns: [{ data: 'id' }, { data: 'name', sourceDataValidator: v => v !== 'bad', allowInvalid: false }],
    });

    grid.hot.setSourceDataAtCell(0, 'name', 'bad');
    grid.hot.setSourceDataAtCell(0, 'id', 'bad');

    expect(grid.hot.getSourceDataAtCell(0, 'name')).toBe('ok');
    expect(grid.hot.getSourceDataAtCell(0, 'id')).toBe('bad');
  });

  it('should apply the column-level `valueSetter`', () => {
    const grid = create({
      columns: [{ data: 'id' }, { data: 'name', valueSetter: v => `set:${v}` }],
    });

    grid.hot.setSourceDataAtCell([[0, 'name', 'x'], [1, 'id', 'y']]);

    expect(grid.hot.getSourceDataAtCell(0, 'name')).toBe('set:x');
    expect(grid.hot.getSourceDataAtCell(1, 'id')).toBe('y');
  });

  it('should resolve the column of a prop in a reordered grid', () => {
    const grid = create({
      columns: [{ data: 'id' }, { data: 'name', valueSetter: v => `set:${v}` }],
      manualColumnMove: [1, 0],
    });

    grid.hot.setSourceDataAtCell(0, 'name', 'x');

    expect(grid.hot.getSourceDataAtCell(0, 'name')).toBe('set:x');
  });

  it('should resolve the column of a prop in a grid with a hidden column', () => {
    const grid = create({
      columns: [{ data: 'id', valueSetter: v => `set:${v}` }, { data: 'name' }],
      hiddenColumns: { columns: [0] },
    });

    grid.hot.setSourceDataAtCell(0, 'id', 'x');

    expect(grid.hot.getSourceDataAtCell(0, 'id')).toBe('set:x');
  });

  it('should resolve the column of a prop when `columns` is a function', () => {
    const grid = create({
      columns: index => (index === 0 ? { data: 'id' } : { data: 'name', valueSetter: v => `set:${v}` }),
    });

    grid.hot.setSourceDataAtCell(0, 'name', 'x');

    expect(grid.hot.getSourceDataAtCell(0, 'name')).toBe('set:x');
  });

  it('should fall back to the table meta for a prop that names no column', () => {
    const grid = create({
      columns: [{ data: 'id' }, { data: 'name' }],
      valueSetter: v => `table:${v}`,
    });

    grid.hot.setSourceDataAtCell(0, 'other', 'x');

    expect(grid.hot.getSourceDataAtCell(0, 'other')).toBe('table:x');
  });

  it('should pass the value stored by the column-level `valueSetter` to `afterSetSourceDataAtCell`', () => {
    const afterSetSourceDataAtCell = jest.fn();
    const grid = create({
      columns: [{ data: 'id' }, { data: 'name', valueSetter: v => `set:${v}` }],
      afterSetSourceDataAtCell,
    });

    grid.hot.setSourceDataAtCell(0, 'name', 'x');

    expect(afterSetSourceDataAtCell.mock.calls[0][0]).toEqual([[0, 'name', 'ok', 'set:x']]);
  });

  it('should keep applying the column-level `valueSetter` to a numeric column index', () => {
    const grid = create({
      data: [['a', 'b']],
      columns: [{}, { valueSetter: v => `set:${v}` }],
    });

    grid.hot.setSourceDataAtCell(0, 1, 'x');

    expect(grid.hot.getSourceDataAtCell(0, 1)).toBe('set:x');
  });

  it('should resolve the column meta of a prop written to a trimmed row', () => {
    const data = [{ id: 1, name: 'ok' }, { id: 2, name: 'ok' }];
    // Throws for a row that has no visual index, as a `cells` callback reading `data[row]` would.
    const cells = row => ({ className: `id-${data[row].id}` });
    const grid = create({
      data,
      columns: [{ data: 'id' }, { data: 'name', valueSetter: v => `set:${v}` }],
      trimRows: [0],
      cells,
    });

    expect(() => grid.hot.setSourceDataAtCell(0, 'name', 'x')).not.toThrow();
    expect(data[0].name).toBe('set:x');
  });

  it('should not re-enter a get-meta hook that writes the same prop', () => {
    let writes = 0;
    const grid = create({
      columns: [{ data: 'id' }, { data: 'name' }],
      afterGetCellMeta(row, col) {
        // Writes only while the value differs, so it needs to see its own write to stop.
        if (col === 1 && writes < 200 && this.getSourceDataAtCell(row, 'name') !== 'final') {
          writes += 1;
          this.setSourceDataAtCell(row, 'name', 'final');
        }
      },
    });

    writes = 0;
    grid.hot.setSourceDataAtCell(0, 'name', 'x');

    expect(grid.hot.getSourceDataAtCell(0, 'name')).toBe('final');
    expect(writes).toBeLessThan(5);
  });

  it('should apply the column-level `valueSetter` to a nested prop', () => {
    const grid = create({
      data: [{ a: { b: 'old' } }],
      columns: [{ data: 'a.b', valueSetter: v => `set:${v}` }],
    });

    grid.hot.setSourceDataAtCell(0, 'a.b', 'x');

    expect(grid.hot.getSourceDataAtCell(0, 'a.b')).toBe('set:x');
  });
});
