import HyperFormula from 'hyperformula';

describe('SheetsBar sheet name matching on a host whose locale tailors lower case', () => {
  let container;
  let hot;
  let Handsontable;

  beforeEach(() => {
    const original = String.prototype.toLocaleLowerCase;

    jest.spyOn(String.prototype, 'toLocaleLowerCase').mockImplementation(function(locale) {
      return locale === undefined ? original.call(this.replace(/I/g, 'ı'), 'tr') : original.call(this, locale);
    });
    jest.isolateModules(() => {
      Handsontable = jest.requireActual('../../../index').default;
    });
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  it('renames a reference that writes the sheet name in another case, as the engine reads it', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const report = [['=ITEMS!A1']];
    const bound = (name, data) => ({ name, data, settings: { formulas: { engine, sheetName: name } } });

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [bound('Report', report), bound('items', [[7]])] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const bar = hot.getPlugin('sheetsBar');

    bar.renameSheet(bar.getSheets().find(sheet => sheet.name === 'items').id, 'Stock');

    expect(report[0][0]).toBe('=Stock!A1');
    expect(hot.getDataAtCell(0, 0)).toBe(7);
  });
});
