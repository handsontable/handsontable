import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';

// Register all Handsontable's modules.
registerAllModules();

const ALLOWED_TAGS = ['B', 'EM', 'INPUT', 'BR'];
const ALLOWED_ATTRIBUTES = ['type', 'class', 'checked'];

// The column headers below return HTML, so they need a sanitizer. Handsontable has no
// built-in one since v18.0. This allowlist keeps the interactive checkbox working while
// dropping everything else -- in production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeHeader = (html) => {
  const template = document.createElement('template');

  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    if (ALLOWED_TAGS.includes(element.tagName)) {
      Array.from(element.attributes).forEach((attribute) => {
        if (!ALLOWED_ATTRIBUTES.includes(attribute.name)) {
          element.removeAttribute(attribute.name);
        }
      });
    } else {
      // Unwrap a disallowed element, keeping its text content
      element.replaceWith(...Array.from(element.childNodes));
    }
  });

  return template.innerHTML;
};

let isChecked = false;
const exampleContainer = document.querySelector('#exampleContainer5');
const container = document.querySelector('#example5');
const customRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);

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
      : `Some <input type="checkbox" class="checker" ${isChecked ? 'checked="checked"' : ''}> checkbox`;
  },
  sanitizer: sanitizeHeader,
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
