import staticRegister from '../../../utils/staticRegister';
import { isUndefined } from '../../../helpers/mixed';
import { error } from '../../../helpers/console';
import { PLUGIN_KEY } from '../formulas';
import { mergeEngineSettings } from './settings';

/**
 * Setups the engine instance. It either creates a new (possibly shared) engine instance, or attaches
 * the plugin to an already-existing instance.
 *
 * @param {object} pluginSettings Object containing the plugin settings.
 * @param {object} additionalSettings Object containing additional settings, overwriting the others.
 * @param {string} hotId Handsontable guid.
 * @returns {null|object} Returns the engine instance if everything worked right and `null` otherwise.
 */
export function setupEngine(pluginSettings, additionalSettings, hotId) {
  const engineConfigItem = pluginSettings.engine;

  if (isUndefined(engineConfigItem)) {
    error('Missing the required `engine` key in the Formulas settings. Please fill it with either an' +
      ' engine class or an engine instance.');

    return null;
  }

  // `engine.hyperformula` or `engine` is the engine class
  if (typeof engineConfigItem.hyperformula === 'function' || typeof engineConfigItem === 'function') {
    return registerEngine(
      engineConfigItem.hyperformula || engineConfigItem,
      pluginSettings,
      mergeEngineSettings(
        engineConfigItem.hyperformula ? engineConfigItem : {},
        additionalSettings
      ),
      hotId);

    // `engine` is the engine instance
  } else if (typeof engineConfigItem === 'object' && isUndefined(engineConfigItem.hyperformula)) {
    const engineRegistry = staticRegister(PLUGIN_KEY).getItem('engine');
    const sharedEngineUsage = engineRegistry ? engineRegistry.get(engineConfigItem) : null;

    if (sharedEngineUsage) {
      sharedEngineUsage.push(hotId);
    }

    return engineConfigItem;
  }

  return null;
}

/**
 * Registers the engine in the global register and attaches the needed event listeners.
 *
 * @param {Function} engineClass The engine class.
 * @param {object} pluginSettings The Formulas plugin settings.
 * @param {object} engineSettings The engine settings (will be passed the the engine).
 * @param {string} hotId Handsontable guid.
 * @returns {object} Returns the engine instance.
 */
export function registerEngine(engineClass, pluginSettings, engineSettings, hotId) {
  if (!staticRegister(PLUGIN_KEY).hasItem('engine')) {
    staticRegister(PLUGIN_KEY).register('engine', new Map());
  }

  const engineRegistry = staticRegister(PLUGIN_KEY).getItem('engine');

  registerCustomFunctions(engineClass, pluginSettings.functions);

  registerLanguage(engineClass, pluginSettings.language);

  // Create instance
  const engineInstance = engineClass.buildEmpty(engineSettings);

  // Add it to global registry
  engineRegistry.set(engineInstance, [hotId]);

  registerNamedExpressions(engineInstance, pluginSettings.namedExpressions);

  // Add hooks needed for cross-referencing sheets
  engineInstance.on('sheetAdded', () => {
    engineInstance.rebuildAndRecalculate();
  });

  engineInstance.on('sheetRemoved', () => {
    engineInstance.rebuildAndRecalculate();
  });

  return engineInstance;
}

/**
 * Removes the HOT instance from the global register's engine usage array, and if there are no HOT instances left,
 * unregisters the engine itself.
 *
 * @param {object} engine The engine instance.
 * @param {string} hotId The Handsontable guid.
 */
export function unregisterEngine(engine, hotId) {
  if (engine) {
    const engineRegistry = staticRegister(PLUGIN_KEY).getItem('engine');
    const sharedEngineUsage = engineRegistry ? engineRegistry.get(engine) : null;

    if (sharedEngineUsage && sharedEngineUsage.includes(hotId)) {
      sharedEngineUsage.splice(sharedEngineUsage.indexOf(hotId), 1);

      if (sharedEngineUsage.length === 0) {
        engineRegistry.delete(engine);
        engine.destroy();
      }
    }
  }
}

/**
 * Registers the custom functions for the engine.
 *
 * @param {Function} engineClass The engine class.
 * @param {Array} customFunctions The custom functions array.
 */
export function registerCustomFunctions(engineClass, customFunctions) {
  if (customFunctions) {
    customFunctions.forEach((func) => {
      const {
        name,
        plugin,
        translations
      } = func;

      engineClass.registerFunction(name, plugin, translations);
    });
  }
}

/**
 * Registers the provided language for the engine.
 *
 * @param {Function} engineClass The engine class.
 * @param {object} languageSetting The engine's language object.
 */
export function registerLanguage(engineClass, languageSetting) {
  if (languageSetting) {
    const {
      langCode,
    } = languageSetting;

    if (!engineClass.getRegisteredLanguagesCodes().includes(langCode)) {
      engineClass.registerLanguage(langCode, languageSetting);
    }
  }
}

/**
 * Registers the provided named expressions in the engine instance.
 *
 * @param {object} engineInstance The engine instance.
 * @param {Array} namedExpressions Array of the named expressions to be registered.
 */
export function registerNamedExpressions(engineInstance, namedExpressions) {
  if (namedExpressions) {
    engineInstance.suspendEvaluation();

    namedExpressions.forEach((namedExp) => {
      const {
        name,
        expression,
        scope,
        options
      } = namedExp;

      engineInstance.addNamedExpression(name, expression, scope, options);
    });

    engineInstance.resumeEvaluation();
  }
}
