<script lang="ts">
  import Vue, { VNode } from 'vue';
  import { ThisTypedComponentOptionsWithRecordProps } from 'vue/types/options';
  import {
    propFactory,
    findVNodeByType,
    filterPassedProps
  } from './helpers';
  import {
    HotTableProps,
    HotColumnMethods,
  } from './types';

  const HotColumn: ThisTypedComponentOptionsWithRecordProps<Vue, {}, HotColumnMethods, {}, HotTableProps> = {
    name: 'HotColumn',
    props: propFactory('HotColumn'),
    methods: {
      /**
       * Create the column settings based on the data provided to the `hot-column` component and it's child components.
       */
      createColumnSettings: function (): void {
        const hotColumnSlots: VNode[] | any[] = this.$slots.default || [];
        const rendererVNode: VNode | null = findVNodeByType(hotColumnSlots, 'hot-renderer');
        const editorVNode: VNode | null = findVNodeByType(hotColumnSlots, 'hot-editor');
        const assignedProps = filterPassedProps(this.$props);

        if (rendererVNode && this.usesRendererComponent === void 0) {
          this.usesRendererComponent = true;
        }

        this.columnSettings = {...assignedProps};

        if (rendererVNode !== null) {
          this.columnSettings.renderer = this.$parent.getRendererWrapper(rendererVNode, this);

        } else if (assignedProps.renderer) {
          this.columnSettings.renderer = assignedProps.renderer;
        }

        if (editorVNode !== null) {
          this.columnSettings.editor = this.$parent.getEditorClass(editorVNode, this);

        } else if (assignedProps.editor) {
          this.columnSettings.editor = assignedProps.editor;
        }
      }
    },
    mounted: function () {
      this.createColumnSettings();
    },
    render: function () {
      return null;
    }
  };

  export default HotColumn;
  export { HotColumn };
</script>
