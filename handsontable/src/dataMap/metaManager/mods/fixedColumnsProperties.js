/**
 * @class FixedColumnsPropertiesMod
 */
export class FixedColumnsPropertiesMod {
  constructor(metaManager) {
    const self = this;

    /**
     * @type {MetaManager}
     */
    this.metaManager = metaManager;
    this.usedBy = new Set();

    metaManager.globalMeta.meta._fixedColumnsStart = 0; // setting a default value

    Object.defineProperty(metaManager.globalMeta.meta, 'fixedColumnsLeft', {
      get() {
        // TODO: should it show a warn?
        return this._fixedColumnsStart;
      },
      set(value) {
        this._fixedColumnsStart = value;
        // self.checkRtl()
        self.checkDoubleUse('fixedColumnsLeft');
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(metaManager.globalMeta.meta, 'fixedColumnsStart', {
      get() {
        return this._fixedColumnsStart;
      },
      set(value) {
        this._fixedColumnsStart = value;
        self.checkDoubleUse('fixedColumnsStart');
      },
      enumerable: true,
      configurable: true
    });
  }

  checkRtl() {
    debugger;

    if (this.metaManager.hot.isRtl()) {
      throw new Error('The `fixedColumnsLeft` is not supported for RTL. Please use option `fixedColumnsStart`.');
    }
  }

  checkDoubleUse(name) {
    this.usedBy.add(name);

    if (this.usedBy.size >= 2) {
      throw new Error('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together. ' +
        'Please use only the option `fixedColumnsStart`.');
    }
  }
}
