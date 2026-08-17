import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ALLOWED_TAGS = ['BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH'];
const ALLOWED_ATTRIBUTES = ['colspan', 'rowspan'];
const DROPPED_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE'];

// Handsontable has no built-in sanitizer since v18.0, and `sanitizer` is grid-level:
// it also filters pasted HTML, so the table tags have to survive -- otherwise pasting
// a range degrades to plain text. In production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeHeader = (html: string): string => {
  const template = document.createElement('template');

  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    if (DROPPED_TAGS.includes(element.tagName)) {
      // Unwrapping these would promote their source text into the output
      element.remove();
    } else if (ALLOWED_TAGS.includes(element.tagName)) {
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
  const colors = [
    'yellow',
    'red',
    'orange',
    'green',
    'blue',
    'gray',
    'black',
    'white',
    'purple',
    'lime',
    'olive',
    'cyan',
  ];

  const cars = ['BMW', 'Chrysler', 'Nissan', 'Suzuki', 'Toyota', 'Volvo'];

  return (
    <HotTable
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      sanitizer={sanitizeHeader}
      data={[
        ['BMW', 2017, 'black', 'black'],
        ['Nissan', 2018, 'blue', 'blue'],
        ['Chrysler', 2019, 'yellow', 'black'],
        ['Volvo', 2020, 'white', 'gray'],
      ]}
      colHeaders={['Car<br>(allowInvalid true)', 'Year', 'Chassis color', 'Bumper color<br>(allowInvalid true)']}
      columns={[
        {
          type: 'autocomplete',
          source: cars,
          strict: true,
          // allowInvalid: true // true is default
        },
        {},
        {
          type: 'autocomplete',
          source: colors,
          strict: true,
        },
        {
          type: 'autocomplete',
          source: colors,
          strict: true,
          allowInvalid: true, // true is default
        },
      ]}
    />
  );
};

export default ExampleComponent;
