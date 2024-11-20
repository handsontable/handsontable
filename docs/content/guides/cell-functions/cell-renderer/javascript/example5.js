import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

let isChecked = false;
const exampleContainer = document.querySelector('#exampleContainer5');
const container = document.querySelector('#example5');
const customRenderer = (instance, td, ...rest) => {
  Handsontable.renderers.TextRenderer(instance, td, ...rest);

  if (isChecked) {
    td.style.backgroundColor = 'yellow';
  } else {
    td.style.backgroundColor = 'rgba(255,255,255,0.1)';
  }
};

const hot = new Handsontable(container, {
  height: 'auto',
  columns: [{}, { renderer: customRenderer }],
  colHeaders(col) {
    return col === 0
      ? '<b>Bold</b> and <em>Beautiful</em>'
      : `Some <input type="checkbox" class="checker" ${
          isChecked ? 'checked="checked"' : ''
        }> checkbox`;
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

exampleContainer.addEventListener('mousedown', (event) => {
  if (event.target.nodeName == 'INPUT' && event.target.className == 'checker') {
    event.stopPropagation();
  }
});
exampleContainer.addEventListener('mouseup', (event) => {
  if (event.target.nodeName == 'INPUT' && event.target.className == 'checker') {
    isChecked = !event.target.checked;
    hot.render();
  }
});
