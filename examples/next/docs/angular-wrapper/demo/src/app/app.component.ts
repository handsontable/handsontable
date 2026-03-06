import { HotTableModule } from "@handsontable/angular-wrapper";
import { Component } from "@angular/core";
import { registerAllModules } from "handsontable/registry";
import { data } from "./constants";
import { PredefinedMenuItemKey } from "handsontable/plugins/contextMenu";
import { addClassesToRows } from "./utils/add-classes-to-rows.function";

// register Handsontable's modules
registerAllModules();

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  initialData = data;
  gridSettings = {
    height: 450,
    colWidths: [180, 220, 140, 120, 120, 120, 140],
    colHeaders: [
      "Company Name",
      "Name",
      "Sell date",
      "In stock",
      "Quantity",
      "Order ID",
      "Country",
    ],
    contextMenu: [
      "cut",
      "copy",
      "---------",
      "row_above",
      "row_below",
      "remove_row",
      "---------",
      "alignment",
      "make_read_only",
      "clear_column",
    ] as PredefinedMenuItemKey[],
    dropdownMenu: true,
    hiddenColumns: {
      indicators: true,
    },
    multiColumnSorting: true,
    filters: true,
    rowHeaders: true,
    headerClassName: "htLeft",
    beforeRenderer: addClassesToRows,
    manualRowMove: true,
    autoWrapRow: true,
    autoWrapCol: true,
    autoRowSize: true,
    manualRowResize: true,
    manualColumnResize: true,
    navigableHeaders: true,
    imeFastEdit: true,
    columns: [
      { data: 1 },
      { data: 3 },
      { data: 4, type: "date", allowInvalid: false },
      { data: 6, type: "checkbox", className: "htCenter" },
      { data: 7, type: "numeric" },
      { data: 5 },
      { data: 2 },
    ],
  };
}
