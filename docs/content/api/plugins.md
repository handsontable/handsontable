---
title: Plugins
metaTitle: Plugins API reference | Handsontable DataGrid for JavaScript
description: A complete list of Handsontable's plugins that can extend your data grid's capabilities.
permalink: /api/plugins
canonicalUrl: /api/plugins
searchCategory: API Reference
react:
  metaTitle: Plugins API reference | Handsontable DataGrid for React
angular:
  metaTitle: Plugins API reference | Handsontable DataGrid for Angular
vue:
  metaTitle: Plugins API reference | Handsontable DataGrid for Vue
---
|Plugin Name  | Description |
|--|--|
|[AutoColumnSize](@/api/autoColumnSize.md) |Automatically adjusts the column's width to the size of the content.|
|[AutoLink](@/api/autoLink.md)| Renders the URLs found in cell values as clickable links.|
|[AutoRowHeaderSize](@/api/autoRowHeaderSize.md)| Automatically adjusts the row header's width to the size of its longest label.|
|[AutoRowSize](@/api/autoRowSize.md)| Automatically adjusts the row's height to the size of the content.|
|[Autofill](@/api/autofill.md)| Drag the fill handle - a square in the bottom right corner of the cell to fill cells with the data series.|
|[BindRowsWithHeaders](@/api/bindRowsWithHeaders.md)| Bind rows with headers to lock the row number, always displaying them side by side. Especially useful when each row has its unique ID.|
|[CollapsibleColumns](@/api/collapsibleColumns.md)| Expand and collapse columns.|
|[ColumnSorting](@/api/columnSorting.md)| Sort data in ascending or descending order throughout the column (note: this plugin also represents the ability to sort rows, its name might cause confusion).|
|[ColumnSummary](@/api/columnSummary.md) |Make pre-defined basic calculations (such as average, sum, max, min) and display the results.|
|[Comments](@/api/comments.md) | Provide an additional note about the cell to help better understand its content.|
|[ContextMenu](@/api/contextMenu.md) |Right-click to open a context menu.|
|[CopyPaste](@/api/copyPaste.md)| Copy, cut, and paste data.|
|[CustomBorders](@/api/customBorders.md) |Apply a custom border style around a single cell or a range of cells.|
|[DragToScroll](@/api/dragToScroll.md) |Drag the selection outside of the viewport to enable scrolling.|
|[DropdownMenu](@/api/dropdownMenu.md) |Add a menu to the column header to enable additional operations for the column.|
|[ExportFile](@/api/exportFile.md) |Export the data to a CSV or an Excel (`.xlsx`) file, as a download or a Blob (CSV also as a string), with no extra library.|
|[Filters](@/api/filters.md) |Display rows that meet your criteria and hide the rest.|
|[Formulas](@/api/formulas.md) | Use Excel-like functions inside of cells to perform calculations.|
|[FreezeBar](@/api/freezeBar.md) | Change the number of frozen rows and columns by dragging a bar on the freeze line, or with the keyboard.|
|[HiddenColumns](@/api/hiddenColumns.md) | Hide specific columns. |
|[HiddenRows](@/api/hiddenRows.md) | Hide specific rows.|
|[ImportFile](@/api/importFile.md) | Load an Excel (`.xlsx`) workbook into the data grid, with cell types, dropdown sources, formulas, and layout derived from the file.|
|[ManualColumnFreeze](@/api/manualColumnFreeze.md) | Pin the columns to the left to keep them visible while scrolling.|
|[ManualColumnMove](@/api/manualColumnMove.md) | Drag a column to change its order in the data grid.|
|[ManualColumnResize](@/api/manualColumnResize.md) | Drag the sizing handle to change the width of a column.|
|[ManualRowMove](@/api/manualRowMove.md) | Drag a row to change its order in the data grid.|
|[ManualRowResize](@/api/manualRowResize.md) | Drag the sizing handle to change the height of a row.|
|[MergeCells](@/api/mergeCells.md) | Span the cells across multiple rows or columns.|
|[MultiColumnSorting](@/api/multiColumnSorting.md)| Sort the rows by multiple columns.|
|[NestedHeaders](@/api/nestedHeaders.md) | Create a nested, hierarchical structure of column headers to put your data into groups.|
|[NestedRows](@/api/nestedRows.md) | Enable editable views of data sources with nested (tree/parent-child) structures.|
|[Pagination](@/api/pagination.md)| Display data in pages and navigate through them using pagination controls.|
|[Search](@/api/search.md) | Search for specific values in the displayed data across the table.|
|[SheetsBar](@/api/sheetsBar.md) | Show several sheets in one data grid, and switch, add, rename, duplicate, move, and remove them from a tab bar.|
|[TrimRows](@/api/trimRows.md) | Exclude the specific rows from being rendered and calculated by the data grid. This feature is mainly used internally, for example, in the filter plugin.|
|[UndoRedo](@/api/undoRedo.md)| Undo or redo changes made by the user.|
