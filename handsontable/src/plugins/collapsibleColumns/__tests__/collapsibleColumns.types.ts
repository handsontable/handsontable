import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const collapsibleColumns = hot.getPlugin('collapsibleColumns');

collapsibleColumns.enablePlugin();
collapsibleColumns.disablePlugin();
collapsibleColumns.updatePlugin();
collapsibleColumns.collapseAll();
collapsibleColumns.collapseSection({ row: -1, col: 1 })
collapsibleColumns.expandAll();
collapsibleColumns.expandSection({ row: -1, col: 1 });
collapsibleColumns.toggleAllCollapsibleSections('collapse');
collapsibleColumns.toggleAllCollapsibleSections('expand');
collapsibleColumns.toggleCollapsibleSection({ row: -1, col: 1 }, 'collapse');
collapsibleColumns.toggleCollapsibleSection({ row: -1, col: 1 }, 'expand');
