import Handsontable from "handsontable/base";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";
import { registerPlugin, Pagination } from "handsontable/plugins";
import { registerCellType, CheckboxCellType } from "handsontable/cellTypes";

import { generateExampleData, getDirectionFromURL, getThemeNameFromURL } from "../../utils";

registerPlugin(Pagination);
registerCellType(CheckboxCellType);
registerLanguageDictionary(arAR);

function createPanel(className, title, items) {
  const panel = document.createElement("div");
  const heading = document.createElement("strong");
  const list = document.createElement("ul");

  panel.className = className;
  panel.style.width = "180px";
  panel.style.boxSizing = "border-box";
  panel.style.padding = "8px 12px";
  panel.style.background = "var(--ht-background-color)";
  panel.style.color = "var(--ht-foreground-color)";
  heading.textContent = title;
  list.style.margin = "8px 0 0";
  list.style.paddingInlineStart = "16px";

  items.forEach((item) => {
    const listItem = document.createElement("li");

    listItem.textContent = item;
    list.appendChild(listItem);
  });

  panel.append(heading, list);

  return panel;
}

export function init() {
  const root = document.getElementById("root");
  const example = document.createElement("div");
  const isRtl = getDirectionFromURL() === "rtl";

  root.appendChild(example);

  const hot = new Handsontable(example, {
    data: generateExampleData(),
    layoutDirection: getDirectionFromURL(),
    language: isRtl ? arAR.languageCode : "en-US",
    themeName: getThemeNameFromURL(),
    width: 900,
    height: 400,
    colWidths: [70, 140, 140, 160],
    colHeaders: ["Active", "Company name", "Country", "Product"],
    columns: [
      { data: 0, type: "checkbox", className: "htCenter", headerClassName: "htCenter" },
      { data: 1, type: "text" },
      { data: 2, type: "text" },
      { data: 3, type: "text" },
    ],
    rowHeaders: true,
    pagination: {
      pageSize: 10,
    },
    licenseKey: "non-commercial-and-evaluation",
  });

  hot.getLayoutManager().register(
    "filtersPanel",
    createPanel("side-panel side-panel-start", "Filters", ["Active only", "Europe", "Asia", "Americas"]),
    { side: "start" }
  );
  hot.getLayoutManager().register(
    "detailsPanel",
    createPanel("side-panel side-panel-end", "Details", ["10 rows per page", "No sorting", "No selection"]),
    { side: "end" }
  );

  window.hotInstance = hot;

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
