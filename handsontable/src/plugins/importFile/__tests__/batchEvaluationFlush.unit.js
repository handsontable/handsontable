import { CompressionStream, DecompressionStream } from 'node:stream/web';
import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

// jsdom's window has neither; the xlsx engine's zip code reaches for them.
global.CompressionStream ??= CompressionStream;
global.DecompressionStream ??= DecompressionStream;

/**
 * DEV-202: with `formulas.batchEvaluation: true` a write made while the grid's execution is suspended keeps the
 * HyperFormula engine suspended, and the engine refuses value reads ("Computations are suspended") until it
 * recalculates. The import maps the file's named expressions against the engine's, which reads their values, so
 * `importFile` asks the Formulas plugin to recalculate first. This runs on a real Formulas plugin: `importFile.unit.js`
 * stubs `flushEngineEvaluation()` as a no-op.
 */
describe('ImportFile with formulas.batchEvaluation', () => {
  const containers = [];

  afterEach(() => {
    containers.splice(0).forEach((container) => {
      container.hot?.destroy();
      container.remove();
    });
    jest.restoreAllMocks();
  });

  /**
   * A grid over its own HyperFormula instance (engine sheet `Data`) whose engine defines the constant `TaxRate`.
   *
   * @param {object} [formulas] Extra `formulas` settings.
   * @returns {Handsontable}
   */
  function createGrid(formulas = {}) {
    const container = document.createElement('div');
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      exportFile: true,
      importFile: true,
      formulas: { engine, sheetName: 'Data', ...formulas },
      data: [[1, 2]],
    });

    engine.addNamedExpression('TaxRate', 0.07);
    container.hot = hot;
    containers.push(container);

    return hot;
  }

  /**
   * Exports a grid to xlsx bytes. jsdom's `Blob` has no `arrayBuffer()`, so the blob is read with a `FileReader`.
   *
   * @param {Handsontable} hot The grid.
   * @returns {Promise<ArrayBuffer>}
   */
  async function exportBytes(hot) {
    const blob = await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true });

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(blob);
    });
  }

  it('compares the file\'s constant named expression with the engine\'s while a write holds the engine', async() => {
    const bytes = await exportBytes(createGrid());
    const hot = createGrid({ batchEvaluation: true });
    const { engine } = hot.getPlugin('formulas');
    let suspendedBeforeImport = false;
    let result;

    // Each render of a suspended execution recalculates the engine, so the render is suspended as well.
    hot.suspendRender();
    hot.suspendExecution();

    try {
      hot.setDataAtCell(0, 0, 5);
      suspendedBeforeImport = engine.isEvaluationSuspended();

      result = await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', bytes, { apply: false });
    } finally {
      hot.resumeExecution();
      hot.resumeRender();
    }

    expect(suspendedBeforeImport).toBe(true);
    // The engine already defines `TaxRate` as the file does, so nothing is registered again.
    expect(result.namedExpressions).toBeUndefined();
    expect(result.data).toEqual([['1', '2']]);
    expect(engine.isEvaluationSuspended()).toBe(false);
    expect(hot.getDataAtCell(0, 0)).toBe(5);
  });
});
