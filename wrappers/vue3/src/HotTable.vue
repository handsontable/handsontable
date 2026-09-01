<template>
  <div :id="id" style="height: 100%">
    <!-- `hot-column` children render invisible comment anchors in source order.
         Handsontable appends its own DOM to this container without clearing
         pre-existing nodes, so the anchors survive; the parent reads their
         document position to order the columns. -->
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
      columnsCache: this.columnsCache,
      refreshColumns: this.refreshColumns,
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
      columnsRefreshScheduled: false,
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
     * The columns are ordered by the document position of each `hot-column`'s
     * anchor node, not by the `columnsCache` insertion order. This keeps the
     * order correct when columns are inserted in the middle, removed, or
     * reordered, and when a `hot-column` is nested inside a wrapper component.
     *
     * @returns {HotTableProps[] | undefined}
     */
    getColumnSettings(): HotTableProps[] | void {
      const orderedColumns = Array.from(this.columnsCache.entries())
        .sort(([columnA], [columnB]) => {
          const anchorA = (columnA as { $el?: Node }).$el;
          const anchorB = (columnB as { $el?: Node }).$el;

          if (!anchorA || !anchorB) {
            return 0;
          }

          const position = anchorA.compareDocumentPosition(anchorB);

          // eslint-disable-next-line no-bitwise
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
            return -1;
          }

          // eslint-disable-next-line no-bitwise
          if (position & Node.DOCUMENT_POSITION_PRECEDING) {
            return 1;
          }

          return 0;
        })
        .map(([, columnSettings]) => columnSettings);

      return orderedColumns.length ? orderedColumns : void 0;
    },

    /**
     * Re-read the column settings declared by `hot-column` children and push them
     * to the Handsontable instance. Called by children on mount, prop change, and
     * unmount, and by the parent on reorder. Multiple notifications in the same
     * tick are coalesced into a single `updateSettings` call.
     */
    refreshColumns(): void {
      if (this.columnsRefreshScheduled) {
        return;
      }

      this.columnsRefreshScheduled = true;

      this.$nextTick(() => {
        this.columnsRefreshScheduled = false;

        if (!this.hotInstance) {
          return;
        }

        const newColumnSettings = this.getColumnSettings();
        const previousColumnSettings = this.columnSettings;

        // Each `hot-column` rebuilds its settings object whenever its props change,
        // so an unchanged column keeps the same object reference. Comparing the
        // arrays by reference and order is cheaper than a deep compare and avoids
        // an `updateSettings` call on unrelated re-renders (e.g. data-only updates).
        const isUnchanged =
          (!previousColumnSettings && !newColumnSettings) ||
          (!!previousColumnSettings && !!newColumnSettings &&
            previousColumnSettings.length === newColumnSettings.length &&
            previousColumnSettings.every((settings, index) => settings === newColumnSettings[index]));

        if (isUnchanged) {
          return;
        }

        this.columnSettings = newColumnSettings || null;
        this.hotInstance.updateSettings({ columns: newColumnSettings || void 0 });
      });
    },
  },
  mounted() {
    this.columnSettings = this.getColumnSettings();
    this.hotInit();
  },
  updated() {
    // Reordering keyed `hot-column` children reuses their instances and fires no
    // child lifecycle hook, so the children cannot notify on their own. The slot
    // vnodes do change, which re-renders `HotTable` - refresh from here to cover
    // reorders (coalesced with any child-triggered refresh).
    this.refreshColumns();
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
