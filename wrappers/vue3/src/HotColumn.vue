<script lang="ts">
// eslint-disable-next-line  @typescript-eslint/ban-ts-comment
// @ts-ignore
import { defineComponent, createCommentVNode } from 'vue';
// TODO: The line above is ts-ignored because rollup-plugin-typescript2 throws an error otherwise.
// It's most probably caused by outdated rollup-plugin-vue which is no longer maintained.

import {
  propFactory,
  filterPassedProps
} from './helpers';

const HotColumn = defineComponent({
  name: 'HotColumn',
  props: propFactory('HotColumn'),
  inject: ['columnsCache', 'refreshColumns'],
  methods: {
    /**
     * Create the column settings based on the data provided to the `hot-column`
     * component and it's child components.
     */
    createColumnSettings(): void {
      const assignedProps = filterPassedProps(this.$props);
      const columnSettings = { ...assignedProps };

      if (assignedProps.renderer) {
        columnSettings.renderer = assignedProps.renderer;
      }

      if (assignedProps.editor) {
        columnSettings.editor = assignedProps.editor;
      }

      this.columnsCache.set(this, columnSettings);
    }
  },
  watch: {
    $props: {
      handler() {
        this.createColumnSettings();
        this.refreshColumns();
      },
      deep: true,
    },
  },
  mounted() {
    this.createColumnSettings();
    this.refreshColumns();
  },
  unmounted() {
    this.columnsCache.delete(this);
    this.refreshColumns();
  },
  render() {
    // Render an (invisible) comment anchor instead of nothing, so the parent
    // `HotTable` can order columns by the anchors' document position. This keeps
    // ordering correct for dynamic inserts, removals, and reorders - and works
    // regardless of how deeply the `hot-column` is nested inside wrapper
    // components - because `provide`/`inject` and the anchor both cross nesting.
    return createCommentVNode('hot-column');
  }
});

export default HotColumn;
export { HotColumn };
</script>
