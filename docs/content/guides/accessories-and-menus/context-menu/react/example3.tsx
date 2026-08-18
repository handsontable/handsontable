import { HotTable } from '@handsontable/react-wrapper';
import { DetailedSettings, MenuItemConfig } from 'handsontable/plugins/contextMenu';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ALLOWED_TAGS = ['B', 'I', 'EM', 'STRONG', 'BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH'];
const ALLOWED_ATTRIBUTES = ['colspan', 'rowspan'];
const DROPPED_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE'];

// Handsontable has no built-in sanitizer since v18.0, and `sanitizer` is grid-level:
// it also filters pasted HTML, so the table tags have to survive -- otherwise pasting
// a range degrades to plain text. In production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeMenuLabel = (html: string): string => {
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

const contextMenuSettings: DetailedSettings = {
  callback(key, selection, clickEvent) {
    // Common callback for all options
    console.log(key, selection, clickEvent);
  },
  items: {
    row_above: {
      disabled() {
        // `disabled` can be a boolean or a function
        // Disable option when first row was clicked
        return this.getSelectedLast()?.[0] === 0; // `this` === hot
      },
    },
    // A separator line can also be added like this:
    // 'sp1': { name: '---------' }
    // and the key has to be unique
    sp1: '---------' as MenuItemConfig,
    row_below: {
      name: 'Click to add row below', // Set custom text for predefined option
    },
    about: {
      // Own custom option
      name() {
        // `name` can be a string or a function
        return '<b>Custom option</b>'; // Name can contain HTML
      },
      hidden() {
        // `hidden` can be a boolean or a function
        // Hide the option when the first column was clicked
        return this.getSelectedLast()?.[1] == 0; // `this` === hot
      },
      callback() {
        // Callback for specific option
        setTimeout(() => {
          alert('Hello world!'); // Fire alert after menu close (with timeout)
        }, 0);
      },
    },
    colors: {
      // Own custom option
      name: 'Colors...',
      submenu: {
        // Custom option with submenu of items
        items: [
          {
            // Key must be in the form 'parent_key:child_key'
            key: 'colors:red',
            name: 'Red',
            callback() {
              setTimeout(() => {
                alert('You clicked red!');
              }, 0);
            },
          },
          { key: 'colors:green', name: 'Green' },
          { key: 'colors:blue', name: 'Blue' },
        ],
      },
    },
    credits: {
      // Own custom property
      // Custom rendered element in the context menu
      renderer() {
        const elem = document.createElement('marquee');

        elem.style.cssText = 'background: lightgray; color: #222222;';
        elem.textContent = 'Brought to you by...';

        return elem;
      },
      disableSelection: true, // Prevent mouseoever from highlighting the item for selection
      isCommand: false, // Prevent clicks from executing command and closing the menu
    },
  },
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
        ['2017', 10, 11, 12, 13, 15, 16],
        ['2018', 10, 11, 12, 13, 15, 16],
        ['2019', 10, 11, 12, 13, 15, 16],
        ['2020', 10, 11, 12, 13, 15, 16],
        ['2021', 10, 11, 12, 13, 15, 16],
      ]}
      rowHeaders={true}
      colHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      contextMenu={contextMenuSettings}
      // Required for the HTML in the `about` item's label to be rendered safely
      sanitizer={sanitizeMenuLabel}
    />
  );
};

export default ExampleComponent;
