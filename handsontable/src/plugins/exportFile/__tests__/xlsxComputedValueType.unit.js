import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ExportFile } from '../exportFile';
import { Formulas } from '../../formulas';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';

/**
 * DEV-3648: a value the Formulas engine computed keeps the engine's type in the file. A text
 * column (the default type) used to stringify it, so the cells a `SEQUENCE` spills were written as
 * the text `"2"` and `"3"`, and a reader that takes the cached values without recalculating (Apple
 * Numbers, a library) summed `=SUM(A1:A3)` over them as 1. A value the user typed into a text
 * column is data, and stays text.
 */
describe('Xlsx export: the type of a value the Formulas engine computed', () => {
  let container;
  let hot;
  let writeSpy;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(ExportFile);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // The snapshot is what this suite is about, so the write itself is not run.
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    writeSpy.mockRestore();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  async function exportedRows(settings, exportOptions = {}, withFormulas = true) {
    hot = new Handsontable(container, {
      ...(withFormulas ? { formulas: { engine: HyperFormula, sheetName: 'Sheet1' } } : {}),
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', exportOptions);

    const [snapshot] = writeSpy.mock.calls[0];

    return snapshot.sheets[0].rows;
  }

  it('should write the spilled cells of an array formula as numbers, with `exportFormulas`', async() => {
    const rows = await exportedRows({ data: [['=SEQUENCE(3)', '=SUM(A1:A3)'], [null, null], [null, null]] }, {
      exportFormulas: true,
    });

    expect(rows[0][0].formula).toEqual(expect.objectContaining({ text: 'SEQUENCE(3)', result: 1 }));
    expect(rows[1][0].value).toBe(2);
    expect(rows[2][0].value).toBe(3);
    expect(rows[0][1].formula).toEqual({ text: 'SUM(A1:A3)', result: 6 });
  });

  it('should write every computed number and boolean with its type, without `exportFormulas`', async() => {
    const rows = await exportedRows({ data: [['=SEQUENCE(2)', '=1+1', '=1>0', '="text"'], [null, null, null, null]] });

    expect(rows[0].map(cell => cell.value)).toEqual([1, 2, true, 'text']);
    expect(rows[1][0].value).toBe(2);
  });

  it('should keep a value typed into a text column as text', async() => {
    const rows = await exportedRows({ data: [['007', '42', 'TRUE', '=A1']] });

    // The typed cells are the user's data. `=A1` is computed: HyperFormula reads the text `007` as
    // the number 7, and the grid shows 7, so the file gets the number.
    expect(rows[0].map(cell => cell.value)).toEqual(['007', '42', 'TRUE', 7]);
  });

  it('should stringify as before without the Formulas plugin', async() => {
    const rows = await exportedRows({ data: [[2, '=1+1']] }, {}, false);

    expect(rows[0].map(cell => cell.value)).toEqual(['2', '=1+1']);
  });
});
