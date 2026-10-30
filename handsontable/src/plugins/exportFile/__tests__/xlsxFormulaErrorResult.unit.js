import { HyperFormula } from 'hyperformula';
import plPL from 'hyperformula/commonjs/i18n/languages/plPL';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ExportFile } from '../exportFile';
import { Formulas } from '../../formulas';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';

/**
 * QA round 7 (Q74): a formula whose cached result is an error must reach the workbook snapshot
 * flagged as one, so both writers can type it `t="e"`. The flag comes from HyperFormula's own cell
 * value, never from the display string, so a formula answering the TEXT `#N/A` stays a string.
 */
describe('Xlsx export: the error flag of a cached formula result', () => {
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

  async function exportedFirstRow(settings, exportOptions = { exportFormulas: true }) {
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

  it('should flag `=1/0`, `=NA()` and `=SQRT(-1)` as error results and leave `="#N/A"` unflagged', async() => {
    const row = await exportedFirstRow({ data: [['=1/0', '=NA()', '=SQRT(-1)', '="#N/A"', '=1+1']] });

    expect(row.map(cell => cell.formula)).toEqual([
      { text: '1/0', result: '#DIV/0!', resultIsError: true },
      { text: 'NA()', result: '#N/A', resultIsError: true },
      { text: 'SQRT(-1)', result: '#NUM!', resultIsError: true },
      { text: '"#N/A"', result: '#N/A' },
      { text: '1+1', result: 2 },
    ]);
  });

  it('should cache the OOXML error code, not the translated text, under a HyperFormula language', async() => {
    const row = await exportedFirstRow({
      data: [['=1/0']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1', language: plPL },
    });

    // The grid shows `#DZIEL/0!`; Excel only knows `#DIV/0!`.
    expect(hot.getDataAtCell(0, 0)).toBe('#DZIEL/0!');
    expect(row[0].formula).toEqual({ text: '1/0', result: '#DIV/0!', resultIsError: true });
  });

  it('should leave an error that has no OOXML code unflagged, cached as the text the grid shows', async() => {
    const row = await exportedFirstRow({ data: [['=A1']] });

    expect(row[0].formula).toEqual({ text: 'A1', result: '#CYCLE!' });
  });

  it('should write no formula without `exportFormulas`, and the error value flagged (DEV-3648)', async() => {
    const row = await exportedFirstRow({ data: [['=1/0']] }, {});

    expect(row[0].formula).toBeNull();
    expect(row[0].value).toBe('#DIV/0!');
    // Until DEV-3648 the value went out as the text the grid shows, unflagged.
    expect(row[0].valueIsError).toBe(true);
  });
});
