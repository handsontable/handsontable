/**
 * @class PropertyAliasingMod
 */
export class PropertyAliasingMod {
  constructor(metaManager) {
    /**
     * @type {MetaManager}
     */
    this.metaManager = metaManager;

    Object.defineProperty(metaManager.globalMeta.meta, 'fixedColumnsLeft', {
      get() {
        return this.fixedColumnsStart;
      },
      set(value) {
        this.fixedColumnsStart = value;
      },
      enumerable: true,
      configurable: true
    });
  }
}
