<template>
  <div :id="id">
    <slot></slot>
  </div>
</template>

<script lang="ts">
// eslint-disable-next-line  @typescript-eslint/ban-ts-comment
// @ts-ignore
import { defineComponent, VNode, markRaw } from 'vue';
// TODO: The line above is ts-ignored because rollup-plugin-typescript2 throws an error otherwise.
// It's most probably caused by outdated rollup-plugin-vue which is no longer maintained.

import Handsontable from 'handsontable/base';
import {
  HOT_DESTROYED_WARNING,
  prepareSettings,
  propFactory,
} from './helpers';
import {
  HotTableProps,
} from './types';
import * as packageJson from '../package.json';

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
      handler(props) {
        const settings = prepareSettings(props, this.hotInstance ? this.hotInstance.getSettings() : void 0);

        if (!this.hotInstance || settings === void 0) {
          return;
        }

        if (settings.data) {
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
            delete settings.data;
          }
        }

        // If there are another options changed, update the HOT settings, render the table otherwise.
        if (Object.keys(settings).length) {
          this.hotInstance.updateSettings(settings);

        } else {
          this.hotInstance.render();
        }

        this.miscCache.currentSourceColumns = this.hotInstance.countSourceCols();
      },
      deep: true,
      immediate: true,
    },
  },
  data() {
    return {
      /* eslint-disable vue/no-reserved-keys */
      __hotInstance: null as Handsontable,
      /* eslint-enable vue/no-reserved-keys */
      miscCache: {
        currentSourceColumns: null,
      },
      columnSettings: null as HotTableProps[],
      columnsCache: new Map<VNode, HotTableProps>(),
      get hotInstance(): Handsontable | null {
        if (!this.__hotInstance || (this.__hotInstance && !this.__hotInstance.isDestroyed)) {

          // Will return the Handsontable instance or `null` if it's not yet been created.
          return this.__hotInstance;

        } else {
          /* eslint-disable-next-line no-console */
          console.warn(HOT_DESTROYED_WARNING);

          return null;
        }
      },
      set hotInstance(hotInstance: Handsontable) {
        this.__hotInstance = hotInstance;
      },
    };
  },
  methods: {
    /**
     * Initialize Handsontable.
     */
    hotInit() {
      const newSettings = prepareSettings(this.$props);

      newSettings.columns = this.columnSettings ? this.columnSettings : newSettings.columns;

      this.hotInstance = markRaw<Handsontable>(new Handsontable.Core(this.$el, newSettings));
      this.hotInstance.init();

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

        if (data && data[0] && data[0]?.length !== indexMapperColumnCount) {
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

    /**
     * Get settings for the columns provided in the `hot-column` components.
     *
     * @returns {HotTableProps[] | undefined}
     */
    getColumnSettings(): HotTableProps[] | void {
      const columnSettings: HotTableProps[] = Array.from(this.columnsCache.values());

      return columnSettings.length ? columnSettings : void 0;
    },
  },
  mounted() {
    this.columnSettings = this.getColumnSettings();
    this.hotInit();
  },
  beforeUnmount() {
    if (this.hotInstance) {
      this.hotInstance.destroy();
    }
  },
  version: (packageJson as unknown as { version: string }).version,
});

export default HotTable;
export { HotTable };
</script>
