/**
 * @class ExtendMetaPropertiesMod
 */
export class ExtendMetaPropertiesMod {
  constructor(metaManager) {
    /**
     * @type {MetaManager}
     */
    this.metaManager = metaManager;
    /**
     * @type {Set}
     */
    this.usageTracker = new Set();
    /**
     * @type {Map}
     */
    this.propDescriptors = new Map([
      ['fixedColumnsLeft', {
        target: 'fixedColumnsStart',
        observeTarget: true,
        trackUsage: true,
        onChange(propName) {
          const isRtl = this.metaManager.hot.isRtl();

          if (isRtl && propName === 'fixedColumnsLeft') {
            throw new Error('The `fixedColumnsLeft` is not supported for RTL. Please use option `fixedColumnsStart`.');
          }

          if (this.usageTracker.has('fixedColumnsLeft') && this.usageTracker.has('fixedColumnsStart')) {
            throw new Error('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together. ' +
              'Please use only the option `fixedColumnsStart`.');
          }
        }
      }],
    ]);

    this.extendMetaProps();
  }

  /**
   * Extends the meta options based on the object descriptiors from the `propDescriptors` list.
   */
  extendMetaProps() {
    this.propDescriptors.forEach((descriptor, alias) => {
      const { target, observeTarget } = descriptor;

      if (observeTarget) {
        const origProp = `_${target}`;

        this.metaManager.globalMeta.meta[origProp] = this.metaManager.globalMeta.meta[target];

        this.installPropWatcher(alias, origProp, descriptor);
        this.installPropWatcher(target, origProp, descriptor);
      } else {
        this.installPropWatcher(alias, target, descriptor);
      }
    });
  }

  /**
   * Installs the property watcher to the `propName` option and forwards getter and setter to
   * the new one.
   *
   * @param {string} propName The property to watch.
   * @param {string} origProp The property from/to the value is forwarded.
   * @param {object} descriptor The descriptor object.
   */
  installPropWatcher(propName, origProp, { trackUsage, onChange }) {
    const self = this;

    Object.defineProperty(this.metaManager.globalMeta.meta, propName, {
      get() {
        return this[origProp];
      },
      set(value) {
        if (trackUsage) {
          self.usageTracker.add(propName);
        }

        if (onChange) {
          onChange.call(self, propName, value);
        }

        this[origProp] = value;
      },
      enumerable: true,
      configurable: true
    });
  }
}
