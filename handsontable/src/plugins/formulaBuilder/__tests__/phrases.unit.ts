import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import deDE from '../../../i18n/languages/de-DE';
import { registerLanguageDictionary } from '../../../i18n/registry';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { FormulaBuilder } from '../formulaBuilder';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

/**
 * The formula editor speaks the grid's language: its accessible names, hints and announcements come
 * from the grid's language dictionary, and follow a language change.
 */
describe('FormulaBuilder phrases', () => {
  let container: HTMLDivElement;
  let hot: Handsontable;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(FormulaBuilder);
    registerLanguageDictionary(deDE);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    container.remove();
  });

  /**
   * Returns the accessible name of the formula bar's address box.
   *
   * @returns {string | null}
   */
  function addressBoxLabel(): string | null {
    return document.querySelector('.hfe-formula-bar__address-input')?.getAttribute('aria-label') ?? null;
  }

  /**
   * Returns the accessible name of the formula bar's idle formula cell.
   *
   * @returns {string | null}
   */
  function formulaInputLabel(): string | null {
    return document.querySelector('.hfe-formula-bar__idle')?.getAttribute('aria-label') ?? null;
  }

  it('names the formula bar in the grid\'s language', () => {
    hot = new Handsontable(container, {
      data: [['=1+1']],
      language: 'de-DE',
      editor: 'formula',
      formulas: { engine: HyperFormula },
      formulaBuilder: { builder: core, showFormulaBar: true },
      licenseKey: 'non-commercial-and-evaluation',
    } as Handsontable.GridSettings);

    expect(addressBoxLabel()).toBe('Zellbezug');
    expect(formulaInputLabel()).toBe('Formeleingabe');
  });

  it('follows a language change', () => {
    hot = new Handsontable(container, {
      data: [['=1+1']],
      language: 'en-US',
      editor: 'formula',
      formulas: { engine: HyperFormula },
      formulaBuilder: { builder: core, showFormulaBar: true },
      licenseKey: 'non-commercial-and-evaluation',
    } as Handsontable.GridSettings);

    expect(addressBoxLabel()).toBe('Cell address');

    hot.updateSettings({ language: 'de-DE' });

    expect(addressBoxLabel()).toBe('Zellbezug');
    expect(formulaInputLabel()).toBe('Formeleingabe');
  });
});
