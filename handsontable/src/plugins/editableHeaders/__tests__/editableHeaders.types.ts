import Handsontable from 'handsontable';
import type { EditableHeadersSettings, HeaderAxis } from 'handsontable/plugins/editableHeaders';

const axes: HeaderAxis[] = ['column', 'row'];
const settings: EditableHeadersSettings = { columnHeaders: true, rowHeaders: true };

const hot = new Handsontable(document.createElement('div'), {
  editableHeaders: settings,
  columns: [{ editableHeaders: false }],
  beforeHeaderChange(axis, visualIndex, newValue, oldValue) {
    const typedAxis: HeaderAxis = axis;
    const typedIndex: number = visualIndex;
    const typedValue: string = newValue;

    return typedAxis === 'column' && typedIndex > 0 && typedValue !== oldValue ? false : undefined;
  },
  afterHeaderChange(axis, visualIndex, newValue) {
    const typedAxis: HeaderAxis = axis;
    const typedIndex: number = visualIndex;
    const typedValue: string = newValue;

    return [typedAxis, typedIndex, typedValue];
  },
});
const editableHeaders = hot.getPlugin('editableHeaders');

axes.forEach((axis) => {
  const editable: boolean = editableHeaders.isEditable(axis, 0);
  const renamed: boolean = editableHeaders.setHeader(axis, 0, 'Name');
  const name: string | undefined = editableHeaders.getHeader(axis, 0);
  const opened: boolean = editableHeaders.openEditor(axis, 0);

  editableHeaders.closeEditor(false);
  editableHeaders.clearHeaders(axis);

  return [editable, renamed, name, opened, editableHeaders.isEditorOpened()];
});

editableHeaders.clearHeaders();

// @ts-expect-error: the axis is 'column' or 'row'
editableHeaders.setHeader('cell', 0, 'Name');
