<template>
  <div :id="id">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, render } from 'vue';
import Handsontable from 'handsontable/base';
import {
  createVueComponent,
  findVNodeByType,
  getVNodeName,
  HOT_DESTROYED_WARNING,
  prepareSettings,
  preventInternalEditWatch,
  propFactory,
} from './helpers';
import {
  HotTableProps,
  VNode,
} from './types';
import * as packageJson from '../package.json';
import { LRUMap } from './lib/lru/lru';

const HotTable = defineComponent({
  name: 'HotTable',
  props: propFactory('HotTable'),
  provide() {
    return {
      columnsCache: this.columnsCache
    };
  },
  watch: {
    $props: {
      handler(value2) {
        const value = prepareSettings(value2, this.hotInstance ? this.hotInstance.getSettings() : void 0);

        if (!this.hotInstance || value === void 0) {
          return;
        }

        if (value.data) {
          if (
            this.hotInstance.isColumnModificationAllowed() ||
            (
              !this.hotInstance.isColumnModificationAllowed() &&
              this.hotInstance.countSourceCols() === this.miscCache.currentSourceColumns
            )
          ) {
            // If the dataset dimensions change, update the index mappers.
            this.matchHotMappersSize();

            // Data is automatically synchronized by reference.
            delete value.data;
          }
        }

        // If there are another options changed, update the HOT settings, render the table otherwise.
        if (Object.keys(value).length) {
          // const newVal = makeRaw(value)
          this.hotInstance.updateSettings(value);

        } else {
          this.hotInstance.render();
        }

        this.miscCache.currentSourceColumns = this.hotInstance.countSourceCols();
      },
      deep: true,
      immediate: true,
    }
  },
  data() {
    const rendererCache = new LRUMap(this.wrapperRendererCacheSize as number);

    // Make the LRU cache destroy each removed component
    rendererCache.shift = function() {
      const entry = LRUMap.prototype.shift.call(this);

      // equal to $destroy in Vue2
      render(null, entry[1].component.$el);

      return entry;
    };

    return {
      /* eslint-disable vue/no-reserved-keys */
      __internalEdit: false,
      __hotInstance: null,
      /* eslint-enable vue/no-reserved-keys */
      rendererCache,
      miscCache: {
        currentSourceColumns: null,
      },
      columnSettings: null,
      editorCache: new Map(),
      columnsCache: new Map(),
      get hotInstance() {
        if (!this.__hotInstance || (this.__hotInstance && !this.__hotInstance.isDestroyed)) {

          // Will return the Handsontable instance or `null` if it's not yet been created.
          return this.__hotInstance;

        } else {
          console.warn(HOT_DESTROYED_WARNING);

          return null;
        }
      },
      set hotInstance(hotInstance) {
        this.__hotInstance = hotInstance;
      },
    };
  },
  methods: {
    /**
     * Initialize Handsontable.
     */
    hotInit(): void {
      const globalRendererVNode = this.getGlobalRendererVNode();
      const globalEditorVNode = this.getGlobalEditorVNode();

      const newSettings: Handsontable.GridSettings = prepareSettings(this.$props);

      newSettings.columns = this.columnSettings ? this.columnSettings : newSettings.columns;

      if (globalEditorVNode) {
        newSettings.editor = this.getEditorClass(globalEditorVNode, this);
      }

      if (globalRendererVNode) {
        newSettings.renderer = this.getRendererWrapper(globalRendererVNode, this);
      }

      this.hotInstance = new Handsontable.Core(this.$el, newSettings);
      this.hotInstance.init();

      preventInternalEditWatch(this);

      this.miscCache.currentSourceColumns = this.hotInstance.countSourceCols();
    },
    matchHotMappersSize(): void {
      if (!this.hotInstance) {
        return;
      }

      const data: Handsontable.CellValue[][] = this.hotInstance.getSourceData();
      const rowsToRemove: number[] = [];
      const columnsToRemove: number[] = [];
      const indexMapperRowCount = this.hotInstance.rowIndexMapper.getNumberOfIndexes();
      const isColumnModificationAllowed = this.hotInstance.isColumnModificationAllowed();
      let indexMapperColumnCount = 0;

      if (data && data.length !== indexMapperRowCount) {
        if (data.length < indexMapperRowCount) {
          for (let r = data.length; r < indexMapperRowCount; r++) {
            rowsToRemove.push(r);
          }
        }
      }

      if (isColumnModificationAllowed) {
        indexMapperColumnCount = this.hotInstance.columnIndexMapper.getNumberOfIndexes();

        if (data && data[0] && data[0]?.length !==
          indexMapperColumnCount) {
          if (data[0].length < indexMapperColumnCount) {
            for (let c = data[0].length; c < indexMapperColumnCount; c++) {
              columnsToRemove.push(c);
            }
          }
        }
      }

      this.hotInstance.batch(() => {
        if (rowsToRemove.length > 0) {
          this.hotInstance.rowIndexMapper.removeIndexes(rowsToRemove);

        } else {
          this.hotInstance.rowIndexMapper
            .insertIndexes(indexMapperRowCount - 1, data.length - indexMapperRowCount);
        }

        if (isColumnModificationAllowed && data.length !== 0) {
          if (columnsToRemove.length > 0) {
            this.hotInstance.columnIndexMapper.removeIndexes(columnsToRemove);

          } else {
            this.hotInstance.columnIndexMapper
              .insertIndexes(indexMapperColumnCount - 1, data[0].length - indexMapperColumnCount);
          }
        }
      });
    },
    getGlobalRendererVNode(): VNode | null {
      const hotTableSlots: VNode[] = typeof this.$slots.default === 'function' ? this.$slots.default() : [];

      return findVNodeByType(hotTableSlots, 'hot-renderer');
    },
    getGlobalEditorVNode(): VNode | null {
      const hotTableSlots: VNode[] = typeof this.$slots.default === 'function' ? this.$slots.default() : [];

      return findVNodeByType(hotTableSlots, 'hot-editor');
    },
    /**
     * Get settings for the columns provided in the `hot-column` components.
     *
     * @returns {HotTableProps[] | undefined}
     */
    getColumnSettings(): HotTableProps[] | void {
      const hotColumns: any[] = Array.from(this.columnsCache.values());
      const columnSettings: HotTableProps[] = [];
      let usesRendererComponent = false;

      hotColumns.forEach((elem) => {
        if (elem.usesRendererComponent) {
          usesRendererComponent = true;
        }

        columnSettings.push({ ...elem });
      });

      if (usesRendererComponent &&
        (typeof this.settings === 'object' && (this.settings.autoColumnSize !== false || this.settings.autoRowSize)) &&
        (this.autoColumnSize !== false || this.autoRowSize)) {
        console.warn('Your `hot-table` configuration includes both `hot-column` and `autoRowSize`/`autoColumnSize`, ' +
                     'which are not compatible with each other in this version of `@handsontable/vue3`. ' +
                     'Disable `autoRowSize` and `autoColumnSize` to prevent row and column misalignment.');
      }

      return columnSettings.length ? columnSettings : void 0;
    },
    /**
     * Create the wrapper function for the provided renderer child component.
     *
     * @param {object} vNode VNode of the renderer child component.
     * @param {boolean} containerComponent Instance of the component, which will be treated as a parent for the newly created renderer component.
     * @returns {Function} The wrapper function used as the renderer.
     */
    getRendererWrapper(vNode: VNode, containerComponent: VNode): (...args) => HTMLElement {
      return (instance, TD, row, col, prop, value, cellProperties) => {
        // Prevent caching and rendering of the GhostTable table cells
        if (TD && !TD.getAttribute('ghost-table')) {
          const rendererCache = this.rendererCache;
          const rendererArgs = {
            hotInstance: instance,
            TD,
            row,
            col,
            prop,
            value,
            cellProperties,
            isRenderer: true,
          };

          if (rendererCache && !rendererCache.has(`${row}-${col}`)) {
            const mountedComponent: VNode = createVueComponent(vNode, containerComponent, rendererArgs);

            rendererCache.set(`${row}-${col}`, {
              component: mountedComponent,
              lastUsedTD: null,
            });
          }

          const cachedEntry = rendererCache.get(`${row}-${col}`);
          const cachedComponent: VNode = cachedEntry.component;
          const cachedTD: HTMLTableCellElement = cachedEntry.lastUsedTD;

          if (!cachedComponent.$el.parentElement || cachedTD !== TD) {
            // Clear the previous contents of a TD
            while (TD.firstChild) {
              TD.removeChild(TD.firstChild);
            }

            TD.appendChild(cachedComponent.$el);

            cachedEntry.lastUsedTD = TD;
          }
        }

        return TD;
      };
    },
    /**
     * Create a fresh class to be used as an editor, based on the editor component provided.
     *
     * @param {object} vNode VNode for the editor child component.
     * @param {boolean} containerComponent Instance of the component, which will be treated as a parent for the newly created editor component.
     * @returns {BaseEditor} The class used as an editor in Handsontable.
     */
    getEditorClass(vNode: VNode, containerComponent: VNode): typeof Handsontable.editors.BaseEditor {
      const componentKey: string = vNode.key ? vNode.key.toString() : null;
      const componentName: string = getVNodeName(vNode);
      const componentCacheKey = componentKey ? `${componentName}:${componentKey}` : componentName;

      const editorCache = this.editorCache;
      let mountedComponent = null;

      if (!editorCache.has(componentCacheKey)) {
        mountedComponent = createVueComponent(vNode, containerComponent, { isEditor: true });

        editorCache.set(componentCacheKey, mountedComponent);

      } else {
        mountedComponent = editorCache.get(componentCacheKey);
      }

      return mountedComponent.hotCustomEditorClass;
    },
  },
  mounted() {
    this.columnSettings = this.getColumnSettings();

    return this.hotInit();
  },
  beforeUnmount() {
    if (this.hotInstance) {
      this.hotInstance.destroy();
    }
  },
  version: (packageJson as any).version,
});

export default HotTable;
export { HotTable };
</script>
