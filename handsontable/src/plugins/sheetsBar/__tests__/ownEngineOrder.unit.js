import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Returns the content of the engine sheet the grid is bound to.
 *
 * @param {Handsontable} hot The grid.
 * @returns {Array}
 */
function engineSheetOf(hot) {
  const formulas = hot.getPlugin('formulas');

  return formulas.engine.getSheetSerialized(formulas.sheetId);
}

const ROW_DATA = () => [[50, '=A1+1000'], [20, '=A2+1000'], [40, '=A3+1000'], [10, '=A4+1000'], [30, '=A5+1000']];

describe('SheetsBar sheet with an engine of its own, moved or sorted', () => {
  let container;
  let hot;
  let errorSpy;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    errorSpy = jest.spyOn(console, 'error');
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  const build = (calc, extra = {}) => new Handsontable(container, {
    sheetsBar: {
      activeSheet: 1,
      sheets: [
        { name: 'Plain', data: [['p1', 'p2'], ['x', 'y']] },
        calc,
      ],
    },
    licenseKey: TEST_LICENSE_KEY,
    ...extra,
  });
  const roundTrip = () => {
    hot.getPlugin('sheetsBar').setActiveSheet('Plain');
    hot.getPlugin('sheetsBar').setActiveSheet('Calc');
  };
  const engines = {
    'the HyperFormula class': () => ({ engine: HyperFormula }),
    'a built engine without a sheetName': () => ({
      engine: HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' }),
    }),
  };

  Object.entries(engines).forEach(([engineName, formulasOf]) => {
    describe(`with ${engineName}`, () => {
      it('keeps the formulas of a moved column through another sheet', () => {
        hot = build({
          name: 'Calc',
          data: [[1, 2, '=A1+B1'], [3, 4, '=A2+B2']],
          settings: { manualColumnMove: true, formulas: formulasOf() },
        });
        hot.getPlugin('manualColumnMove').moveColumn(0, 2);
        hot.render();

        expect(hot.getData()).toEqual([[2, 3, 1], [4, 7, 3]]);

        const formulasBefore = engineSheetOf(hot);

        roundTrip();

        expect(hot.getData()).toEqual([[2, 3, 1], [4, 7, 3]]);
        expect(engineSheetOf(hot)).toEqual(formulasBefore);
        expect(errorSpy).not.toHaveBeenCalled();
      });

      [
        ['a moved row, then an inserted row', 'manualRowMove', () => {
          hot.getPlugin('manualRowMove').moveRow(4, 0);
          hot.render();
          hot.alter('insert_row_above', 2, 1);
        }],
        ['a moved row, then a removed row', 'manualRowMove', () => {
          hot.getPlugin('manualRowMove').moveRow(4, 0);
          hot.render();
          hot.alter('remove_row', 2, 1);
        }],
        ['a sort, then an inserted row', 'columnSorting', () => {
          hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
          hot.alter('insert_row_above', 2, 1);
        }],
        ['a sort, then a formula edit', 'columnSorting', () => {
          hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
          hot.setDataAtCell(0, 1, '=A2*3');
        }],
        ['a moved row, then a formula edit', 'manualRowMove', () => {
          hot.getPlugin('manualRowMove').moveRow(4, 0);
          hot.render();
          hot.setDataAtCell(0, 1, '=A2*3');
        }],
      ].forEach(([change, plugin, act]) => {
        it(`keeps the values of a sheet after ${change}`, () => {
          hot = build({
            name: 'Calc',
            data: ROW_DATA(),
            settings: { [plugin]: true, formulas: formulasOf() },
          });
          act();

          const before = hot.getData();

          roundTrip();

          expect(hot.getData()).toEqual(before);

          roundTrip();

          expect(hot.getData()).toEqual(before);
          expect(errorSpy).not.toHaveBeenCalled();
        });
      });
    });
  });

  [
    ['shown', () => {}],
    ['hidden', () => hot.getPlugin('sheetsBar').setActiveSheet('Plain')],
  ].forEach(([state, act]) => {
    it(`gives a copy of a ${state} sheet with a moved column the values the original shows`, () => {
      hot = build({
        name: 'Calc',
        data: [[1, 2, '=A1+B1'], [3, 4, '=A2+B2']],
        settings: { manualColumnMove: true, formulas: { engine: HyperFormula } },
      });
      hot.getPlugin('manualColumnMove').moveColumn(0, 2);
      hot.render();
      act();

      const bar = hot.getPlugin('sheetsBar');
      const copy = bar.duplicateSheet(bar.getSheets().find(sheet => sheet.name === 'Calc').id);

      bar.setActiveSheet(copy.id);

      expect(hot.getData()).toEqual([[2, 3, 1], [4, 7, 3]]);

      bar.setActiveSheet('Calc');

      expect(hot.getData()).toEqual([[2, 3, 1], [4, 7, 3]]);
    });
  });

  it('keeps the values of a moved column with the HyperFormula class set on the grid', () => {
    hot = build({
      name: 'Calc',
      data: [[1, 2, '=A1+B1'], [3, 4, '=A2+B2']],
      settings: { manualColumnMove: true },
    }, { formulas: { engine: HyperFormula } });
    hot.getPlugin('manualColumnMove').moveColumn(0, 2);
    hot.render();
    roundTrip();

    expect(hot.getData()).toEqual([[2, 3, 1], [4, 7, 3]]);
  });

  it('keeps a reference to a sheet renamed while the moved sheet is away', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      sheetsBar: {
        activeSheet: 1,
        sheets: [
          { name: 'Prices', data: [[100]], settings: { formulas: { engine, sheetName: 'Prices' } } },
          { name: 'Calc', data: [[1, '=Prices!A1+A1']], settings: { manualColumnMove: true, formulas: { engine } } },
          { name: 'Plain', data: [['x']] },
        ],
      },
      licenseKey: TEST_LICENSE_KEY,
    });

    const bar = hot.getPlugin('sheetsBar');

    hot.getPlugin('manualColumnMove').moveColumn(0, 1);
    hot.render();

    expect(hot.getData()).toEqual([[101, 1]]);

    bar.setActiveSheet('Plain');
    bar.renameSheet(bar.getSheets().find(sheet => sheet.name === 'Prices').id, 'Costs');
    bar.setActiveSheet('Calc');

    expect(hot.getData()).toEqual([[101, 1]]);

    hot.getPlugin('manualColumnMove').moveColumn(1, 0);
    hot.render();

    expect(hot.getData()).toEqual([[1, 101]]);
    expect(hot.getSourceDataAtCell(0, 1)).toBe('=Costs!A1+A1');
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
