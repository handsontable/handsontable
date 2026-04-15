import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { editorFactory } from 'handsontable/editors';
import { rendererFactory } from 'handsontable/renderers';

// Register all Handsontable's modules.
registerAllModules();

/* start:skip-in-preview */
const data = [
  { product: 'Dashboard Pro', category: 'Analytics', rating: 5, reviews: 342, price: 49 },
  { product: 'Form Builder', category: 'Tools', rating: 4, reviews: 218, price: 29 },
  { product: 'Chart Engine', category: 'Analytics', rating: 3, reviews: 156, price: 39 },
  { product: 'Auth Module', category: 'Security', rating: 5, reviews: 89, price: 19 },
  { product: 'File Manager', category: 'Storage', rating: 2, reviews: 64, price: 15 },
  { product: 'Email Service', category: 'Communication', rating: 4, reviews: 275, price: 25 },
  { product: 'Search Index', category: 'Tools', rating: 1, reviews: 31, price: 35 },
  { product: 'Cache Layer', category: 'Infra', rating: 4, reviews: 112, price: 20 },
];
/* end:skip-in-preview */
// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1');
const starSvg =
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = `<div class="rating-cell">${Array.from(
      { length: 5 },
      (_, index) => `<span class="rating-star ${index < value ? 'active' : ''}">${starSvg}</span>`
    ).join('')}</div>`;
  }),
  validator: (value, callback) => {
    value = parseInt(value);
    callback(value >= 0 && value <= 100);
  },
  editor: editorFactory({
    shortcuts: [
      {
        keys: [['1'], ['2'], ['3'], ['4'], ['5']],
        callback: (editor, _event) => {
          editor.setValue(_event.key);
        },
      },
      {
        keys: [['ArrowRight']],
        callback: (editor, _event) => {
          if (parseInt(editor.value) < 5) {
            editor.setValue(parseInt(editor.value) + 1);
          }
        },
      },
      {
        keys: [['ArrowLeft']],
        callback: (editor, _event) => {
          if (parseInt(editor.value) > 1) {
            editor.setValue(parseInt(editor.value) - 1);
          }
        },
      },
    ],
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement('DIV');
      editor.input.classList.add('rating-editor');
    },
    afterInit(editor) {
      editor.input.addEventListener('mouseover', (event) => {
        const star = event.target.closest('.rating-star');

        if (star?.dataset.value && parseInt(editor.value) !== parseInt(star.dataset.value)) {
          editor.setValue(star.dataset.value);
        }
      });
      editor.input.addEventListener('mousedown', () => {
        editor.finishEditing();
      });
    },
    render(editor) {
      editor.input.innerHTML = Array.from(
        { length: 5 },
        (_, index) =>
          `<span data-value="${index + 1}" class="rating-star ${index < editor.value ? 'active' : ''}${
            index + 1 === parseInt(editor.value) ? ' current' : ''
          }">${starSvg}</span>`
      ).join('');
    },
  }),
};

// Define configuration options for the Handsontable
const hotOptions = {
  data,
  colHeaders: ['Product', 'Category', 'Rating', 'Reviews', 'Price'],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  headerClassName: 'htLeft',
  columns: [
    { data: 'product', type: 'text', width: 240 },
    { data: 'category', type: 'text', width: 120 },
    { data: 'rating', width: 150, ...cellDefinition },
    { data: 'reviews', type: 'numeric', width: 80 },
    { data: 'price', type: 'numeric', width: 80 },
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
