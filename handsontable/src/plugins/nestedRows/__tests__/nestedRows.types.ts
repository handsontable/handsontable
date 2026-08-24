import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  nestedRows: true,
});
const plugin = hot.getPlugin('nestedRows');

// Collapsing and expanding.
plugin.collapseAll();
plugin.expandAll();

const collapsed: boolean = plugin.collapseParent(0);
const expanded: boolean = plugin.expandParent(0);
const toggled: boolean = plugin.toggleParent(0);

// Reading the collapsed state.
const collapsedParents: number[] = plugin.getCollapsedParents();
const isCollapsed: boolean = plugin.isParentCollapsed(0);

// Reading the structure.
const isParent: boolean = plugin.isParent(0);
const level: number | null = plugin.getRowLevel(0);
const parentRow: number | null = plugin.getRowParent(1);
const directChildren: number = plugin.countChildren(0);
const allDescendants: number = plugin.countChildren(0, true);

// Navigating.
const revealed: boolean = plugin.expandToRow(3);

plugin.expandToLevel(1);

// The collapse and expand hooks.
new Handsontable(document.createElement('div'), {
  nestedRows: true,
  beforeRowCollapse: (currentCollapsedRows, destinationCollapsedRows, collapsePossible) => {
    const current: number[] = currentCollapsedRows;
    const destination: number[] = destinationCollapsedRows;
    const possible: boolean = collapsePossible;

    return current.length === destination.length ? possible : false;
  },
  afterRowCollapse: (currentCollapsedRows, destinationCollapsedRows, collapsePossible, successfullyCollapsed) => {
    const current: number[] = currentCollapsedRows;
    const destination: number[] = destinationCollapsedRows;
    const possible: boolean = collapsePossible;
    const performed: boolean = successfullyCollapsed;
  },
  beforeRowExpand: (currentCollapsedRows, destinationCollapsedRows, expandPossible) => {
    const current: number[] = currentCollapsedRows;
    const destination: number[] = destinationCollapsedRows;
    const possible: boolean = expandPossible;

    return false;
  },
  afterRowExpand: (currentCollapsedRows, destinationCollapsedRows, expandPossible, successfullyExpanded) => {
    const current: number[] = currentCollapsedRows;
    const destination: number[] = destinationCollapsedRows;
    const possible: boolean = expandPossible;
    const performed: boolean = successfullyExpanded;
  },
});

// The internals stay reachable, so code written against them keeps compiling.
const collapsingUI = plugin.collapsingUI;
const dataManager = plugin.dataManager;

hot.addHook('afterRowCollapse', (current, destination, possible, performed) => {});
hot.addHook('beforeRowExpand', () => false);
