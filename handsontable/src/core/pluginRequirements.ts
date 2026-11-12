/**
 * The plugins other plugins need running, keyed by plugin key, each with the objects that require it.
 * A required plugin's `isEnabled()` answers `true` while its own option is off. One grid holds one
 * registry, so it dies with the instance and nothing needs cleaning on destroy.
 */
export class PluginRequirements {
  /**
   * The objects that require each plugin, keyed by plugin key.
   *
   * @type {Map<string, Set<object>>}
   */
  #requirers = new Map<string, Set<object>>();

  /**
   * Marks a plugin as needed by another object, usually another plugin. Requiring a plugin twice by the
   * same object changes nothing. The caller still enables the required plugin itself when it is not
   * running.
   *
   * @param {string} pluginKey The key of the required plugin, as in its `PLUGIN_KEY`.
   * @param {object} requirer The object that needs the plugin running.
   */
  require(pluginKey: string, requirer: object): void {
    let requirers = this.#requirers.get(pluginKey);

    if (!requirers) {
      requirers = new Set();
      this.#requirers.set(pluginKey, requirers);
    }

    requirers.add(requirer);
  }

  /**
   * Drops the requirement `require()` recorded for a plugin. Releasing a requirement that was not
   * recorded changes nothing. The plugin stays required while another object still requires it.
   *
   * @param {string} pluginKey The key of the required plugin, as in its `PLUGIN_KEY`.
   * @param {object} requirer The object that no longer needs the plugin running.
   */
  release(pluginKey: string, requirer: object): void {
    const requirers = this.#requirers.get(pluginKey);

    if (!requirers) {
      return;
    }

    requirers.delete(requirer);

    if (requirers.size === 0) {
      this.#requirers.delete(pluginKey);
    }
  }

  /**
   * Checks whether any object requires the plugin through `require()`.
   *
   * @param {string} pluginKey The key of the plugin, as in its `PLUGIN_KEY`.
   * @returns {boolean}
   */
  isRequired(pluginKey: string): boolean {
    return this.#requirers.has(pluginKey);
  }
}
