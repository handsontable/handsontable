module.exports = {
  sidebar: [
    {
      title: 'Core API',
      children: ['introduction', 'core', 'hooks', 'options'],
    },
    {
      title: 'Columns',
      children: [
        'autoColumnSize', 'collapsibleColumns', 'columnSorting', 'columnSummary',
        'hiddenColumns', 'manualColumnFreeze', 'manualColumnMove',
        'manualColumnResize', 'multiColumnSorting', 'nestedHeaders', 'stretchColumns',
      ],
    },
    {
      title: 'Rows',
      children: [
        'autoRowSize', 'bindRowsWithHeaders', 'hiddenRows',
        'manualRowMove', 'manualRowResize', 'nestedRows', 'trimRows',
      ],
    },
    {
      title: 'Cells',
      children: ['autofill', 'comments', 'customBorders', 'formulas', 'mergeCells'],
    },
    {
      title: 'Menus & UI',
      children: [
        'contextMenu', 'dropdownMenu', 'dialog', 'dragToScroll',
        'emptyDataState', 'loading',
      ],
    },
    {
      title: 'Data & tools',
      children: ['copyPaste', 'exportFile', 'filters', 'pagination', 'search', 'undoRedo'],
    },
    {
      title: 'Classes & utilities',
      children: [
        'baseEditor', 'basePlugin', 'cellCoords', 'cellRange',
        'changesObserver', 'dataMap', 'eventManager', 'ghostTable', 'samplesGenerator',
        'shortcutManager', 'shortcutContext', 'focusScopeManager',
        'createShortcutManager', 'createFocusScopeManager',
        'indexMapper', 'indexMap', 'indexesSequence',
        'hidingMap', 'trimmingMap',
        'physicalIndexToValueMap', 'linkedPhysicalIndexToValueMap',
      ],
    },
  ],
};
