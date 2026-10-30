import { HyperFormula } from 'hyperformula';
import plPL from 'hyperformula/commonjs/i18n/languages/plPL';
import { registerCellType, NumericCellType } from 'handsontable/cellTypes';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ExportFile } from '../exportFile';
import { Formulas } from '../../formulas';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';

/**
 * DEV-3648: a cell whose engine value is an error exports as an Excel error (`t="e"`) whenever the
 * Formulas plugin is on, whether the error was typed (`#N/A`) or computed by a formula exported as
 * its value (no `exportFormulas`). The code comes from the engine's value, never from the display
 * text, and an error with no OOXML code (`#CYCLE!`) stays text.
 */
describe('Xlsx export: a plain cell holding an error value', () => {
  let container;
  let hot;
  let writeSpy;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(ExportFile);
    registerCellType(NumericCellType);
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

  async function exportedFirstRow(settings, exportOptions = {}) {
    hot = new Handsontable(container, {
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', exportOptions);

    const [snapshot] = writeSpy.mock.calls[0];

    return snapshot.sheets[0].rows[0];
  }

  it('should flag a typed error and a computed error, and leave `#CYCLE!` and text unflagged', async() => {
    const row = await exportedFirstRow({ data: [['#N/A', '=1/0', '#CYCLE!', 'text']] });

    expect(row.map(c => [c.value, c.valueIsError])).toEqual([
      ['#N/A', true], ['#DIV/0!', true], ['#CYCLE!', undefined], ['text', undefined],
    ]);
    expect(row.map(c => c.formula)).toEqual([null, null, null, null]);
  });

  it('should export a typed error as a plain string without the Formulas plugin', async() => {
    const row = await exportedFirstRow({ data: [['#N/A', '#DIV/0!']], formulas: undefined });

    expect(row.map(c => [c.value, c.valueIsError])).toEqual([['#N/A', undefined], ['#DIV/0!', undefined]]);
  });

  it('should export the OOXML code, not the translated text, under a HyperFormula language', async() => {
    const row = await exportedFirstRow({
      data: [['=1/0']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1', language: plPL },
    });

    // The grid shows `#DZIEL/0!`; Excel only knows `#DIV/0!`.
    expect(hot.getDataAtCell(0, 0)).toBe('#DZIEL/0!');
    expect([row[0].value, row[0].valueIsError]).toEqual(['#DIV/0!', true]);
  });

  it('should flag a typed error with `exportFormulas` and keep the formula path for a formula cell', async() => {
    const row = await exportedFirstRow({ data: [['#N/A', '=1/0']] }, { exportFormulas: true });

    expect([row[0].value, row[0].valueIsError, row[0].formula]).toEqual(['#N/A', true, null]);
    expect(row[1].value).toBeNull();
    expect(row[1].valueIsError).toBeUndefined();
    expect(row[1].formula).toEqual({ text: '1/0', result: '#DIV/0!', resultIsError: true });
  });

  it('should flag an error in a numeric column instead of writing it as text', async() => {
    const row = await exportedFirstRow({
      data: [['#N/A', '=1/0']],
      columns: [{ type: 'numeric' }, { type: 'numeric' }],
    });

    expect(row.map(c => [c.value, c.valueIsError, c.numFmt])).toEqual([
      ['#N/A', true, null], ['#DIV/0!', true, null],
    ]);
  });
});
