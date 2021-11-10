<script lang="ts">
  import {
    propFactory,
    findVNodeByType,
    filterPassedProps
  } from './helpers';
  import {
    HotTableProps,
    HotColumnMethods,
  } from './types';

  type VNode = any;
  type Vue = any;

  const HotColumn = {
    name: 'HotColumn',
    props: propFactory('HotColumn'),
    inject: ['columnsCache'],
    methods: {
      /**
       * Create the column settings based on the data provided to the `hot-column` component and it's child components.
       */
      createColumnSettings: function (): void {
        const hotColumnSlots: VNode[] = typeof this.$slots.default === 'function' ? this.$slots.default() : [];
        const rendererVNode: VNode | null = findVNodeByType(hotColumnSlots, 'hot-renderer');
        const editorVNode: VNode | null = findVNodeByType(hotColumnSlots, 'hot-editor');

        let usesRendererComponent = false;
        const assignedProps = filterPassedProps(this.$props);

        if (rendererVNode) {
          usesRendererComponent = true;
        }

        const columnSettings = { ...assignedProps };

        if (rendererVNode !== null) {
          columnSettings.renderer = this.$parent.getRendererWrapper(rendererVNode, this);

        } else if (assignedProps.renderer) {
          columnSettings.renderer = assignedProps.renderer;
        }

        if (editorVNode !== null) {
          columnSettings.editor = this.$parent.getEditorClass(editorVNode, this);

        } else if (assignedProps.editor) {
          columnSettings.editor = assignedProps.editor;
        }

        columnSettings.usesRendererComponent = usesRendererComponent;

        this.columnsCache.set(this, columnSettings);
      }
    },
    mounted: function () {
      this.createColumnSettings();
    },
    unmounted: function () {
      this.columnsCache.delete(this);
    },
    render: function () {
      return null;
    }
  };

  export default HotColumn;
  export { HotColumn };
</script>
