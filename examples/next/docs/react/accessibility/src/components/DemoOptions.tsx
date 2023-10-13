import { ToggleableOptions } from "../App";

type OptionCheckboxName =
  | "enableTabNavigation"
  | "enableHeaderNavigation"
  | "enableCellVirtualization"
  | "enableCellEnterEditing"
  | "enableArrowRLFirstLastColumn"
  | "enableArrowTDFirstLastColumn"
  | "enableEnterFocusEditing";

interface DemoOptions extends ToggleableOptions {
  changeToggleOptions: React.Dispatch<React.SetStateAction<ToggleableOptions>>;
}

function DemoOptions({
  disableTabNavigation,
  navigableHeaders,
  renderAllRows,
  enterBeginsEditing,
  autoWrapRow,
  autoWrapCol,
  enterMoves,
  changeToggleOptions,
}: DemoOptions) {
  const handleCheckboxChange = (checkboxName: OptionCheckboxName) => {
    switch (checkboxName) {
      case "enableTabNavigation":
        changeToggleOptions((existing) => ({
          ...existing,
          disableTabNavigation: !disableTabNavigation,
        }));
        break;
      case "enableHeaderNavigation":
        changeToggleOptions((existing) => ({
          ...existing,
          navigableHeaders: !navigableHeaders,
        }));
        break;
      case "enableCellVirtualization":
        changeToggleOptions((existing) => ({
          ...existing,
          renderAllRows: !renderAllRows,
          viewportColumnRenderingOffset: renderAllRows ? "auto" : 9,
        }));
        break;
      case "enableCellEnterEditing":
        changeToggleOptions((existing) => ({
          ...existing,
          enterBeginsEditing: !enterBeginsEditing,
        }));
        break;
      case "enableArrowRLFirstLastColumn":
        changeToggleOptions((existing) => ({
          ...existing,
          autoWrapRow: !autoWrapRow,
        }));
        break;
      case "enableArrowTDFirstLastColumn":
        changeToggleOptions((existing) => ({
          ...existing,
          autoWrapCol: !autoWrapCol,
        }));
        break;
      case "enableEnterFocusEditing":
        changeToggleOptions((existing) => ({
          ...existing,
          enterMoves:
            enterMoves.row !== 1 ? { col: 0, row: 1 } : { col: 0, row: 0 },
        }));
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="checkboxContainer">
        <div className="checkboxGroup">
          <div>
            <label
              className="optionLabel"
              htmlFor="enableTabNavigation"
              id="tabNavigationLabel"
            >
              <input
                checked={!disableTabNavigation}
                type="checkbox"
                id="enableTabNavigation"
                name="enableTabNavigation"
                aria-label="Enable navigation with the Tab key"
                onChange={() => handleCheckboxChange("enableTabNavigation")}
              />
              Enable navigation with the Tab key
            </label>
          </div>
          <div>
            <label
              className="optionLabel"
              htmlFor="enableHeaderNavigation"
              id="headerNavigationLabel"
            >
              <input
                checked={navigableHeaders}
                type="checkbox"
                id="enableHeaderNavigation"
                name="enableHeaderNavigation"
                aria-labelledby="headerNavigationLabel"
                onChange={() => handleCheckboxChange("enableHeaderNavigation")}
              />
              Enable navigation across headers
            </label>
          </div>
          <div>
            <label
              className="optionLabel"
              htmlFor="enableCellVirtualization"
              id="cellVirtualizationLabel"
            >
              <input
                checked={!renderAllRows}
                type="checkbox"
                id="enableCellVirtualization"
                name="enableCellVirtualization"
                aria-labelledby="cellVirtualizationLabel"
                onChange={() =>
                  handleCheckboxChange("enableCellVirtualization")
                }
              />
              Enable cells virtualization
            </label>
          </div>
          <div>
            <label
              className="optionLabel"
              htmlFor="enableCellEnterEditing"
              id="cellEnterEditingLabel"
            >
              <input
                checked={enterBeginsEditing}
                type="checkbox"
                id="enableCellEnterEditing"
                name="enableCellEnterEditing"
                aria-labelledby="cellEnterEditingLabel"
                onChange={() => handleCheckboxChange("enableCellEnterEditing")}
              />
              The Enter key begins cell editing
            </label>
            <a
              href="api/options/#enterbeginsediting"
              target="_blank"
              className="externalLink"
              rel="noopener noreferrer"
              aria-label="Learn more about Enter key cell editing (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-external-link"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </a>
          </div>
        </div>
        <div className="checkboxGroup">
          <div>
            <label
              className="optionLabel"
              htmlFor="enableArrowRLFirstLastColumn"
              id="arrowRLFirstLastColumnLabel"
            >
              {" "}
              <input
                checked={autoWrapRow}
                type="checkbox"
                id="enableArrowRLFirstLastColumn"
                name="enableArrowFirstLastColumn"
                aria-labelledby="arrowRLFirstLastColumnLabel"
                onChange={() =>
                  handleCheckboxChange("enableArrowRLFirstLastColumn")
                }
              />
              The right/left arrow keys move the focus to the first/last column
            </label>
            <a
              href="api/options/#autowrapcol"
              target="_blank"
              className="externalLink"
              rel="noopener noreferrer"
              aria-label="Learn more about right/left arrow key behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-external-link"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </a>
          </div>
          <div>
            <label
              className="optionLabel"
              htmlFor="enableArrowTDFirstLastColumn"
              id="arrowTDFirstLastColumnLabel"
            >
              <input
                checked={autoWrapCol}
                type="checkbox"
                id="enableArrowTDFirstLastColumn"
                name="enableArrowTDFirstLastColumn"
                aria-labelledby="arrowTDFirstLastColumnLabel"
                onChange={() =>
                  handleCheckboxChange("enableArrowTDFirstLastColumn")
                }
              />
              The up/down arrow keys move the focus to the first/last row
            </label>
            <a
              href="api/options/#autowraprow"
              target="_blank"
              className="externalLink"
              rel="noopener noreferrer"
              aria-label="Learn more about up/down arrow key behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-external-link"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </a>
          </div>
          <div>
            <label
              className="optionLabel"
              htmlFor="enableEnterFocusEditing"
              id="enterFocusEditingLabel"
            >
              <input
                checked={enterMoves.row !== 0}
                type="checkbox"
                id="enableEnterFocusEditing"
                name="enableEnterFocusEditing"
                aria-labelledby="enterFocusEditingLabel"
                onChange={() => handleCheckboxChange("enableEnterFocusEditing")}
              />
              The Enter key moves the focus after cell edition
            </label>
            <a
              href="api/options/#entermoves"
              target="_blank"
              className="externalLink"
              rel="noopener noreferrer"
              aria-label="Learn more about Enter key focus behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-external-link"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default DemoOptions;
