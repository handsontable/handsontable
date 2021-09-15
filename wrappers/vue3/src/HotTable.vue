<template>
  <div :id="id">
    <slot></slot>
  </div>
</template>

<script lang="ts">
 
  import {
    WARNING_HOT_DESTROYED,
    prepareSettings,
    preventInternalEditWatch,
    tablePropFactory
  } from "./helpers";
  import Handsontable from 'handsontable';
  import {LRUMap} from "./lib/lru/lru";
  import * as packageJson from '../package.json';


  export const HotTable = {
    template:`
      <div :id="id">
       <slot></slot>
      </div>
    `,
    props: tablePropFactory(),
    watch: {
      mergedHotSettings(value) {
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
    data() {
      const self: any = this;
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
          if (!self.__hotInstance || (self.__hotInstance && !self.__hotInstance.isDestroyed)) {

            // Will return the Handsontable instance or `null` if it's not yet been created.
            return self.__hotInstance;

          } else {
            console.warn(WARNING_HOT_DESTROYED);

            return null;
          }
        },
        set hotInstance(hotInstance) {
          self.__hotInstance = hotInstance;
        }
      };
    },
    computed: {
      mergedHotSettings(): Handsontable.GridSettings {
        return prepareSettings(this.$props, this.hotInstance ? this.hotInstance.getSettings() : void 0);
      }
    },
    methods: {
      hotInit(): void {
        const newSettings: Handsontable.GridSettings = prepareSettings(this.$props);

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

    },
    mounted() {
      return this.hotInit();
    },
    beforeDestroy: function () {
      if (this.hotInstance) {
        this.hotInstance.destroy();
      }
    },
    version: (packageJson as any).version
  };
  
</script>
