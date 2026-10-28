import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas';
import { FormulaBuilder } from '../formulaBuilder';

type CoreModule = typeof import('hyperformula-ui');

// eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
const core = require('hyperformula-ui') as CoreModule;

const POPUP_PORTAL_SELECTOR = '.hfe-popup-portal';
const LIVE_REGION_SELECTOR = '.hfe-live-region';

/**
 * Counts the body-level nodes `hyperformula-ui` mounts per builder.
 *
 * @returns {{ portals: number, liveRegions: number }}
 */
function countBodyNodes() {
  return {
    portals: document.querySelectorAll(POPUP_PORTAL_SELECTOR).length,
    liveRegions: document.querySelectorAll(LIVE_REGION_SELECTOR).length,
  };
}

/**
 * A real grid with the real engine and the real `hyperformula-ui` module: the Formulas plugin owns
 * the engine it builds from the `HyperFormula` class, and tears it down before every later plugin.
 * The builder has to be gone by then, or its teardown runs against a destroyed engine.
 */
describe('FormulaBuilder teardown on a real grid', () => {
  let container: HTMLDivElement;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(FormulaBuilder);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  /**
   * Builds a grid whose Formulas plugin owns its engine.
   *
   * @returns {Handsontable}
   */
  function createGrid(): Handsontable {
    return new Handsontable(container, {
      data: [[1, 2, '=A1+B1']],
      editor: 'formula',
      formulas: { engine: HyperFormula },
      formulaBuilder: { builder: core },
      licenseKey: 'non-commercial-and-evaluation',
    } as Handsontable.GridSettings);
  }

  it('destroys the grid without throwing, fires `afterDestroy`, and removes the builder\'s body nodes', () => {
    const before = countBodyNodes();
    const hot = createGrid();

    expect(hot.getPlugin('formulaBuilder').enabled).toBe(true);
    expect(countBodyNodes()).toEqual({ portals: before.portals + 1, liveRegions: before.liveRegions + 1 });

    const afterDestroy = jest.fn();

    hot.addHook('afterDestroy', afterDestroy);

    expect(() => hot.destroy()).not.toThrow();
    expect(afterDestroy).toHaveBeenCalledTimes(1);
    expect(countBodyNodes()).toEqual(before);
  });

  it('turns the Formulas plugin off without throwing and removes the builder\'s body nodes', () => {
    const before = countBodyNodes();
    const hot = createGrid();

    expect(() => hot.updateSettings({ formulas: false } as Handsontable.GridSettings)).not.toThrow();
    expect(hot.getPlugin('formulaBuilder').enabled).toBe(false);
    expect(countBodyNodes()).toEqual(before);

    hot.destroy();
  });

  it('takes its error marks off the cells when the plugin is turned off', () => {
    const hot = new Handsontable(container, {
      data: [['=1/0', 2]],
      editor: 'formula',
      formulas: { engine: HyperFormula },
      formulaBuilder: { builder: core },
      licenseKey: 'non-commercial-and-evaluation',
    } as Handsontable.GridSettings);

    expect(hot.getCell(0, 0)?.getAttribute('data-hfe-error')).toBe('#DIV/0!');

    hot.updateSettings({ formulaBuilder: false } as Handsontable.GridSettings);

    // The grid's render resets classes and ARIA attributes but not `data-*`, and it reuses cell
    // elements, so a mark left behind would move to other cells on scroll.
    expect(hot.rootElement.querySelectorAll('[data-hfe-error]')).toHaveLength(0);
    expect(hot.getCell(0, 0)?.hasAttribute('aria-description')).toBe(false);

    hot.destroy();
  });

  it('removes the builder\'s body nodes when only the FormulaBuilder plugin is disabled', () => {
    const before = countBodyNodes();
    const hot = createGrid();

    hot.getPlugin('formulaBuilder').disablePlugin();

    expect(countBodyNodes()).toEqual(before);

    hot.destroy();

    expect(countBodyNodes()).toEqual(before);
  });

  it('rebuilds the builder for a new engine and keeps one set of body nodes', () => {
    const before = countBodyNodes();
    const hot = createGrid();
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot.updateSettings({ formulas: { engine } } as Handsontable.GridSettings);

    expect(hot.getPlugin('formulaBuilder').enabled).toBe(true);
    expect(countBodyNodes()).toEqual({ portals: before.portals + 1, liveRegions: before.liveRegions + 1 });

    hot.destroy();
    engine.destroy();

    expect(countBodyNodes()).toEqual(before);
  });
});
