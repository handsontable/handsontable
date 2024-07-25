import Handsontable from "handsontable";
import "handsontable/dist/handsontable.min.css";
import "@handsontable/pikaday/css/pikaday.css";

// Import sample data and helper functions
import { data, countries } from "./data";

// Get the DOM element with the ID 'handsontable' where the Handsontable will be rendered
const app = document.getElementById("handsontable");

// Define configuration options for the Handsontable
const hotOptions = {
  data,
  height: 464,
  colWidths: [140, 165, 100, 100, 100, 110, 178],
  colHeaders: [
    "Company name",
    "Product name",
    "Sell date",
    "In stock",
    "Qty",
    "Order ID",
    "Country",
  ],
  columns: [
    { data: "companyName", type: "text" },
    { data: "productName", type: "text" },
    {
      data: "sellDate",
      type: "date",
      dateFormat: "DD/MM/YYYY",
      allowInvalid: false,
    },
    {
      data: "inStock",
      type: "checkbox",
      className: "htCenter",
      headerClassName: 'htCenter',
    },
    { 
      data: "qty", 
      type: "numeric",
      headerClassName: 'htRight',
    },
    {
      data: "orderId",
      type: "text",
    },
    {
      data: "country",
      type: "dropdown",
      source: countries,
    },
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true,
  },
  contextMenu: true,
  navigableHeaders: true, // New accessibility feature
  tabNavigation: true, // New accessibility feature
  autoWrapRow: true,
  autoWrapCol: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  headerClassName: "htLeft",
  licenseKey: "non-commercial-and-evaluation",
};

// Initialize the Handsontable instance with the specified configuration options
let hotInstance = new Handsontable(app, hotOptions);

// Helper function to set up checkbox event handling
export const setupCheckbox = (element, callback) =>
  element.addEventListener("click", (clickEvent) => callback(element.checked));

// Set up event listeners for various checkboxes to update Handsontable settings.
// This allows us to change the Handsontable settings from the UI, showcasing
// the flexibility of Handsontable in configuring according to your needs.

// Checkbox: Enable/Disable Tab Navigation
setupCheckbox(document.querySelector("#enable-tab-navigation"), (checked) => {
  hotOptions.tabNavigation = checked;
  hotInstance.updateSettings({
    tabNavigation: hotOptions.tabNavigation,
  });
  console.log(
    `Updated setting: tabNavigation to`,
    hotInstance.getSettings().tabNavigation
  );
});

// Checkbox: Enable/Disable Header Navigation
setupCheckbox(
  document.querySelector("#enable-header-navigation"),
  (checked) => {
    hotOptions.navigableHeaders = checked;
    hotInstance.updateSettings({
      navigableHeaders: hotOptions.navigableHeaders,
    });
    console.log(
      `Updated setting: navigableHeaders to`,
      hotInstance.getSettings().navigableHeaders
    );
  }
);

// Checkbox: Enable/Disable Cell Virtualization
setupCheckbox(
  document.querySelector("#enable-cell-virtualization"),
  (checked) => {
    hotInstance.destroy();
    hotInstance = new Handsontable(document.getElementById("handsontable"), {
      ...hotOptions,
      renderAllRows: !checked,
      viewportColumnRenderingOffset: checked ? "auto" : 9,
    });
    console.log(
      `Updated setting: renderAllRows to`,
      hotInstance.getSettings().renderAllRows
    );
  }
);

// Checkbox: Enable/Disable Cell Enter Editing
setupCheckbox(
  document.querySelector("#enable-cell-enter-editing"),
  (checked) => {
    hotOptions.enterBeginsEditing = checked;
    hotInstance.updateSettings({
      enterBeginsEditing: hotOptions.enterBeginsEditing,
    });
    console.log(
      `Updated setting: enable-cell-enter-editing to`,
      hotInstance.getSettings().enterBeginsEditing
    );
  }
);

// Checkbox: Enable/Disable Arrow Navigation for First/Last Row
setupCheckbox(
  document.querySelector("#enable-arrow-rl-first-last-column"),
  (checked) => {
    hotOptions.autoWrapRow = checked;
    hotInstance.updateSettings({
      autoWrapRow: hotOptions.autoWrapRow,
    });
    console.log(
      `Updated setting: autoWrapRow to`,
      hotInstance.getSettings().autoWrapRow
    );
  }
);

// Checkbox: Enable/Disable Arrow Navigation for First/Last Column
setupCheckbox(
  document.querySelector("#enable-arrow-td-first-last-column"),
  (checked) => {
    hotOptions.autoWrapCol = checked;
    hotInstance.updateSettings({
      autoWrapCol: hotOptions.autoWrapCol,
    });
    console.log(
      `Updated setting: autoWrapCol to`,
      hotInstance.getSettings().autoWrapCol
    );
  }
);

// Checkbox: Enable/Disable Enter Key Focus for Editing
setupCheckbox(
  document.querySelector("#enable-enter-focus-editing"),
  (checked) => {
    hotOptions.enterMoves = checked ? { col: 0, row: 1 } : { col: 0, row: 0 };
    hotInstance.updateSettings({
      enterMoves: hotOptions.enterMoves,
    });
    console.log(
      `Updated setting: enterMoves to`,
      hotInstance.getSettings().enterMoves
    );
  }
);
