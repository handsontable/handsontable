<script lang="ts">
// eslint-disable-next-line  @typescript-eslint/ban-ts-comment
// @ts-ignore
import { defineComponent } from 'vue';
// TODO: The line above is ts-ignored because rollup-plugin-typescript2 throws an error otherwise.
// It's most probably caused by outdated rollup-plugin-vue which is no longer maintained.

import {
  propFactory,
  filterPassedProps
} from './helpers';

const HotColumn = defineComponent({
  name: 'HotColumn',
  props: propFactory('HotColumn'),
  inject: ['columnsCache'],
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
  mounted() {
    this.createColumnSettings();
  },
  unmounted() {
    this.columnsCache.delete(this);
  },
  render() {
    return null;
  }
});

export default HotColumn;
export { HotColumn };
</script>
