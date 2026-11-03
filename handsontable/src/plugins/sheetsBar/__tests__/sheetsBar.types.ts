import Handsontable from 'handsontable';
import type { SheetsBar } from 'handsontable/plugins/sheetsBar';

const hot = new Handsontable(document.createElement('div'), {
  sheetsBar: {
    sheets: [
      { name: 'Budget', data: [[1, 2]] },
      { name: 'Staff', data: [{ name: 'Ana', department: 'Engineering' }] },
    ],
  },
  beforeSheetTabAdd(name, duplicateOfId, source) {
    const typedName: string | null = name;
    const typedDuplicateOfId: number | null = duplicateOfId;
    const typedSource: string = source;

    return typedName === null && typedDuplicateOfId === null && typedSource === 'SheetsBar.api' ? false : undefined;
  },
  afterSheetTabAdd(sheetId, name, duplicateOfId, source) {
    const typedSheetId: number = sheetId;
    const typedName: string = name;
    const typedDuplicateOfId: number | null = duplicateOfId;
    const typedSource: string = source;

    return [typedSheetId, typedName, typedDuplicateOfId, typedSource];
  },
});

const sheetsBar: SheetsBar = hot.getPlugin('sheetsBar');
const added = sheetsBar.addSheet('Forecast');
const copy = sheetsBar.duplicateSheet(added === null ? 1 : added.id);
const sheets: Array<{ id: number, name: string, isActive: boolean }> = sheetsBar.getSheets();
const moved: boolean = sheetsBar.moveSheetToIndex(sheets[0].id, 1);
const renamed: boolean = sheetsBar.renameSheet(sheets[0].id, 'Totals');
const removed: boolean = sheetsBar.removeSheet(copy === null ? 1 : copy.id);
const switched: boolean = sheetsBar.setActiveSheet('Budget');
const updated: boolean = sheetsBar.updateSheetSettings('Budget', { readOnly: true });

hot.addHook('beforeSheetTabAdd', (name, duplicateOfId, source) => {
  return name === 'x' && duplicateOfId === 1 && source === 'SheetsBar.ui' ? false : undefined;
});
hot.addHook('afterSheetTabAdd', (sheetId, name, duplicateOfId, source) => {
  return `${sheetId}${name}${duplicateOfId}${source}${moved}${renamed}${removed}${switched}${updated}`;
});

// @ts-expect-error a sheet's position is a number
sheetsBar.moveSheetToIndex(sheets[0].id, '1');
