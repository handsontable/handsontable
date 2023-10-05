import Handsontable from "handsontable";
import "handsontable/dist/handsontable.min.css";
import "pikaday/css/pikaday.css";

import { data, countries } from "./data";
import { progressBarRenderer, starRenderer } from "./customRenderers";

import {
  alignHeaders,
  addClassesToRows,
  changeCheckboxCell,
} from "./hooksCallbacks";

// Get the DOM element with the ID 'handsontable' where the Handsontable will be rendered

const app = document.getElementById("handsontable");

// Define configuration options for the Handsontable
const hotOptions = {
  data,
  height: 464,
  colWidths: [140, 165, 100, 100, 100, 90, 90, 110, 178],
  colHeaders: [
    "Company name",
    "Product name",
    "Sell date",
    "In stock",
    "Qty",
    "Progress",
    "Rating",
    "Order ID",
    "Country",
  ],
  columns: [
    { data: "companyName", type: "text" },
    { data: "productName", type: "text" },
    {
      data: "sellDate",
      type: "date",
      allowInvalid: false,
    },
    {
      data: "inStock",
      type: "checkbox",
      className: "htCenter",
    },
    { data: "qty", type: "numeric" },
    {
      data: "progress",
      renderer: progressBarRenderer,
      readOnly: true,
      className: "htMiddle",
    },
    {
      data: "rating",
      renderer: starRenderer,
      readOnly: true,
      className: "star htCenter",
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
  navigableHeaders: true, // new a11y
  disableTabNavigation: false, // new a11y
  autoWrapRow: true,
  autoWrapCol: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  rowHeaders: true,
  nestedRows: true,
  afterGetColHeader: alignHeaders,
  afterOnCellMouseDown: changeCheckboxCell,
  beforeRenderer: addClassesToRows,
  licenseKey: "non-commercial-and-evaluation",
};

// Initialize the Handsontable instance with the specified configuration options
let hotInstance = new Handsontable(app, hotOptions);

// Helper function to set up checkbox event handling
export const setupCheckbox = (element, callback) =>
  element.addEventListener("click", (clickEvent) => callback(element.checked));

// Set up event listeners for various checkboxes to update Handsontable settings
setupCheckbox(document.querySelector("#enableTabNavigation"), (checked) => {
  hotOptions.disableTabNavigation = !checked;
  hotInstance.updateSettings({
    disableTabNavigation: hotOptions.disableTabNavigation,
  });
  console.log(
    `Updated setting: disableTabNavigation to`,
    hotInstance.getSettings().disableTabNavigation
  );
});
setupCheckbox(document.querySelector("#enableHeaderNavigation"), (checked) => {
  hotOptions.navigableHeaders = checked;
  hotInstance.updateSettings({
    navigableHeaders: hotOptions.navigableHeaders,
  });
  console.log(
    `Updated setting: navigableHeaders to`,
    hotInstance.getSettings().navigableHeaders
  );
});
setupCheckbox(
  document.querySelector("#enableCellVirtualization"),
  (checked) => {
    hotInstance.destroy();
    hotInstance = new Handsontable(document.getElementById("handsontable"), {
      ...hotOptions,
      renderAllRows: !checked,
    });
    console.log(
      `Updated setting: renderAllRows to`,
      hotInstance.getSettings().renderAllRows
    );
  }
);
setupCheckbox(document.querySelector("#enableCellEnterEditing"), (checked) => {
  hotOptions.enterBeginsEditing = checked;
  hotInstance.updateSettings({
    enterBeginsEditing: hotOptions.enterBeginsEditing,
  });
  console.log(
    `Updated setting: enableCellEnterEditing to`,
    hotInstance.getSettings().enterBeginsEditing
  );
});
setupCheckbox(
  document.querySelector("#enableArrowRLFirstLastColumn"),
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
setupCheckbox(
  document.querySelector("#enableArrowTDFirstLastColumn"),
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
setupCheckbox(document.querySelector("#enableEnterFocusEditing"), (checked) => {
  hotOptions.enterMoves = checked ? { col: 0, row: 1 } : { col: 0, row: 0 };
  hotInstance.updateSettings({
    enterMoves: hotOptions.enterMoves,
  });
  console.log(
    `Updated setting: enterMoves to`,
    hotInstance.getSettings().enterMoves
  );
});
