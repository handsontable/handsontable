import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../index';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';

/**
 * DEV-3648: a HyperFormula formula whose result spills (`=SEQUENCE(3)`) is exported as an Excel
 * dynamic array, `=ARRAYFORMULA(…)` as a legacy (CSE) array, and a call to a function Excel
 * evaluates as a dynamic array (`IFS`, `SWITCH`) as a one-cell dynamic array, so Excel opens none of
 * them with the implicit-intersection `@`. The `ref` is the spill range in exported sheet
 * coordinates; a spill that the export cuts (an excluded row or column, the `range` edge) is written
 * as a plain formula and reported as `formula:arrayExcluded`.
 */
describe('Xlsx export: array formulas', () => {
  let container;
  let hot;
  let writeSpy;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    writeSpy.mockRestore();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  const createData = () => [
    ['=SEQUENCE(3)', '=ARRAYFORMULA(A1:A3*2)', '=IFS(A1>0,"p",A1<=0,"n")', '=XLOOKUP(1,A1:A3,A1:A3)', '=A1+1'],
    [],
    [],
  ];

  async function exportSheet(settings, exportOptions = {}) {
    hot = new Handsontable(container, {
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true, ...exportOptions });

    const [snapshot, , dropped] = writeSpy.mock.calls[0];

    return { rows: snapshot.sheets[0].rows, dropped: dropped.list() };
  }

  it('should rely on HyperFormula typing a spilling master `ARRAYFORMULA` and its spilled cells `ARRAY`', () => {
    const hf = HyperFormula.buildFromArray([
      ['=SEQUENCE(3)', '=ARRAYFORMULA(A1:A3*2)', '=IFS(A1>0,"p",A1<=0,"n")', '=A1+1'],
    ], { licenseKey: 'gpl-v3' });
    const typeAt = (row, col) => hf.getCellType({ sheet: 0, row, col });

    expect([typeAt(0, 0), typeAt(0, 1), typeAt(0, 2), typeAt(0, 3)])
      .toEqual(['ARRAYFORMULA', 'ARRAYFORMULA', 'FORMULA', 'FORMULA']);
    expect([typeAt(1, 0), typeAt(2, 0), typeAt(1, 1), typeAt(2, 1)]).toEqual(['ARRAY', 'ARRAY', 'ARRAY', 'ARRAY']);

    hf.destroy();
  });

  it('should write a spilling formula as a dynamic array, ARRAYFORMULA as a CSE array and IFS as a one-cell dynamic array', async() => {
    const { rows, dropped } = await exportSheet({ data: createData() });

    expect(rows[0][0].formula).toEqual({ text: 'SEQUENCE(3)', result: 1, array: { ref: 'A1:A3', dynamic: true } });
    expect(rows[0][1].formula).toEqual({ text: 'A1:A3*2', result: 2, array: { ref: 'B1:B3', dynamic: false } });
    expect(rows[0][2].formula).toEqual({
      text: 'IFS(A1>0,"p",A1<=0,"n")', result: 'p', array: { ref: 'C1', dynamic: true },
    });
    expect(rows[0][3].formula).toEqual({ text: 'XLOOKUP(1,A1:A3,A1:A3)', result: 1 });
    expect(rows[0][4].formula).toEqual({ text: 'A1+1', result: 2 });
    expect(dropped).toEqual([]);
  });

  it('should export the spilled cells as plain values', async() => {
    const { rows } = await exportSheet({ data: createData() });

    // A text column writes its display value, as it does for any non-formula cell.
    expect(rows[1][0]).toMatchObject({ value: '2', formula: null });
    expect(rows[2][0]).toMatchObject({ value: '3', formula: null });
    expect(rows[1][1]).toMatchObject({ value: '4', formula: null });
    expect(rows[2][1]).toMatchObject({ value: '6', formula: null });
  });

  it('should stop a spill at the next array formula on its right', async() => {
    const { rows } = await exportSheet({ data: [['=SEQUENCE(2)', '=SEQUENCE(2)'], []] });

    expect(rows[0][0].formula.array).toEqual({ ref: 'A1:A2', dynamic: true });
    expect(rows[0][1].formula.array).toEqual({ ref: 'B1:B2', dynamic: true });
  });

  it('should write the ref of a two-dimensional spill', async() => {
    const { rows } = await exportSheet({ data: [['=SEQUENCE(2,3)', null, null], [], [null, null, '=1']] });

    expect(rows[0][0].formula.array).toEqual({ ref: 'A1:C2', dynamic: true });
  });

  it('should size staggered neighboring spills exactly', async() => {
    // B1 spills into B2:B3, right of the master in A2: a walk over the `ARRAY` cells would size A2
    // as 2x2 and write a ref overlapping B1's.
    const { rows, dropped } = await exportSheet({ data: [[null, '=SEQUENCE(3)'], ['=SEQUENCE(2)', null], []] });

    expect(rows[0][1].formula.array).toEqual({ ref: 'B1:B3', dynamic: true });
    expect(rows[1][0].formula.array).toEqual({ ref: 'A2:A3', dynamic: true });
    expect(dropped).toEqual([]);
  });

  it('should refuse an array ref that overlaps an earlier one when the engine has no array mapping', async() => {
    hot = new Handsontable(container, {
      data: [[null, '=SEQUENCE(3)'], ['=SEQUENCE(2)', null], []],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    // The mapping is internal to HyperFormula; without it the size comes from the walk, which
    // over-counts A2 as 2x2 here.
    Object.defineProperty(hot.getPlugin('formulas').engine, 'arrayMapping', { value: undefined, configurable: true });

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true });

    const [snapshot, , dropped] = writeSpy.mock.calls[0];
    const { rows } = snapshot.sheets[0];

    expect(rows[0][1].formula.array).toEqual({ ref: 'B1:B3', dynamic: true });
    expect(rows[1][0].formula).toEqual({ text: 'SEQUENCE(2)', result: 1 });
    expect(dropped.list()).toEqual(['formula:arrayExcluded']);
  });

  it('should write the master of a blocked spill as a one-cell dynamic array caching the `#SPILL!` text', async() => {
    const { rows, dropped } = await exportSheet({ data: [['=SEQUENCE(1,3)', null, 'x']] });

    expect(hot.getDataAtCell(0, 0)).toBe('#SPILL!');
    expect(rows[0][0].formula).toEqual({
      text: 'SEQUENCE(1,3)', result: '#SPILL!', array: { ref: 'A1', dynamic: true },
    });
    expect(dropped).toEqual([]);
  });

  it('should write the file the grid shows after a sort', async() => {
    // HyperFormula refuses to move rows holding an array, so the spill stays on the rows it was on.
    const { rows } = await exportSheet({
      data: [['=SEQUENCE(3)', 'b'], [null, 'c'], [null, 'a']],
      columnSorting: true,
    }, {});

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 3]);
    expect(rows[0][0].formula).toEqual({ text: 'SEQUENCE(3)', result: 1, array: { ref: 'A1:A3', dynamic: true } });
    expect(rows.map(row => row[0].value)).toEqual([null, '2', '3']);
  });

  it('should move the ref with its spill when another column is moved in front of it', async() => {
    hot = new Handsontable(container, {
      data: [['=SEQUENCE(2,2)', null, 'x'], [null, null, 'y']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      manualColumnMove: true,
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    hot.getPlugin('manualColumnMove').moveColumn(2, 0);
    hot.render();

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true });

    const [snapshot] = writeSpy.mock.calls[0];
    const { rows } = snapshot.sheets[0];

    expect(hot.getData()).toEqual([['x', 1, 2], ['y', 3, 4]]);
    expect(rows[0][1].formula).toEqual({ text: 'SEQUENCE(2,2)', result: 1, array: { ref: 'B1:C2', dynamic: true } });
    expect(rows[0][0].formula).toBeNull();
  });

  it('should shift the ref by the column header row and the row header column', async() => {
    const { rows } = await exportSheet(
      { data: createData(), colHeaders: true, rowHeaders: true },
      { colHeaders: true, rowHeaders: true },
    );

    // rows[0] is the column header row, and the first cell of a data row is its row header.
    expect(rows[1][1].formula).toEqual({ text: 'SEQUENCE(3)', result: 1, array: { ref: 'B2:B4', dynamic: true } });
    expect(rows[1][2].formula.array).toEqual({ ref: 'C2:C4', dynamic: false });
    expect(rows[1][3].formula.array).toEqual({ ref: 'D2', dynamic: true });
  });

  it('should write no array and report it once when an excluded hidden row cuts the spill', async() => {
    const { rows, dropped } = await exportSheet({
      data: createData(),
      hiddenRows: { rows: [1] },
    }, { exportHiddenRows: false });

    expect(rows[0][0].formula).toEqual({ text: 'SEQUENCE(3)', result: 1 });
    // The CSE wrapper still goes: Excel has no ARRAYFORMULA function.
    expect(rows[0][1].formula).toEqual({ text: 'A1:A2*2', result: 2 });
    // A one-cell array is not cut.
    expect(rows[0][2].formula.array).toEqual({ ref: 'C1', dynamic: true });
    expect(dropped).toEqual(['formula:arrayExcluded']);
    expect(writeSpy.mock.calls[0][2].count('formula:arrayExcluded')).toBe(1);
  });

  it('should keep the array when the hidden rows are exported', async() => {
    const { rows, dropped } = await exportSheet({
      data: createData(),
      hiddenRows: { rows: [1] },
    }, { exportHiddenRows: 'hide' });

    expect(rows[0][0].formula.array).toEqual({ ref: 'A1:A3', dynamic: true });
    expect(dropped).toEqual([]);
  });

  it('should write no array when an excluded hidden column cuts the spill', async() => {
    const { rows, dropped } = await exportSheet({
      data: [['=SEQUENCE(1,3)', null, null]],
      hiddenColumns: { columns: [1] },
    }, { exportHiddenColumns: false });

    expect(rows[0][0].formula).toEqual({ text: 'SEQUENCE(1,3)', result: 1 });
    expect(dropped).toEqual(['formula:arrayExcluded']);
  });

  it('should write no array when the spill crosses the edge of the exported range', async() => {
    const { rows, dropped } = await exportSheet({ data: createData() }, { range: [0, 0, 1, 4] });

    expect(rows[0][0].formula).toEqual({ text: 'SEQUENCE(3)', result: 1 });
    expect(dropped).toEqual(['formula:arrayExcluded']);
  });

  it('should write a CSE array on the cell itself and no spill without the Formulas plugin', async() => {
    const { rows } = await exportSheet({ data: createData(), formulas: undefined });

    expect(rows[0][0].formula).toEqual({ text: 'SEQUENCE(3)', result: '=SEQUENCE(3)' });
    expect(rows[0][1].formula).toEqual({
      text: 'A1:A3*2', result: '=ARRAYFORMULA(A1:A3*2)', array: { ref: 'B1', dynamic: false },
    });
    expect(rows[0][2].formula.array).toEqual({ ref: 'C1', dynamic: true });
    expect(rows[0][4].formula).toEqual({ text: 'A1+1', result: '=A1+1' });
  });

  it('should write no array without `exportFormulas`', async() => {
    const { rows } = await exportSheet({ data: createData() }, { exportFormulas: false });

    expect(rows[0][0]).toMatchObject({ value: '1', formula: null });
  });
});
