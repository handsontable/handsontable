import type { default as MetaManagerInstance } from '..';
import { throwWithCause } from '../../../helpers/errors';

/**
 * @class ExtendMetaPropertiesMod
 */
export class ExtendMetaPropertiesMod {
  /**
   * @type {MetaManager}
   */
  metaManager: MetaManagerInstance & {
    hot: { isRtl: () => boolean; [key: string]: unknown };
    globalMeta: { meta: Record<string, unknown>; [key: string]: unknown };
    [key: string]: unknown;
  };
  /**
   * @type {Set}
   */
  usageTracker = new Set();
  /**
   * @type {Map}
   */
  propDescriptors = new Map<string, Record<string, unknown>>([
    [
      'ariaTags', {
        initOnly: true,
      },
    ],
    ['fixedColumnsLeft', {
      target: 'fixedColumnsStart',
      onChange(propName: unknown) {
        const isRtl = this.metaManager.hot.isRtl();

        if (isRtl && propName === 'fixedColumnsLeft') {
          throwWithCause('The `fixedColumnsLeft` is not supported for RTL. Please use option `fixedColumnsStart`.');
        }

        if (this.usageTracker.has('fixedColumnsLeft') && this.usageTracker.has('fixedColumnsStart')) {
          throwWithCause('The `fixedColumnsLeft` and `fixedColumnsStart` should not be used together. ' +
            'Please use only the option `fixedColumnsStart`.');
        }
      }
    }],
    ['layoutDirection', {
      initOnly: true,
    }],
    ['renderAllColumns', {
      initOnly: true,
    }],
    ['renderAllRows', {
      initOnly: true,
    }],
  ]);

  constructor(metaManager: MetaManagerInstance & {
    hot: { isRtl: () => boolean; [key: string]: unknown };
    globalMeta: { meta: Record<string, unknown>; [key: string]: unknown };
    [key: string]: unknown;
  }) {
    this.metaManager = metaManager;

    this.extendMetaProps();
  }

  /**
   * Callback called when the prop is marked as `initOnly`.
   *
   * @param {string} propName The property name.
   * @param {*} value The new value.
   * @param {boolean} isInitialChange Is the change initial.
   */
  #initOnlyCallback = (propName: string, value: unknown, isInitialChange: boolean) => {
    if (!isInitialChange) {
      throwWithCause(`The \`${propName}\` option can not be updated after the Handsontable is initialized.`);
    }
  }

  /**
   * Extends the meta options based on the object descriptors from the `propDescriptors` list.
   */
  extendMetaProps() {
    this.propDescriptors.forEach((descriptor, alias) => {
      const { initOnly, target, onChange } = descriptor;
      const hasTarget = typeof target === 'string';
      const targetProp = hasTarget ? target : alias;
      const origProp = `_${targetProp}`;

      this.metaManager.globalMeta.meta[origProp] = this.metaManager.globalMeta.meta[targetProp];

      if (onChange) {
        this.installPropWatcher(
          alias, origProp,
          onChange as (this: unknown, changedPropName: string, value: unknown, isInitialChange: boolean) => void
        );

        if (hasTarget) {
          this.installPropWatcher(
            target, origProp,
            onChange as (this: unknown, changedPropName: string, value: unknown, isInitialChange: boolean) => void
          );
        }

      } else if (initOnly) {
        this.installPropWatcher(alias, origProp, this.#initOnlyCallback);

        if (!this.metaManager.globalMeta.meta._initOnlySettings) {
          this.metaManager.globalMeta.meta._initOnlySettings = [];
        }

        (this.metaManager.globalMeta.meta._initOnlySettings as unknown[]).push(alias);
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
  installPropWatcher(propName: string, origProp: string,
                     onChange: (this: unknown, changedPropName: string,
                                value: unknown, isInitialChange: boolean) => void) {
    const self = this;

    Object.defineProperty(this.metaManager.globalMeta.meta, propName as string, {
      get() {
        return this[origProp as string];
      },
      set(value) {
        const isInitialChange = !self.usageTracker.has(propName);

        self.usageTracker.add(propName);

        onChange.call(self, propName, value, isInitialChange);

        this[origProp as string] = value;
      },
      enumerable: true,
      configurable: true
    });
  }
}
