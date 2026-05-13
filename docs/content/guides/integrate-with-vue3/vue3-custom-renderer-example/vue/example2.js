import { defineComponent, h, render } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// A reusable Vue 3 component that renders a cell value as an image.
const ImageCell = defineComponent({
  props: {
    src: { type: String, required: true },
  },
  render() {
    return h('img', {
      src: this.src,
      onMousedown: (event) => event.preventDefault(),
    });
  },
});

// Bridge function that mounts the Vue 3 component into the cell's TD element.
// Vue's `render()` patches the existing tree on subsequent calls, so the
// component instance is reused across re-renders.
function imageComponentRenderer(instance, td, row, col, prop, value) {
  const vnode = h(ImageCell, { src: value });

  render(vnode, td);

  return td;
}

const ExampleComponent = defineComponent({
  data() {
    return {
      hotSettings: {
        data: [
          ['Professional JavaScript for Web Developers',
            '/docs/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
          ['JavaScript: The Good Parts',
            '/docs/img/examples/javascript-the-good-parts.jpg'],
        ],
        columns: [
          {},
          {
            renderer: imageComponentRenderer,
          },
        ],
        colHeaders: true,
        rowHeights: 55,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation',
      },
    };
  },
  components: {
    HotTable,
  },
});

export default ExampleComponent;
