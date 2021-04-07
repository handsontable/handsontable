import { HyperFormula } from 'hyperformula';
import staticRegister from '../../utils/staticRegister';

/**
 * Registers HyperFormula as a global entity and applies hooks allowing a multi-sheet setup.
 */
export function registerHF() {
  staticRegister('formulas').register('hyperformula', HyperFormula.buildEmpty({
    licenseKey: 'non-commercial-and-evaluation' // TODO
  }));

  const hfInstance = staticRegister('formulas').getItem('hyperformula');

  hfInstance.on('sheetAdded', () => {
    hfInstance.rebuildAndRecalculate();
  });

  hfInstance.on('sheetRemoved', () => {
    hfInstance.rebuildAndRecalculate();
  });
}
