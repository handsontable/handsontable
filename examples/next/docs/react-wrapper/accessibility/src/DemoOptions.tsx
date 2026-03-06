import { ToggleableOptions } from "./App";

type OptionCheckboxName =
  | "enable-tab-navigation"
  | "enable-header-navigation"
  | "enable-cell-virtualization"
  | "enable-cell-enter-editing"
  | "enable-arrow-rl-first-last-column"
  | "enable-arrow-td-first-last-column"
  | "enable-enter-focus-editing";

interface DemoOptionsProps extends ToggleableOptions {
  changeToggleOptions: React.Dispatch<React.SetStateAction<ToggleableOptions>>;
}

// Demo Options allows you to change the Handsontable options
// This allows us to change the Handsontable settings from the UI, showcasing 
// the flexibility of Handsontable in configuring according to your needs.
function DemoOptions({
  tabNavigation,
  navigableHeaders,
  renderAllRows,
  enterBeginsEditing,
  autoWrapRow,
  autoWrapCol,
  enterMoves,
  changeToggleOptions,
}: DemoOptionsProps) {
  // on checkbox change, update handsontable option
  const handleCheckboxChange = (checkboxName: OptionCheckboxName) => {
    switch (checkboxName) {
      case "enable-tab-navigation":
        changeToggleOptions((existing) => ({
          ...existing,
          tabNavigation: !tabNavigation,
        }));
        break;
      case "enable-header-navigation":
        changeToggleOptions((existing) => ({
          ...existing,
          navigableHeaders: !navigableHeaders,
        }));
        break;
      case "enable-cell-virtualization":
        changeToggleOptions((existing) => ({
          ...existing,
          renderAllRows: !renderAllRows,
          viewportColumnRenderingOffset: renderAllRows ? "auto" : 9,
        }));
        break;
      case "enable-cell-enter-editing":
        changeToggleOptions((existing) => ({
          ...existing,
          enterBeginsEditing: !enterBeginsEditing,
        }));
        break;
      case "enable-arrow-rl-first-last-column":
        changeToggleOptions((existing) => ({
          ...existing,
          autoWrapRow: !autoWrapRow,
        }));
        break;
      case "enable-arrow-td-first-last-column":
        changeToggleOptions((existing) => ({
          ...existing,
          autoWrapCol: !autoWrapCol,
        }));
        break;
      case "enable-enter-focus-editing":
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
      <div className="checkbox-container">
        <div className="checkbox-group">
          <div>
            <label
              className="option-label"
              htmlFor="enable-tab-navigation"
              id="tab-navigation-label"
            >
              <input
                checked={tabNavigation}
                type="checkbox"
                id="enable-tab-navigation"
                name="enable-tab-navigation"
                aria-label="Enable navigation with the Tab key"
                onChange={() => handleCheckboxChange("enable-tab-navigation")}
              />
              Enable navigation with the Tab key
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#tabNavigation"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more enabling/disabling tab navigation (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-header-navigation"
              id="header-navigation-label"
            >
              <input
                checked={navigableHeaders}
                type="checkbox"
                id="enable-header-navigation"
                name="enable-header-navigation"
                aria-labelledby="header-navigation-label"
                onChange={() =>
                  handleCheckboxChange("enable-header-navigation")
                }
              />
              Enable navigation across headers
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#navigableheaders"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about enabling/disabling tab navigation across headers (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-cell-virtualization"
              id="cell-virtualization-label"
            >
              <input
                checked={!renderAllRows}
                type="checkbox"
                id="enable-cell-virtualization"
                name="enable-cell-virtualization"
                aria-labelledby="cell-virtualization-label"
                onChange={() =>
                  handleCheckboxChange("enable-cell-virtualization")
                }
              />
              Enable cells virtualization
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#renderAllRows"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about row virtualization (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-cell-enter-editing"
              id="cell-enter-editing-label"
            >
              <input
                checked={enterBeginsEditing}
                type="checkbox"
                id="enable-cell-enter-editing"
                name="enable-cell-enter-editing"
                aria-labelledby="cell-enter-editing-label"
                onChange={() =>
                  handleCheckboxChange("enable-cell-enter-editing")
                }
              />
              The Enter key begins cell editing
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#enterbeginsediting"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about Enter key cell editing (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
        </div>
        <div className="checkbox-group">
          <div>
            <label
              className="option-label"
              htmlFor="enable-arrow-rl-first-last-column"
              id="arrow-rl-first-last-column-label"
            >
              <input
                checked={autoWrapRow}
                type="checkbox"
                id="enable-arrow-rl-first-last-column"
                name="enableArrowFirstLastColumn"
                aria-labelledby="arrow-rl-first-last-column-label"
                onChange={() =>
                  handleCheckboxChange("enable-arrow-rl-first-last-column")
                }
              />
              The right/left arrow keys move the focus to the first/last column
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#autowrapcol"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about right/left arrow key behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-arrow-td-first-last-column"
              id="arrow-td-first-last-column-label"
            >
              <input
                checked={autoWrapCol}
                type="checkbox"
                id="enable-arrow-td-first-last-column"
                name="enable-arrow-td-first-last-column"
                aria-labelledby="arrow-td-first-last-column-label"
                onChange={() =>
                  handleCheckboxChange("enable-arrow-td-first-last-column")
                }
              />
              The up/down arrow keys move the focus to the first/last row
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#autowraprow"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about up/down arrow key behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
          <div>
            <label
              className="option-label"
              htmlFor="enable-enter-focus-editing"
              id="enter-focus-editing-label"
            >
              <input
                checked={enterMoves.row !== 0}
                type="checkbox"
                id="enable-enter-focus-editing"
                name="enable-enter-focus-editing"
                aria-labelledby="enter-focus-editing-label"
                onChange={() =>
                  handleCheckboxChange("enable-enter-focus-editing")
                }
              />
              The Enter key moves the focus after cell edition
            </label>
            <a
              href="https://handsontable.com/docs/react-data-grid/api/options/#entermoves"
              target="_blank"
              className="external-link"
              rel="noopener noreferrer"
              aria-label="Learn more about Enter key focus behavior (opens in a new window)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                x="0px"
                y="0px"
                viewBox="0 0 100 100"
                width="15"
                height="15"
                className="icon outbound"
              >
                <path
                  fill="currentColor"
                  d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                ></path>
                <polygon
                  fill="currentColor"
                  points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                ></polygon>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default DemoOptions;
