import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import { CellProperties } from "handsontable/settings";
import { editorFactory } from "handsontable/editors";
import { rendererFactory } from "handsontable/renderers";
// Register all Handsontable's modules.
registerAllModules();

/* start:skip-in-preview */

const inputData = [
  {
    id: 640329,
    itemName: "Lunar Core",
    itemNo: "XJ-12",
    leadEngineer: "Ellen Ripley",
    cost: 350000,
    inStock: true,
    category: "Lander",
    itemQuality: 87,
    origin: "🇺🇸 USA",
    quantity: 2,
    valueStock: 700000,
    repairable: false,
    supplierName: "TechNova",
    restockDate: "2025-08-01",
    operationalStatus: "Awaiting Parts",
  },
  {
    id: 863104,
    itemName: "Zero Thrusters",
    itemNo: "QL-54",
    leadEngineer: "Sam Bell",
    cost: 450000,
    inStock: false,
    category: "Propulsion",
    itemQuality: 0,
    origin: "🇩🇪 Germany",
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: "PropelMax",
    restockDate: "2025-09-15",
    operationalStatus: "In Maintenance",
  },
  {
    id: 395603,
    itemName: "EVA Suits",
    itemNo: "PM-67",
    leadEngineer: "Alex Rogan",
    cost: 150000,
    inStock: true,
    category: "Equipment",
    itemQuality: 79,
    origin: "🇮🇹 Italy",
    quantity: 50,
    valueStock: 7500000,
    repairable: true,
    supplierName: "SuitCraft",
    restockDate: "2025-10-05",
    operationalStatus: "Ready for Testing",
  },
  {
    id: 679083,
    itemName: "Solar Panels",
    itemNo: "BW-09",
    leadEngineer: "Dave Bowman",
    cost: 75000,
    inStock: true,
    category: "Energy",
    itemQuality: 95,
    origin: "🇺🇸 USA",
    quantity: 10,
    valueStock: 750000,
    repairable: false,
    supplierName: "SolarStream",
    restockDate: "2025-11-10",
    operationalStatus: "Operational",
  },
  {
    id: 912663,
    itemName: "Comm Array",
    itemNo: "ZR-56",
    leadEngineer: "Louise Banks",
    cost: 125000,
    inStock: false,
    category: "Communication",
    itemQuality: 0,
    origin: "🇯🇵 Japan",
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: "CommTech",
    restockDate: "2025-12-20",
    operationalStatus: "Decommissioned",
  },
  {
    id: 315806,
    itemName: "Habitat Dome",
    itemNo: "UJ-23",
    leadEngineer: "Dr. Ryan Stone",
    cost: 1000000,
    inStock: true,
    category: "Shelter",
    itemQuality: 93,
    origin: "🇨🇦 Canada",
    quantity: 3,
    valueStock: 3000000,
    repairable: false,
    supplierName: "DomeInnovate",
    restockDate: "2026-01-25",
    operationalStatus: "Operational",
  },
  {
    id: 954632,
    itemName: "Oxygen Unit",
    itemNo: "FK-87",
    leadEngineer: "Dr. Grace Augustine",
    cost: 600000,
    inStock: true,
    category: "Life Support",
    itemQuality: 85,
    origin: "🇺🇸 USA",
    quantity: 15,
    valueStock: 9000000,
    repairable: true,
    supplierName: "OxyGenius",
    restockDate: "2026-03-02",
    operationalStatus: "Awaiting Parts",
  },
  {
    id: 734944,
    itemName: "Processing Rig",
    itemNo: "LK-13",
    leadEngineer: "Jake Sully",
    cost: 350000,
    inStock: true,
    category: "Mining",
    itemQuality: 81,
    origin: "🇦🇺 Australia",
    quantity: 25,
    valueStock: 8750000,
    repairable: true,
    supplierName: "RigTech",
    restockDate: "2026-04-15",
    operationalStatus: "Ready for Testing",
  },
  {
    id: 834662,
    itemName: "Navigation Module",
    itemNo: "XP-24",
    leadEngineer: "Dr. Ellie Arroway",
    cost: 450000,
    inStock: true,
    category: "Navigation",
    itemQuality: 89,
    origin: "🇫🇷 France",
    quantity: 8,
    valueStock: 3600000,
    repairable: false,
    supplierName: "NavSolutions",
    restockDate: "2026-05-30",
    operationalStatus: "In Maintenance",
  },
  {
    id: 714329,
    itemName: "Surveyor Arm",
    itemNo: "QA-86",
    leadEngineer: "Mark Watney",
    cost: 100000,
    inStock: true,
    category: "Exploration",
    itemQuality: 78,
    origin: "🇺🇸 USA",
    quantity: 40,
    valueStock: 4000000,
    repairable: true,
    supplierName: "ExploreTech",
    restockDate: "2026-07-12",
    operationalStatus: "Decommissioned",
  },
  {
    id: 291439,
    itemName: "Habitat Dome",
    itemNo: "UJ-24",
    leadEngineer: "Jane Doe",
    cost: 1100000,
    inStock: true,
    category: "Shelter",
    itemQuality: 92,
    origin: "🇬🇧 UK",
    quantity: 4,
    valueStock: 4400000,
    repairable: false,
    supplierName: "DomeInnovate",
    restockDate: "2026-02-01",
    operationalStatus: "Operational",
  },
  {
    id: 485199,
    itemName: "Power Generator",
    itemNo: "PG-11",
    leadEngineer: "John Smith",
    cost: 500000,
    inStock: true,
    category: "Energy",
    itemQuality: 85,
    origin: "🇨🇳 China",
    quantity: 7,
    valueStock: 3500000,
    repairable: true,
    supplierName: "PowerCo",
    restockDate: "2026-03-10",
    operationalStatus: "Operational",
  },
  {
    id: 271418,
    itemName: "Life Support System",
    itemNo: "LS-22",
    leadEngineer: "Mike Johnson",
    cost: 800000,
    inStock: false,
    category: "Life Support",
    itemQuality: 80,
    origin: "🇯🇵 Japan",
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: "LifeTech",
    restockDate: "2026-04-20",
    operationalStatus: "Awaiting Parts",
  },
  {
    id: 390776,
    itemName: "Mars Rover",
    itemNo: "MR-33",
    leadEngineer: "Anna Davis",
    cost: 2000000,
    inStock: true,
    category: "Exploration",
    itemQuality: 90,
    origin: "🇮🇳 India",
    quantity: 5,
    valueStock: 10000000,
    repairable: false,
    supplierName: "RoverWorks",
    restockDate: "2026-05-15",
    operationalStatus: "Operational",
  },
  {
    id: 672342,
    itemName: "Hydroponics Module",
    itemNo: "HM-44",
    leadEngineer: "Robert Brown",
    cost: 450000,
    inStock: true,
    category: "Life Support",
    itemQuality: 88,
    origin: "🇦🇺 Australia",
    quantity: 6,
    valueStock: 2700000,
    repairable: true,
    supplierName: "GreenGrow",
    restockDate: "2026-06-25",
    operationalStatus: "Operational",
  },
  {
    id: 907454,
    itemName: "Satellite Dish",
    itemNo: "SD-55",
    leadEngineer: "Emily Wilson",
    cost: 300000,
    inStock: false,
    category: "Communication",
    itemQuality: 70,
    origin: "🇺🇸 USA",
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: "CommTech",
    restockDate: "2026-07-05",
    operationalStatus: "Decommissioned",
  },
  {
    id: 841637,
    itemName: "Thermal Regulator",
    itemNo: "TR-66",
    leadEngineer: "Olivia Taylor",
    cost: 650000,
    inStock: true,
    category: "Energy",
    itemQuality: 82,
    origin: "🇷🇺 Russia",
    quantity: 8,
    valueStock: 5200000,
    repairable: false,
    supplierName: "ThermoTech",
    restockDate: "2026-08-15",
    operationalStatus: "Operational",
  },
  {
    id: 947335,
    itemName: "Landing Gear",
    itemNo: "LG-77",
    leadEngineer: "David Lee",
    cost: 250000,
    inStock: true,
    category: "Lander",
    itemQuality: 75,
    origin: "🇫🇷 France",
    quantity: 10,
    valueStock: 2500000,
    repairable: false,
    supplierName: "LandingWorks",
    restockDate: "2026-09-20",
    operationalStatus: "Operational",
  },
  {
    id: 629849,
    itemName: "Radiation Shield",
    itemNo: "RS-88",
    leadEngineer: "Sophia Martinez",
    cost: 900000,
    inStock: true,
    category: "Equipment",
    itemQuality: 95,
    origin: "🇧🇷 Brazil",
    quantity: 3,
    valueStock: 2700000,
    repairable: false,
    supplierName: "ShieldPro",
    restockDate: "2026-10-30",
    operationalStatus: "Operational",
  },
  {
    id: 519304,
    itemName: "Fuel Cell",
    itemNo: "FC-99",
    leadEngineer: "James Anderson",
    cost: 550000,
    inStock: true,
    category: "Propulsion",
    itemQuality: 89,
    origin: "🇨🇦 Canada",
    quantity: 5,
    valueStock: 2750000,
    repairable: true,
    supplierName: "FuelWorks",
    restockDate: "2026-11-22",
    operationalStatus: "Operational",
  },
];

export const data = inputData.map((el) => ({
  ...el,
  stars: Math.floor(Math.random() * 5) + 1,
}));

/* end:skip-in-preview */

// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector("#example1")!;

const cellDefinition: Pick<
  CellProperties,
  "renderer" | "validator" | "editor"
> = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = Array.from(
      { length: 5 },
      (_, index) =>
        `<span style="opacity: ${index < value ? "1" : "0.4"}">⭐</span>`,
    ).join("");

    return td;
  }),
  validator: (value, callback) => {
    value = parseInt(value);
    callback(value >= 0 && value <= 100);
  },

  editor: editorFactory<{ input: HTMLDivElement }>({
    shortcuts: [
      {
        keys: [["1"], ["2"], ["3"], ["4"], ["5"]],
        callback: (editor, _event) => {
          editor.setValue((_event as KeyboardEvent).key);
        },
      },
      {
        keys: [["ArrowRight"]],
        callback: (editor, _event) => {
          if (parseInt(editor.value) < 5) {
            editor.setValue(parseInt(editor.value) + 1);
          }
        },
      },
      {
        keys: [["ArrowLeft"]],
        callback: (editor, _event) => {
          if (parseInt(editor.value) > 1) {
            editor.setValue(parseInt(editor.value) - 1);
          }
        },
      },
    ],
    init(editor) {
      editor.input = editor.hot.rootDocument.createElement(
        "DIV",
      ) as HTMLDivElement;
      editor.input.style =
        "background: #eee; padding: 5px 8px; border:1px solid blue; cursor: pointer; border-radius: 4px; font-size: 16px;";
    },
    afterInit(editor) {
      editor.input.addEventListener("mouseover", (event) => {
        if (
          event.target instanceof HTMLSpanElement &&
          event.target.dataset.value &&
          parseInt(editor.value) !== parseInt(event.target.dataset.value)
        ) {
          editor.setValue(event.target.dataset.value);
        }
      });
      editor.input.addEventListener("mousedown", () => {
        editor.finishEditing();
      });
    },
    render(editor) {
      editor.input.innerHTML = Array.from(
        { length: 5 },
        (_, index) =>
          `<span data-value="${index + 1}" style="opacity: ${
            index < editor.value ? "1" : "0.4"
          }">⭐</span>`,
      ).join("");
    },
  }),
};

// Define configuration options for the Handsontable
const hotOptions: Handsontable.GridSettings = {
  themeName: "ht-theme-main",
  data,
  colHeaders: ["ID", "Item Name", "Restock Date"],
  autoRowSize: true,
  rowHeaders: true,
  height: "auto",
  autoWrapRow: true,
  columns: [
    { data: "id", type: "numeric" },
    {
      data: "itemName",
      type: "text",
    },
    {
      data: "stars",
      width: 100,
      ...cellDefinition,
    },
  ],
  licenseKey: "non-commercial-and-evaluation",
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);
