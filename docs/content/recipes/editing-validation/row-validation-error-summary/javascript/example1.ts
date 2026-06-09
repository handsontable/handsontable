import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";

registerAllModules();

type ValidationRule = (value: unknown) => string | null;

const COLUMN_LABELS = ["Item", "Quantity", "Unit price"];

/** Column index -> returns `null` when valid, otherwise an error message. */
const validationRules: Record<number, ValidationRule> = {
  0: (value) => {
    const text = String(value ?? "").trim();

    return text.length > 0 ? null : "Item name is required";
  },
  1: (value) => {
    if (value === null || value === "") {
      return "Quantity is required";
    }

    const n = Number(value);

    return !Number.isNaN(n) && n > 0 && Number.isInteger(n)
      ? null
      : "Quantity must be a positive whole number";
  },
  2: (value) => {
    if (value === null || value === "") {
      return "Unit price is required";
    }

    const n = Number(value);

    return !Number.isNaN(n) && n > 0 ? null : "Unit price must be greater than 0";
  },
};

interface ValidationIssue {
  row: number;
  col: number;
  message: string;
}

const invalidCells = new Set<string>();
let lastIssues: ValidationIssue[] = [];

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

const container = document.querySelector("#example1")!;

const toolbar = document.createElement("div");

toolbar.className = "example-controls-container";

const controlsRow = document.createElement("div");

controlsRow.className = "controls";

const submitBtn = document.createElement("button");

submitBtn.type = "button";
submitBtn.textContent = "Submit orders";

controlsRow.appendChild(submitBtn);
toolbar.appendChild(controlsRow);
container.before(toolbar);

const summaryEl = document.createElement("div");

summaryEl.className = "example-controls-container validation-summary";
summaryEl.setAttribute("aria-live", "polite");

const summaryTitle = document.createElement("p");

summaryTitle.className = "validation-summary__title";
summaryTitle.textContent = "Validation issues";

const summaryList = document.createElement("ul");

summaryList.className = "validation-summary__list";

summaryEl.appendChild(summaryTitle);
summaryEl.appendChild(summaryList);
container.after(summaryEl);

function renderSummary(issues: ValidationIssue[]): void {
  summaryList.innerHTML = issues
    .map(
      (issue) =>
        `<li>Row ${issue.row + 1}, ${COLUMN_LABELS[issue.col]}: ${issue.message}</li>`,
    )
    .join("");
}

function clearHighlights(instance: Handsontable): void {
  invalidCells.forEach((key) => {
    const [r, c] = key.split(":").map(Number);

    instance.removeCellMeta(r, c, "className");
    instance.removeCellMeta(r, c, "title");
  });
  invalidCells.clear();
}

function applyHighlights(instance: Handsontable, issues: ValidationIssue[]): void {
  issues.forEach((issue) => {
    instance.setCellMeta(issue.row, issue.col, "className", "htInvalid");
    instance.setCellMeta(issue.row, issue.col, "title", issue.message);
    invalidCells.add(cellKey(issue.row, issue.col));
  });
  instance.render();
}

const hot = new Handsontable(container, {
  data: [
    { item: "Widget A", qty: 2, price: 19.99 },
    { item: "", qty: 1, price: 5 },
    { item: "Gadget", qty: -1, price: 12 },
    { item: "Cable", qty: 3, price: 0 },
  ],
  colHeaders: COLUMN_LABELS,
  columns: [
    { data: "item", type: "text", width: 180 },
    { data: "qty", type: "numeric", width: 100 },
    { data: "price", type: "numeric", numericFormat: { pattern: "0.00" }, width: 110 },
  ],
  rowHeaders: true,
  height: "auto",
  width: "100%",
  licenseKey: "non-commercial-and-evaluation",
  afterRenderer(TD, row, col) {
    TD.style.backgroundColor = invalidCells.has(cellKey(row, col))
      ? "var(--ht-cell-error-background-color, #ffe4e4)"
      : "";
  },
  afterChange(changes, source) {
    if (source === "loadData" || !changes) {
      return;
    }

    let touched = false;

    for (const change of changes) {
      const [row, prop] = change;
      const col =
        typeof prop === "string" ? this.propToCol(prop) : (prop as number);
      const key = cellKey(row, col);

      if (!invalidCells.has(key)) {
        continue;
      }

      this.removeCellMeta(row, col, "className");
      this.removeCellMeta(row, col, "title");
      invalidCells.delete(key);
      lastIssues = lastIssues.filter((i) => !(i.row === row && i.col === col));
      touched = true;
    }

    if (touched) {
      renderSummary(lastIssues);
      this.render();
    }
  },
});

submitBtn.addEventListener("click", () => {
  clearHighlights(hot);

  const issues: ValidationIssue[] = [];

  for (let row = 0; row < hot.countRows(); row++) {
    for (let col = 0; col < hot.countCols(); col++) {
      const rule = validationRules[col];

      if (!rule) {
        continue;
      }

      const value = hot.getDataAtCell(row, col);
      const message = rule(value);

      if (message !== null) {
        issues.push({ row, col, message });
      }
    }
  }

  lastIssues = issues;
  renderSummary(issues);
  applyHighlights(hot, issues);
});

renderSummary([]);

// eslint-disable-next-line no-unused-vars -- instance wired by event handlers and closures
void hot;
