<template>
  <div :id="id">
    <slot></slot>
  </div>
</template>

<script lang="ts">
  import {
    propFactory,
    preventInternalEditWatch,
    prepareSettings,
    createVueComponent,
    findVNodeByType,
    getHotColumnComponents,
    HOT_DESTROYED_WARNING
  } from './helpers';
  import Vue, { VNode } from 'vue';
  import {
    HotTableData,
    HotTableMethods,
    HotTableProps,
    HotTableComponent,
    EditorComponent
  } from './types';
  import * as packageJson from '../package.json';
  import { LRUMap } from './lib/lru/lru';
  import Handsontable from 'handsontable';

  const HotTable: HotTableComponent<Vue, HotTableData, HotTableMethods, {}, HotTableProps> = {
    name: 'HotTable',
    props: propFactory('HotTable'),
    watch: {
      mergedHotSettings: function (value) {
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
          this.hotInstance.updateSettings(value);

        } else {
          this.hotInstance.render();
        }

        this.miscCache.currentSourceColumns = this.hotInstance.countSourceCols();
      }
    },
    data: function () {
      const thisComponent: any = this;
      const rendererCache = new LRUMap(this.wrapperRendererCacheSize);

      // Make the LRU cache destroy each removed component
      rendererCache.shift = function () {
        let entry = LRUMap.prototype.shift.call(this);
        entry[1].component.$destroy();

        return entry;
      };

      return {
        __internalEdit: false,
        miscCache: {
          currentSourceColumns: null
        },
        __hotInstance: null,
        columnSettings: null,
        rendererCache: rendererCache,
        editorCache: new Map(),
        get hotInstance() {
          if (!thisComponent.__hotInstance || (thisComponent.__hotInstance && !thisComponent.__hotInstance.isDestroyed)) {

            // Will return the Handsontable instance or `null` if it's not yet been created.
            return thisComponent.__hotInstance;

          } else {
            console.warn(HOT_DESTROYED_WARNING);

            return null;
          }
        },
        set hotInstance(hotInstance) {
          thisComponent.__hotInstance = hotInstance;
        }
      };
    },
    computed: {
      mergedHotSettings: function (): Handsontable.GridSettings {
        return prepareSettings(this.$props, this.hotInstance ? this.hotInstance.getSettings() : void 0);
      }
    },
    methods: {
      /**
       * Initialize Handsontable.
       */
      hotInit: function (): void {
        const globalRendererVNode = this.getGlobalRendererVNode();
        const globalEditorVNode = this.getGlobalEditorVNode();

        const newSettings: Handsontable.GridSettings = prepareSettings(this.$props);

        newSettings.columns = this.columnSettings ? this.columnSettings : newSettings.columns;

        if (globalEditorVNode) {
          newSettings.editor = this.getEditorClass(globalEditorVNode, this);

          globalEditorVNode.child.$destroy();
        }

        if (globalRendererVNode) {
          newSettings.renderer = this.getRendererWrapper(globalRendererVNode, this);

          globalRendererVNode.child.$destroy();
        }

        this.hotInstance = new Handsontable.Core(this.$el, newSettings);
        this.hotInstance.init();

        preventInternalEditWatch(this);

        this.miscCache.currentSourceColumns = this.hotInstance.countSourceCols();
      },
      matchHotMappersSize: function(): void {
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
            this.hotInstance.rowIndexMapper.insertIndexes(indexMapperRowCount - 1, data.length - indexMapperRowCount);
          }

          if (isColumnModificationAllowed && data.length !== 0) {
            if (columnsToRemove.length > 0) {
              this.hotInstance.columnIndexMapper.removeIndexes(columnsToRemove);

            } else {
              this.hotInstance.columnIndexMapper.insertIndexes(indexMapperColumnCount - 1, data[0].length - indexMapperColumnCount);
            }
          }
        });
      },
      getGlobalRendererVNode: function (): VNode | null {
        const hotTableSlots: VNode[] = this.$slots.default || [];
        return findVNodeByType(hotTableSlots, 'hot-renderer');
      },
      getGlobalEditorVNode: function (): VNode | null {
        const hotTableSlots: VNode[] = this.$slots.default || [];
        return findVNodeByType(hotTableSlots, 'hot-editor');
      },
      /**
       * Get settings for the columns provided in the `hot-column` components.
       */
      getColumnSettings: function (): HotTableProps[] | void {
        const hotColumns = getHotColumnComponents(this.$children);
        let usesRendererComponent = false;
        let columnSettings: HotTableProps[] = hotColumns.map((elem) => {
          if (elem.usesRendererComponent) {
            usesRendererComponent = true;
          }

          return {...elem.columnSettings};
        });

        if (usesRendererComponent &&
          (this.settings && (this.settings.autoColumnSize !== false || this.settings.autoRowSize)) &&
          (this.autoColumnSize !== false || this.autoRowSize)) {
          console.warn('Your `hot-table` configuration includes both `hot-column` and `autoRowSize`/`autoColumnSize`, which are not compatible with each other ' +
            'in this version of `@handsontable/vue`. Disable `autoRowSize` and `autoColumnSize` to prevent row and column misalignment.')
        }

        return columnSettings.length ? columnSettings : void 0;
      },
      /**
       * Create the wrapper function for the provided renderer child component.
       *
       * @param {Object} vNode VNode of the renderer child component.
       * @param {Boolean} containerComponent Instance of the component, which will be treated as a parent for the newly created renderer component.
       * @returns {Function} The wrapper function used as the renderer.
       */
      getRendererWrapper: function (vNode: VNode, containerComponent: Vue): (...args) => HTMLElement {
        const $vm = this;

        return function (instance, TD, row, col, prop, value, cellProperties) {
          // Prevent caching and rendering of the GhostTable table cells
          if (TD && !TD.getAttribute('ghost-table')) {
            const rendererCache = $vm.rendererCache;
            const rendererArgs: object = {
              hotInstance: instance,
              TD,
              row,
              col,
              prop,
              value,
              cellProperties,
              isRenderer: true
            };

            if (rendererCache && !rendererCache.has(`${row}-${col}`)) {
              const mountedComponent: Vue = createVueComponent(vNode, containerComponent, vNode.componentOptions.propsData, rendererArgs);

              rendererCache.set(`${row}-${col}`, {
                component: mountedComponent,
                lastUsedTD: null
              });
            }

            const cachedEntry = rendererCache.get(`${row}-${col}`);
            const cachedComponent: Vue = cachedEntry.component;
            const cachedTD: HTMLTableCellElement = cachedEntry.lastUsedTD;

            Object.assign(cachedComponent.$data, rendererArgs);

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
       * @param {Object} vNode VNode for the editor child component.
       * @param {Boolean} containerComponent Instance of the component, which will be treated as a parent for the newly created editor component.
       * @returns {Class} The class used as an editor in Handsontable.
       */
      getEditorClass: function (vNode: VNode, containerComponent: Vue): typeof Handsontable.editors.BaseEditor {
        const componentKey: string = vNode.key ? vNode.key.toString() : null;
        const componentName: string = (vNode.componentOptions.Ctor as any).options.name;
        const componentCacheKey = componentKey ? `${componentName}:${componentKey}` : componentName;

        const editorCache = this.editorCache;
        let mountedComponent: EditorComponent = null;

        if (!editorCache.has(componentCacheKey)) {
          mountedComponent = createVueComponent(vNode, containerComponent, vNode.componentOptions.propsData, {isEditor: true});

          editorCache.set(componentCacheKey, mountedComponent);

        } else {
          mountedComponent = editorCache.get(componentCacheKey);
        }

        return mountedComponent.$data.hotCustomEditorClass;
      }
    },
    mounted: function () {
      this.columnSettings = this.getColumnSettings();

      return this.hotInit();
    },
    beforeDestroy: function () {
      if (this.hotInstance) {
        this.hotInstance.destroy();
      }
    },
    version: (packageJson as any).version
  };

  export default HotTable;
  export { HotTable };
</script>
