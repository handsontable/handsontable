/**
 * @class ExtendMetaPropertiesMod
 */
export class ExtendMetaPropertiesMod {
  /**
   * @type {MetaManager}
   */
  metaManager;
  /**
   * @type {Set}
   */
  usageTracker = new Set();
  /**
   * @type {Map}
   */
  propDescriptors = new Map([
    [
      'ariaTags', {
        onChange(propName, value, isInitialChange) {
          if (!isInitialChange) {
            throw new Error(
              `The \`${propName}\` option can not be updated after the Handsontable instance was initialized.`
            );
          }
        }
      }],
    ['fixedColumnsLeft', {
      target: 'fixedColumnsStart',
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
    ['layoutDirection', {
      onChange(propName, value, isInitialChange) {
        if (!isInitialChange) {
          throw new Error(`The \`${propName}\` option can not be updated after the Handsontable is initialized.`);
        }
      }
    }],
    // Temporary commented out due to the bug in the React wrapper.
    // ['renderAllColumns', {
    //   onChange(propName, value, isInitialChange) {
    //     if (!isInitialChange) {
    //       throw new Error(`The \`${propName}\` option can not be updated after the Handsontable is initialized.`);
    //     }
    //   }
    // }],
    // ['renderAllRows', {
    //   onChange(propName, value, isInitialChange) {
    //     if (!isInitialChange) {
    //       throw new Error(`The \`${propName}\` option can not be updated after the Handsontable is initialized.`);
    //     }
    //   }
    // }],
  ]);

  constructor(metaManager) {
    this.metaManager = metaManager;

    this.extendMetaProps();
  }

  /**
   * Extends the meta options based on the object descriptors from the `propDescriptors` list.
   */
  extendMetaProps() {
    this.propDescriptors.forEach((descriptor, alias) => {
      const { target, onChange = () => {} } = descriptor;
      const hasTarget = typeof target === 'string';
      const targetProp = hasTarget ? target : alias;
      const origProp = `_${targetProp}`;

      this.metaManager.globalMeta.meta[origProp] = this.metaManager.globalMeta.meta[targetProp];

      this.installPropWatcher(alias, origProp, onChange);

      if (hasTarget) {
        this.installPropWatcher(target, origProp, onChange);
      }
    });
  }

  /**
   * Installs the property watcher to the `propName` option and forwards getter and setter to
   * the new one.
   *
   * @param {string} propName The property to watch.
   * @param {string} origProp The property from/to the value is forwarded.
   * @param {Function} onChange The callback.
   */
  installPropWatcher(propName, origProp, onChange) {
    const self = this;

    Object.defineProperty(this.metaManager.globalMeta.meta, propName, {
      get() {
        return this[origProp];
      },
      set(value) {
        const isInitialChange = !self.usageTracker.has(propName);

        self.usageTracker.add(propName);

        onChange.call(self, propName, value, isInitialChange);

        this[origProp] = value;
      },
      enumerable: true,
      configurable: true
    });
  }
}
