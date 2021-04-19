import staticRegister from '../../utils/staticRegister';
import hyperformulaDefaultSettings from './hfDefaultSettings';

/**
 * Registers HyperFormula as a global entity and applies hooks allowing a multi-sheet setup.
 *
 * @param {object} pluginSettings Plugin settings.
 * @param {string} hotId Handsontable guid.
 * @returns {HyperFormula} The HyperFormula instance.
 */
export function registerHF(pluginSettings, hotId) {
  const HFClass = pluginSettings.hyperformula;

  if (!staticRegister('formulas').hasItem('hyperformulaInstances')) {
    staticRegister('formulas').register('hyperformulaInstances', new Map());
  }

  const hfRegistry = staticRegister('formulas').getItem('hyperformulaInstances');

  // Register custom functions
  if (pluginSettings.functions) {
    pluginSettings.functions.forEach((func) => {
      const {
        name,
        plugin,
        translations
      } = func;

      HFClass.registerFunction(name, plugin, translations);
    });
  }

  // Register languages
  if (pluginSettings.language) {
    const {
      code,
      language
    } = pluginSettings.language;

    HFClass.registerLanguage(code, language);
  }

  // Create instance
  const hfInstance = HFClass.buildEmpty(hyperformulaDefaultSettings);

  // Add it to global registry
  hfRegistry.set(hfInstance, [hotId]);

  // Register named expressions
  if (pluginSettings.namedExpressions) {
    hfInstance.suspendEvaluation();
    pluginSettings.namedExpressions.forEach((namedExpression) => {
      const {
        name,
        expression,
        scope,
        options
      } = namedExpression;
      hfInstance.addNamedExpression(name, expression, scope, options);
    });
    hfInstance.resumeEvaluation();
  }

  // Add hooks needed for cross-referencing sheets
  hfInstance.on('sheetAdded', () => {
    hfInstance.rebuildAndRecalculate();
  });

  hfInstance.on('sheetRemoved', () => {
    hfInstance.rebuildAndRecalculate();
  });

  return hfInstance;
}
