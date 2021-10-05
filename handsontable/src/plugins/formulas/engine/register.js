import staticRegister from '../../../utils/staticRegister';
import { isUndefined } from '../../../helpers/mixed';
import { warn } from '../../../helpers/console';
import { PLUGIN_KEY } from '../formulas';
import { DEFAULT_LICENSE_KEY, getEngineSettingsWithDefaultsAndOverrides } from './settings';

/**
 * Prepares and returns the collection for the engine relationship with the HoT instances.
 *
 * @returns {Map}
 */
function getEngineRelationshipRegistry() {
  const registryKey = 'engine_relationship';
  const pluginStaticRegistry = staticRegister(PLUGIN_KEY);

  if (!pluginStaticRegistry.hasItem(registryKey)) {
    pluginStaticRegistry.register(registryKey, new Map());
  }

  return pluginStaticRegistry.getItem(registryKey);
}

/**
 * Prepares and returns the collection for the engine shared usage.
 *
 * @returns {Map}
 */
function getSharedEngineUsageRegistry() {
  const registryKey = 'shared_engine_usage';
  const pluginStaticRegistry = staticRegister(PLUGIN_KEY);

  if (!pluginStaticRegistry.hasItem(registryKey)) {
    pluginStaticRegistry.register(registryKey, new Map());
  }

  return pluginStaticRegistry.getItem(registryKey);
}

/**
 * Setups the engine instance. It either creates a new (possibly shared) engine instance, or attaches
 * the plugin to an already-existing instance.
 *
 * @param {Handsontable} hotInstance Handsontable instance.
 * @returns {null|object} Returns the engine instance if everything worked right and `null` otherwise.
 */
export function setupEngine(hotInstance) {
  const hotSettings = hotInstance.getSettings();
  const pluginSettings = hotSettings[PLUGIN_KEY];
  const engineConfigItem = pluginSettings?.engine;

  if (pluginSettings === true) {
    return null;
  }

  if (isUndefined(engineConfigItem)) {
    return null;
  }

  // `engine.hyperformula` or `engine` is the engine class
  if (typeof engineConfigItem.hyperformula === 'function' || typeof engineConfigItem === 'function') {
    return registerEngine(
      engineConfigItem.hyperformula ?? engineConfigItem,
      hotSettings,
      hotInstance);

    // `engine` is the engine instance
  } else if (typeof engineConfigItem === 'object' && isUndefined(engineConfigItem.hyperformula)) {
    const engineRelationship = getEngineRelationshipRegistry();
    const sharedEngineUsage = getSharedEngineUsageRegistry().get(engineConfigItem);

    if (!engineRelationship.has(engineConfigItem)) {
      engineRelationship.set(engineConfigItem, []);
    }

    engineRelationship.get(engineConfigItem).push(hotInstance);

    if (sharedEngineUsage) {
      sharedEngineUsage.push(hotInstance.guid);
    }

    if (!engineConfigItem.getConfig().licenseKey) {
      engineConfigItem.updateConfig({
        licenseKey: DEFAULT_LICENSE_KEY
      });
    }

    return engineConfigItem;
  }

  return null;
}

/**
 * Registers the engine in the global register and attaches the needed event listeners.
 *
 * @param {Function} engineClass The engine class.
 * @param {object} hotSettings The Handsontable settings.
 * @param {Handsontable} hotInstance Handsontable instance.
 * @returns {object} Returns the engine instance.
 */
export function registerEngine(engineClass, hotSettings, hotInstance) {
  const pluginSettings = hotSettings[PLUGIN_KEY];
  const engineSettings = getEngineSettingsWithDefaultsAndOverrides(hotSettings);
  const engineRegistry = getEngineRelationshipRegistry();
  const sharedEngineRegistry = getSharedEngineUsageRegistry();

  registerCustomFunctions(engineClass, pluginSettings.functions);

  registerLanguage(engineClass, pluginSettings.language);

  // Create instance
  const engineInstance = engineClass.buildEmpty(engineSettings);

  // Add it to global registry
  engineRegistry.set(engineInstance, [hotInstance]);
  sharedEngineRegistry.set(engineInstance, [hotInstance.guid]);

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
 * Returns the list of the Handsontable instances linked to the specific engine instance.
 *
 * @param {object} engine The engine instance.
 * @returns {Map<number, Handsontable>} Returns Map with Handsontable instances.
 */
export function getRegisteredHotInstances(engine) {
  const engineRegistry = getEngineRelationshipRegistry();
  const hotInstances = engineRegistry.size === 0 ? [] : Array.from(engineRegistry.get(engine) ?? []);

  return new Map(hotInstances.map(hot => [hot.getPlugin('formulas').sheetId, hot]));
}

/**
 * Removes the HOT instance from the global register's engine usage array, and if there are no HOT instances left,
 * unregisters the engine itself.
 *
 * @param {object} engine The engine instance.
 * @param {string} hotInstance The Handsontable instance.
 */
export function unregisterEngine(engine, hotInstance) {
  if (engine) {
    const engineRegistry = getEngineRelationshipRegistry();
    const engineHotRelationship = engineRegistry.get(engine);
    const sharedEngineRegistry = getSharedEngineUsageRegistry();
    const sharedEngineUsage = sharedEngineRegistry.get(engine);

    if (engineHotRelationship && engineHotRelationship.includes(hotInstance)) {
      engineHotRelationship.splice(engineHotRelationship.indexOf(hotInstance), 1);

      if (engineHotRelationship.length === 0) {
        engineRegistry.delete(engine);
      }
    }

    if (sharedEngineUsage && sharedEngineUsage.includes(hotInstance.guid)) {
      sharedEngineUsage.splice(sharedEngineUsage.indexOf(hotInstance.guid), 1);

      if (sharedEngineUsage.length === 0) {
        sharedEngineRegistry.delete(engine);
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

      try {
        engineClass.registerFunction(name, plugin, translations);

      } catch (e) {
        warn(e.message);
      }
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

    try {
      engineClass.registerLanguage(langCode, languageSetting);

    } catch (e) {
      warn(e.message);
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

      try {
        engineInstance.addNamedExpression(name, expression, scope, options);

      } catch (e) {
        warn(e.message);
      }
    });

    engineInstance.resumeEvaluation();
  }
}

/**
 * Sets up a new sheet.
 *
 * @param {object} engineInstance The engine instance.
 * @param {string} sheetName The new sheet name.
 * @returns {*}
 */
export function setupSheet(engineInstance, sheetName) {
  if (isUndefined(sheetName) || !engineInstance.doesSheetExist(sheetName)) {
    sheetName = engineInstance.addSheet(sheetName);
  }

  return sheetName;
}
