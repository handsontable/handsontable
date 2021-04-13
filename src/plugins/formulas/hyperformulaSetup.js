import { HyperFormula } from 'hyperformula';
import staticRegister from '../../utils/staticRegister';

/**
 * Registers HyperFormula as a global entity and applies hooks allowing a multi-sheet setup.
 *
 * @returns {HyperFormula} The HyperFormula instance.
 */
export function registerHF() {
  if (!staticRegister('formulas').hasItem('hyperformula')) {
    staticRegister('formulas').register('hyperformula', HyperFormula.buildEmpty({}));
  }

  const hfInstance = staticRegister('formulas').getItem('hyperformula');

  hfInstance.on('sheetAdded', () => {
    hfInstance.rebuildAndRecalculate();
  });

  hfInstance.on('sheetRemoved', () => {
    hfInstance.rebuildAndRecalculate();
  });

  return hfInstance;
}
