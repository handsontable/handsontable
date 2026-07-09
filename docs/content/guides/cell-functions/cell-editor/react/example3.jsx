import { HotTable } from '@handsontable/react-wrapper';
import { TextEditor } from 'handsontable/editors/textEditor';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

class PasswordEditor extends TextEditor {
  createElements() {
    super.createElements();
    this.TEXTAREA = this.hot.rootDocument.createElement('input');
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.setAttribute('data-hot-input', 'true');
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = '0';
    this.textareaStyle.height = '0';
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

function maskedRenderer(_instance, td, _row, _col, _prop, value) {
  td.innerText = value ? '●●●●●●●●' : '—';
  td.style.letterSpacing = value ? '2px' : 'normal';

  return td;
}

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['Alice Chen', 'alice@example.com', 'Admin', 'Wh1stl3!2024'],
        ['Bob Garcia', 'bob@example.com', 'Editor', 'P@ssw0rd42'],
        ['Carol Smith', 'carol@example.com', 'Viewer', 'Tr0ub4dor&3'],
        ['Dave Kim', 'dave@example.com', 'Editor', 'c0rrectH0rs3'],
        ['Eve Johnson', 'eve@example.com', 'Admin', 'Sup3rS3cr3t!'],
      ]}
      colHeaders={['Name', 'Email', 'Role', 'Password']}
      columns={[
        { type: 'text' },
        { type: 'text' },
        { type: 'text' },
        { editor: PasswordEditor, renderer: maskedRenderer },
      ]}
      colWidths={[130, 190, 70, 130]}
      rowHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
