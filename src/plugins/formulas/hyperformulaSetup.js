import staticRegister from '../../utils/staticRegister';
import hyperformulaDefaultSettings from './hfDefaultSettings';

/**
 * Registers HyperFormula as a global entity and applies hooks allowing a multi-sheet setup.
 *
 * @param {HyperFormula} HFClass HyperFormula class.
 * @param {string} hotId Handsontable guid.
 * @returns {HyperFormula} The HyperFormula instance.
 */
export function registerHF(HFClass, hotId) {
  if (!staticRegister('formulas').hasItem('hyperformulaInstances')) {
    staticRegister('formulas').register('hyperformulaInstances', new Map());
  }

  const hfInstances = staticRegister('formulas').getItem('hyperformulaInstances');
  const hfInstance = HFClass.buildEmpty(hyperformulaDefaultSettings);

  hfInstances.set(hfInstance, [hotId]);

  hfInstance.on('sheetAdded', () => {
    hfInstance.rebuildAndRecalculate();
  });

  hfInstance.on('sheetRemoved', () => {
    hfInstance.rebuildAndRecalculate();
  });

  return hfInstance;
}
