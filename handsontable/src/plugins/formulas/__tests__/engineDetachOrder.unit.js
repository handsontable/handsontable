import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Formulas engine-detach listeners on disable', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('runs them before the HYPERLINK cleanup, so a render they cause leaves no anchor behind', () => {
    hot = new Handsontable(container, {
      data: [['=HYPERLINK("https://example.com", "site")', 1]],
      formulas: { engine: HyperFormula, hyperlinks: true },
      licenseKey: LICENSE_KEY,
    });

    const formulas = hot.getPlugin('formulas');

    expect(hot.getCell(0, 0).querySelector('a.ht-hyperlink')).not.toBeNull();

    // The FormulaBuilder plugin's listener cancels an open edit there, and the cancel renders.
    formulas.addEngineDetachListener(() => {
      hot.render();
    });
    formulas.disablePlugin();

    expect(hot.getCell(0, 0).querySelector('a.ht-hyperlink')).toBeNull();
  });
});
