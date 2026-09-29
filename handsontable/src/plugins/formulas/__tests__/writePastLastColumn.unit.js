import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';

/**
 * DEV-2723: `afterSetDataAtCell` runs before the change is applied, so a write past the last
 * column on array data addresses a column `propToCol()` does not know yet. The formula must still
 * reach the engine, or the cell shows its raw text.
 */
describe('Formulas – a write past the last column', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Formulas);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [['1', '2', '3'], ['4', '5', '6']],
      formulas: { engine: HyperFormula },
      licenseKey: 'non-commercial-and-evaluation',
      renderAllColumns: true,
      renderAllRows: true,
    });
    hot.render();
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should evaluate a formula written into the column it creates', () => {
    hot.setDataAtCell(0, 3, '=A1+B1');

    expect(hot.countCols()).toBe(4);
    expect(hot.getDataAtCell(0, 3)).toBe(3);
    expect(hot.getSourceDataAtCell(0, 3)).toBe('=A1+B1');
  });

  it('should leave the existing columns as they were', () => {
    hot.setDataAtCell(0, 3, '=A1+B1');

    expect(hot.getDataAtRow(0).slice(0, 3)).toEqual(['1', '2', '3']);
    expect(hot.getDataAtRow(1)).toEqual(['4', '5', '6', null]);
  });
});
