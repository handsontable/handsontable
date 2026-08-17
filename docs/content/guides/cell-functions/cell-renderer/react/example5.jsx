import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';

// register Handsontable's modules
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

const ExampleComponent = () => {
  const hotRef = useRef(null);
  let isChecked = false;

  function customRenderer(_instance, td) {
    textRenderer.apply(this, arguments);

    if (isChecked) {
      td.style.backgroundColor = 'yellow';
    } else {
      td.style.backgroundColor = 'rgba(255,255,255,0.1)';
    }
  }

  const exampleContainerMouseupCallback = (event) => {
    const hot = hotRef.current?.hotInstance;

    if (event.target.nodeName == 'INPUT' && event.target.className == 'checker') {
      isChecked = !event.target.checked;
      hot?.render();
    }
  };

  return (
    <div id="exampleContainer5" onMouseUp={(...args) => exampleContainerMouseupCallback(...args)}>
      <HotTable
        ref={hotRef}
        height="auto"
        columns={[{}, { renderer: customRenderer }]}
        colHeaders={function (col) {
          switch (col) {
            case 0:
              return '<b>Bold</b> and <em>Beautiful</em>';
            case 1:
              return `Some <input type="checkbox" class="checker" ${isChecked ? `checked="checked"` : ''}> checkbox`;
            default:
              return '';
          }
        }}
        autoWrapRow={true}
        autoWrapCol={true}
        sanitizer={sanitizeHeader}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
