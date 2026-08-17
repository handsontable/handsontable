import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ALLOWED_TAGS = ['BR'];

// The column headers below contain a line break, so they need a sanitizer. Handsontable
// has no built-in one since v18.0. This minimal allowlist keeps the example
// self-contained -- in production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeHeader = (html) => {
  const template = document.createElement('template');

  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    if (ALLOWED_TAGS.includes(element.tagName)) {
      Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
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
