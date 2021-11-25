<script lang="ts">
import { defineComponent } from 'vue';
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
