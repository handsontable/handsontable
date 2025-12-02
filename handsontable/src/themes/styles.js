/* eslint-disable max-len */
export default `.htBorders .wtBorder.ht-border-style-dashed-vertical {
  background-image: repeating-linear-gradient(to bottom, var(--ht-custom-border-color) 0 5px, transparent 0 10px);
}
.htBorders .wtBorder.ht-border-style-dashed-horizontal {
  background-image: repeating-linear-gradient(to right, var(--ht-custom-border-color) 0 5px, transparent 0 10px);
}
.htBorders .wtBorder.ht-border-style-dotted-horizontal {
  background-image: radial-gradient(circle, var(--ht-custom-border-color) calc(var(--ht-custom-border-size) / 2), transparent 0);
  background-size: calc(var(--ht-custom-border-size) * 2) var(--ht-custom-border-size);
  background-repeat: repeat-x;
}
.htBorders .wtBorder.ht-border-style-dotted-vertical {
  background-image: radial-gradient(circle, var(--ht-custom-border-color) calc(var(--ht-custom-border-size) / 2), transparent 0);
  background-size: var(--ht-custom-border-size) calc(var(--ht-custom-border-size) * 2);
  background-repeat: repeat-y;
}

.ht-root-wrapper {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Helvetica Neue, Arial, sans-serif;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.htFocusCatcher {
  position: absolute;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  z-index: -1;
}

.ht-grid {
  flex: 1 1 auto;
  min-height: 0;
}

.handsontable {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Helvetica Neue, Arial, sans-serif;
  position: relative;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  font-weight: var(--ht-font-weight);
  letter-spacing: var(--ht-letter-spacing);
  color: var(--ht-foreground-color);
  /* Miscellaneous */
  touch-action: manipulation;
  scrollbar-width: thin;
  scrollbar-color: var(--ht-scrollbar-thumb-color) var(--ht-scrollbar-track-color);
}
.handsontable .wtHolder::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}
.handsontable .wtHolder::-webkit-scrollbar-track {
  background: var(--ht-scrollbar-track-color);
  border-radius: var(--ht-scrollbar-border-radius);
}
.handsontable .wtHolder::-webkit-scrollbar-thumb {
  background-color: var(--ht-scrollbar-thumb-color);
  border-radius: var(--ht-scrollbar-border-radius);
}
.handsontable .wtHolder::-webkit-scrollbar-corner {
  background: var(--ht-scrollbar-track-color);
  border-end-end-radius: var(--ht-scrollbar-border-radius);
}
.handsontable.ht-wrapper {
  border-radius: var(--ht-wrapper-border-radius, 0);
  height: 100%;
  width: 100%;
}
.handsontable.ht-wrapper:not(.htFirstDatasetColumnNotRendered) td:first-of-type {
  border-inline-start-width: 1px;
}
.handsontable.ht-wrapper::before {
  content: "";
  display: block;
  position: absolute;
  inset: 0;
  border: var(--ht-wrapper-border-width) solid var(--ht-wrapper-border-color);
  border-radius: var(--ht-wrapper-border-radius, 0);
  z-index: 999;
  pointer-events: none;
  overflow: hidden;
}
.handsontable.htGhostTable table thead th {
  border-bottom-width: 0;
}
.handsontable.htGhostTable table tbody tr:first-of-type th:first-child,
.handsontable.htGhostTable table tbody tr:first-of-type td:first-child {
  height: calc(var(--ht-cell-vertical-padding) * 2 + var(--ht-line-height) + 1px);
}
.handsontable.htGhostTable table tbody tr th,
.handsontable.htGhostTable table tbody tr td {
  border-top-width: 0;
  height: calc(var(--ht-cell-vertical-padding) * 2 + var(--ht-line-height) + 1px);
}
.handsontable.htHasScrollX:not(.htHorizontallyScrollableByWindow) .ht_master .wtHolder, .handsontable.htHasScrollY:not(.htVerticallyScrollableByWindow) .ht_master .wtHolder {
  border-radius: var(--ht-wrapper-border-radius, 0);
}
.handsontable:not(.htHorizontallyScrollableByWindow) .ht_master .wtHolder, .handsontable:not(.htVerticallyScrollableByWindow) .ht_master .wtHolder {
  background-color: var(--ht-background-color);
}
.handsontable tr.ht__row_even th {
  background-color: var(--ht-row-header-even-background-color);
}
.handsontable tr.ht__row_even td {
  background-color: var(--ht-row-cell-even-background-color);
}
.handsontable tr.ht__row_odd th {
  background-color: var(--ht-row-header-odd-background-color);
}
.handsontable tr.ht__row_odd td {
  background-color: var(--ht-row-cell-odd-background-color);
}
.handsontable th,
.handsontable td {
  height: calc(var(--ht-cell-vertical-padding) * 2 + var(--ht-line-height) + 1px);
  padding: var(--ht-cell-vertical-padding) var(--ht-cell-horizontal-padding);
  vertical-align: top;
  border-top-width: 0;
  border-inline-start-width: 0;
  border-inline-end-width: 1px;
  border-bottom-width: 1px;
  border-style: solid;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  white-space: pre-wrap;
  overflow: hidden;
  outline: none;
  outline-width: 0;
  empty-cells: show;
  box-sizing: border-box;
  color: var(--ht-foreground-color);
  border-top-color: var(--ht-cell-vertical-border-color);
  border-bottom-color: var(--ht-cell-vertical-border-color);
  border-inline-start-color: var(--ht-cell-horizontal-border-color);
  border-inline-end-color: var(--ht-cell-horizontal-border-color);
}
.handsontable th.invisibleSelection,
.handsontable td.invisibleSelection {
  outline: none;
}
.handsontable th.invisibleSelection::selection,
.handsontable td.invisibleSelection::selection {
  background: transparent;
}
.handsontable th {
  position: relative;
  overflow: visible;
  text-align: center;
  font-weight: var(--ht-header-font-weight);
  white-space: nowrap;
  color: var(--ht-header-foreground-color);
  background-color: var(--ht-header-background-color);
}
.handsontable th:last-child {
  /* Foundation framework fix */
  border-inline-start-width: 0;
  border-inline-end-width: 1px;
  border-bottom-width: 1px;
  border-inline-end-color: var(--ht-border-color);
}
.handsontable th:last-child.ht__active_highlight {
  border-inline-end-color: var(--ht-header-active-border-color);
}
.handsontable th:first-child {
  border-inline-start-color: var(--ht-border-color);
}
.handsontable th:first-child.ht__active_highlight {
  border-inline-start-color: var(--ht-header-active-border-color);
}
.handsontable th:first-child, .handsontable th:nth-child(2) {
  border-inline-start-width: 1px;
}
.handsontable th.current {
  box-shadow: inset 0 0 0 1px var(--ht-cell-selection-border-color);
}
.handsontable th.active {
  color: var(--ht-header-active-foreground-color);
  background-color: var(--ht-header-active-background-color);
}
.handsontable th.ht__highlight {
  color: var(--ht-header-highlighted-foreground-color);
  background-color: var(--ht-header-highlighted-background-color);
}
.handsontable th.ht__active_highlight {
  border-color: var(--ht-header-active-border-color);
  color: var(--ht-header-active-foreground-color);
  background-color: var(--ht-header-active-background-color);
}
.handsontable tbody tr.ht__row_odd th.ht__highlight, .handsontable tbody tr.ht__row_even th.ht__highlight {
  color: var(--ht-header-row-highlighted-foreground-color);
  background-color: var(--ht-header-row-highlighted-background-color);
}
.handsontable tbody tr.ht__row_odd th.ht__active_highlight, .handsontable tbody tr.ht__row_even th.ht__active_highlight {
  color: var(--ht-header-row-active-foreground-color);
  background-color: var(--ht-header-row-active-background-color);
}
.handsontable tbody tr:first-of-type th:first-child:empty::after,
.handsontable tbody tr:first-of-type td:first-child:empty::after {
  content: "";
  display: block;
  min-height: var(--ht-line-height);
}
.handsontable tbody tr th {
  padding: 0;
  color: var(--ht-header-row-foreground-color);
  background-color: var(--ht-header-row-background-color);
}
.handsontable tbody tr th.ht__active_highlight {
  box-shadow: 0 -1px 0 0 var(--ht-header-active-border-color);
}
.handsontable tbody tr th .relative {
  padding: var(--ht-cell-vertical-padding) var(--ht-cell-horizontal-padding);
  min-height: 100%;
}
.handsontable tbody tr td:first-child {
  border-inline-start-color: var(--ht-border-color);
}
.handsontable tbody tr td:last-child {
  border-inline-end-color: var(--ht-border-color);
}
.handsontable thead tr th {
  padding: 0;
}
.handsontable thead tr th.ht__active_highlight {
  box-shadow: -1px 0 0 0 var(--ht-header-active-border-color);
}
.handsontable thead tr th .relative {
  padding: var(--ht-cell-vertical-padding) var(--ht-cell-horizontal-padding);
}
.handsontable thead tr th .relative .colHeader {
  text-overflow: ellipsis;
  overflow: hidden;
  vertical-align: top;
  max-width: calc(100% + 1px);
}
.handsontable thead tr th .relative:has(.collapsibleIndicator, .changeType) .colHeader {
  max-width: calc(100% - (var(--ht-icon-size) + var(--ht-gap-size)) - 1px);
}
.handsontable tr:first-child th,
.handsontable tr:first-child td {
  border-top-color: var(--ht-border-color);
  border-top-width: 1px;
}
.handsontable tr:first-child th.ht__active_highlight,
.handsontable tr:first-child td.ht__active_highlight {
  border-top-color: var(--ht-header-active-border-color);
}
.handsontable tr:last-child th,
.handsontable tr:last-child td {
  border-bottom-color: var(--ht-border-color);
}
.handsontable tr:last-child th.ht__active_highlight,
.handsontable tr:last-child td.ht__active_highlight {
  border-bottom-color: var(--ht-header-active-border-color);
}
.handsontable div[class^=ht_clone] thead .ht__highlight .relative::after {
  content: "";
  display: block;
  position: absolute;
  left: -1px;
  right: -1px;
  bottom: -1px;
  height: var(--ht-header-highlighted-shadow-size);
  background-color: var(--ht-accent-color);
}
.handsontable div[class^=ht_clone] thead tr:only-of-type .ht__highlight .relative::after {
  bottom: 0;
}
.handsontable div[class^=ht_clone] tbody .ht__highlight .relative::after {
  content: "";
  display: block;
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  width: var(--ht-header-highlighted-shadow-size);
  background-color: var(--ht-accent-color);
}
.handsontable div[class^=ht_clone] td:first-of-type {
  border-inline-start-width: 1px;
}
.handsontable thead tr:not(:last-child) th {
  /* Fix for - nested columns with hidden column  */
  overflow: hidden;
}
.handsontable .hide {
  display: none;
}
.handsontable .relative {
  position: relative;
  box-sizing: border-box;
}
.handsontable .wtHider {
  width: 0;
}
.handsontable .wtSpreader {
  position: relative;
  /* must be 0, otherwise blank space appears in scroll demo after scrolling max to the right */
  width: 0;
  height: auto;
}
.handsontable .htAutoSize {
  position: absolute;
  left: -99000px;
  top: -99000px;
  visibility: hidden;
}
.handsontable .htTextEllipsis {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.handsontable table,
.handsontable tbody,
.handsontable thead,
.handsontable input,
.handsontable textarea,
.handsontable div {
  box-sizing: content-box;
}
.handsontable input,
.handsontable textarea {
  min-height: initial;
}
.handsontable .htCore {
  width: 0;
  margin: 0;
  border-width: 0;
  border-spacing: 0;
  border-collapse: separate;
  outline-width: 0;
  table-layout: fixed;
  cursor: default;
  background-color: var(--ht-background-color);
}
.handsontable col {
  width: 64px;
}
.handsontable col.rowHeader {
  width: 64px;
}
.handsontable col.hidden {
  width: 0 !important;
}
.handsontable span.colHeader, .handsontable span.rowHeader {
  display: inline-block;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
}
.handsontable tr.hidden {
  display: none;
}
.handsontable tr.hidden td,
.handsontable tr.hidden th {
  display: none;
}
.handsontable a {
  color: var(--ht-link-color);
}
.handsontable a:hover {
  color: var(--ht-link-hover-color);
}
.handsontable .ht_clone_top th:nth-child(2) {
  border-inline-start-width: 0;
  border-inline-end-width: 1px;
}
.handsontable.htRowHeaders thead tr th:nth-child(2) {
  border-inline-start-width: 1px;
}
.handsontable .ht_master:not(.innerBorderInlineStart):not(.emptyColumns) tbody tr th,
.handsontable .ht_master:not(.innerBorderInlineStart):not(.emptyColumns) thead tr th:first-child,
.handsontable .ht_master:not(.innerBorderInlineStart):not(.emptyColumns) ~ .handsontable:not(.htGhostTable) tbody tr th,
.handsontable .ht_master:not(.innerBorderInlineStart):not(.emptyColumns) ~ .handsontable:not(.ht_clone_top):not(.htGhostTable) thead tr th:first-child {
  border-inline-end-width: 0;
  border-inline-start-width: 1px;
}
.handsontable .ht_master:not(.innerBorderTop):not(.innerBorderBottom) thead tr:last-child th, .handsontable .ht_master:not(.innerBorderTop):not(.innerBorderBottom) ~ .handsontable thead tr:last-child th,
.handsontable .ht_master:not(.innerBorderTop):not(.innerBorderBottom) thead tr.lastChild th, .handsontable .ht_master:not(.innerBorderTop):not(.innerBorderBottom) ~ .handsontable thead tr.lastChild th {
  border-bottom-width: 0;
}
.handsontable.htAutoRowSize .ht_master.innerBorderTop tbody tr:first-child th,
.handsontable.htAutoRowSize .ht_master.innerBorderTop tbody tr:first-child td {
  border-top-width: 0;
}
.handsontable.htAutoRowSize .ht_master.innerBorderTop ~ .ht_clone_inline_start tbody tr:first-child th,
.handsontable.htAutoRowSize .ht_master.innerBorderTop ~ .ht_clone_inline_start tbody tr:first-child td {
  border-top-width: 0;
}
.handsontable .ht_master table.htCore > thead,
.handsontable .ht_master table.htCore > tbody > tr > th,
.handsontable .ht_clone_inline_start table.htCore > thead {
  visibility: hidden;
}

.ht_master,
.ht_clone_inline_start,
.ht_clone_top,
.ht_clone_bottom {
  overflow: hidden;
}
.ht_master .wtHolder,
.ht_clone_inline_start .wtHolder,
.ht_clone_top .wtHolder,
.ht_clone_bottom .wtHolder {
  overflow: hidden;
}

.ht_master .wtHolder {
  overflow: auto;
}

[dir=rtl].handsontable td[dir=ltr] {
  border-inline-end-width: 0;
  border-inline-start-width: 1px;
}
[dir=rtl].handsontable tbody tr td[dir=ltr]:last-child {
  border-inline-start-color: var(--ht-border-color);
}
[dir=rtl].handsontable div[class^=ht_clone] tbody .ht__highlight .relative::after {
  right: auto;
  left: -1px;
}

.htScrollbarSafariTest::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.handsontable.ht-wrapper:not(.htColumnHeaders) .ht_master .htCore tbody tr:first-child td:first-child {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper:not(.htColumnHeaders) .ht_master .htCore tbody tr:first-child td:last-child {
  border-start-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper:not(.htColumnHeaders) .ht_clone_top_inline_start_corner .htCore tbody tr:first-child td:first-child {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper:not(.htColumnHeaders) .ht_clone_top .htCore tbody tr:first-child td:first-child {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper:not(.htColumnHeaders) .ht_clone_top .htCore tbody tr:first-child td:last-child {
  border-start-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper:not(.htColumnHeaders) .ht_clone_inline_start .htCore tbody tr:first-child th:first-child,
.handsontable.ht-wrapper:not(.htColumnHeaders) .ht_clone_inline_start .htCore tbody tr:first-child td:first-child {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_master .htCore {
  border-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_master .htCore thead tr:first-child th:first-child {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_master .htCore thead tr:first-child th:last-child {
  border-start-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_master .htCore thead tr:last-child th:first-child {
  border-end-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_master .htCore thead tr:last-child th:last-child {
  border-end-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_master .htCore tbody tr:last-child td:first-child {
  border-end-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_master .htCore tbody tr:last-child td:last-child {
  border-end-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_top_inline_start_corner .htCore {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_top_inline_start_corner .htCore thead tr:first-child th:first-child {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_top .htCore {
  border-start-start-radius: var(--ht-wrapper-border-radius);
  border-start-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_top .htCore thead tr:first-child th:first-child {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_top .htCore thead tr:first-child th:last-child {
  border-start-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_inline_start .htCore {
  border-start-start-radius: var(--ht-wrapper-border-radius);
  border-end-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_inline_start .htCore thead tr:first-child th:first-child {
  border-start-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_inline_start .htCore tbody tr:last-child th:first-child,
.handsontable.ht-wrapper .ht_clone_inline_start .htCore tbody tr:last-child td:first-child {
  border-end-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_bottom_inline_start_corner .htCore {
  border-end-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_bottom_inline_start_corner .htCore tr:last-child th:first-child,
.handsontable.ht-wrapper .ht_clone_bottom_inline_start_corner .htCore tr:last-child td:first-child {
  border-end-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_bottom .htCore {
  border-end-start-radius: var(--ht-wrapper-border-radius);
  border-end-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_bottom .htCore tr:last-child th:first-child,
.handsontable.ht-wrapper .ht_clone_bottom .htCore tr:last-child td:first-child {
  border-end-start-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper .ht_clone_bottom .htCore tr:last-child th:last-child,
.handsontable.ht-wrapper .ht_clone_bottom .htCore tr:last-child td:last-child {
  border-end-end-radius: var(--ht-wrapper-border-radius);
}
.handsontable.ht-wrapper.htHasScrollX .htCore {
  border-end-start-radius: 0;
  border-end-end-radius: 0;
}
.handsontable.ht-wrapper.htHasScrollX .htCore thead tr:last-child th:first-child,
.handsontable.ht-wrapper.htHasScrollX .htCore tbody tr:last-child td:first-child,
.handsontable.ht-wrapper.htHasScrollX .htCore tbody tr:last-child th:first-child {
  border-end-start-radius: 0 !important;
}
.handsontable.ht-wrapper.htHasScrollX .htCore thead tr:last-child th:last-child,
.handsontable.ht-wrapper.htHasScrollX .htCore tbody tr:last-child td:last-child,
.handsontable.ht-wrapper.htHasScrollX .htCore tbody tr:last-child th:last-child {
  border-end-end-radius: 0 !important;
}
.handsontable.ht-wrapper.htHasScrollY:not(.htVerticallyScrollableByWindow) .htCore {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}
.handsontable.ht-wrapper.htHasScrollY:not(.htVerticallyScrollableByWindow) .htCore thead tr:first-child th:last-child,
.handsontable.ht-wrapper.htHasScrollY:not(.htVerticallyScrollableByWindow) .htCore tbody tr:first-child td:last-child,
.handsontable.ht-wrapper.htHasScrollY:not(.htVerticallyScrollableByWindow) .htCore tbody tr:first-child th:last-child {
  border-start-end-radius: 0 !important;
}
.handsontable.ht-wrapper.htHasScrollY:not(.htVerticallyScrollableByWindow) .htCore thead tr:last-child th:last-child,
.handsontable.ht-wrapper.htHasScrollY:not(.htVerticallyScrollableByWindow) .htCore tbody tr:last-child td:last-child,
.handsontable.ht-wrapper.htHasScrollY:not(.htVerticallyScrollableByWindow) .htCore tbody tr:last-child th:last-child {
  border-end-end-radius: 0 !important;
}

.handsontable.mobile {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-overflow-scrolling: touch;
}
.handsontable.mobile .wtHolder {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-overflow-scrolling: touch;
}
.handsontable.mobile .handsontableInput:focus {
  box-shadow: inset 0 0 0 2px var(--ht-accent-color);
  -webkit-appearance: none;
}
.handsontable .topSelectionHandle,
.handsontable .topSelectionHandle-HitArea,
.handsontable .bottomSelectionHandle,
.handsontable .bottomSelectionHandle-HitArea {
  inset-inline-start: -10000px;
  inset-inline-end: unset;
  top: -10000px;
  z-index: 9999;
}
.handsontable.hide-tween {
  -webkit-animation: opacity-hide 0.2s;
  animation: opacity-hide 0.2s;
  animation-fill-mode: forwards;
  -webkit-animation-fill-mode: forwards;
}
.handsontable.show-tween {
  -webkit-animation: opacity-show 0.3s;
  animation: opacity-show 0.3s;
  animation-fill-mode: forwards;
  -webkit-animation-fill-mode: forwards;
}

.ht_clone_master {
  z-index: 100;
}

.ht_clone_inline_start {
  z-index: 120;
}

.ht_clone_bottom {
  z-index: 130;
}

.ht_clone_bottom_inline_start_corner {
  z-index: 150;
}

.ht_clone_top {
  z-index: 160;
}

.ht_clone_top_inline_start_corner {
  z-index: 180;
}

.ht_editor_hidden {
  z-index: -1;
}

.ht_editor_visible {
  z-index: 200;
}

.handsontable td.area {
  position: relative;
}
.handsontable td.area::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ht-cell-selection-background-color, #1a42e8);
}
.handsontable td.area-1 {
  position: relative;
}
.handsontable td.area-1::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ht-cell-selection-background-color, #1a42e8);
}
.handsontable td.area-2 {
  position: relative;
}
.handsontable td.area-2::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ht-cell-selection-background-color, #1a42e8);
}
.handsontable td.area-3 {
  position: relative;
}
.handsontable td.area-3::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ht-cell-selection-background-color, #1a42e8);
}
.handsontable td.area-4 {
  position: relative;
}
.handsontable td.area-4::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ht-cell-selection-background-color, #1a42e8);
}
.handsontable td.area-5 {
  position: relative;
}
.handsontable td.area-5::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ht-cell-selection-background-color, #1a42e8);
}
.handsontable td.area-6 {
  position: relative;
}
.handsontable td.area-6::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ht-cell-selection-background-color, #1a42e8);
}
.handsontable td.area-7 {
  position: relative;
}
.handsontable td.area-7::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ht-cell-selection-background-color, #1a42e8);
}
.handsontable td.area:before {
  opacity: 0.14;
}
.handsontable td.area-1:before {
  opacity: 0.21;
}
.handsontable td.area-2:before {
  opacity: 0.28;
}
.handsontable td.area-3:before {
  opacity: 0.35;
}
.handsontable td.area-4:before {
  opacity: 0.42;
}
.handsontable td.area-5:before {
  opacity: 0.49;
}
.handsontable td.area-6:before {
  opacity: 0.56;
}
.handsontable td.area-7:before {
  opacity: 0.63;
}
.handsontable td.area {
  border-color: color-mix(in srgb, var(--ht-border-color), var(--ht-foreground-color) 10%);
}
.handsontable .wtBorder {
  position: absolute;
  font-size: 0;
}
.handsontable .wtBorder:nth-child(1), .handsontable .wtBorder:nth-child(3) {
  z-index: 2;
}
.handsontable .wtBorder:nth-child(2), .handsontable .wtBorder:nth-child(4) {
  z-index: 1;
}
.handsontable .wtBorder.hidden {
  display: none !important;
}
.handsontable .wtBorder.current {
  z-index: 10;
  background-color: var(--ht-cell-selection-border-color) !important;
}
.handsontable .wtBorder.area {
  z-index: 8;
  background-color: var(--ht-cell-selection-border-color) !important;
}
.handsontable .wtBorder.fill {
  z-index: 6;
  background-color: var(--ht-cell-autofill-fill-border-color, #68696c) !important;
}
.handsontable .wtBorder.corner {
  border-radius: var(--ht-cell-autofill-border-radius) !important;
  background-color: var(--ht-cell-autofill-background-color, #1a42e8) !important;
  border-color: var(--ht-cell-autofill-border-color) !important;
  font-size: 0;
  cursor: crosshair;
  z-index: 10;
}
.handsontable .wtBorder.corner::after {
  content: "";
  position: absolute;
  border-radius: var(--ht-cell-autofill-border-radius);
  inset: calc(max(0px, (var(--ht-cell-autofill-hit-area-size) - var(--ht-cell-autofill-size)) / 2) * -1);
  background: transparent;
}
.handsontable .wtBorder.corner.wtCornerInlineEndEdge::after {
  inset-inline-end: 0;
}
.handsontable .wtBorder.corner.wtCornerBlockEndEdge::after {
  inset-block-end: 0;
}

.hot-display-license-info {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Helvetica Neue, Arial, sans-serif;
  padding: var(--ht-license-vertical-padding, 16px) var(--ht-license-horizontal-padding, 16px);
  font-size: var(--ht-font-size-small);
  line-height: var(--ht-line-height-small);
  color: var(--ht-license-foreground-color);
  background-color: var(--ht-license-background-color, #f7f7f9);
  text-align: left;
  border: 1px solid var(--ht-border-color, #f7f7f9);
  margin-top: 10px;
  border-radius: var(--ht-wrapper-border-radius);
}
.hot-display-license-info a {
  font-size: var(--ht-license-font-size);
  color: var(--ht-link-color);
}
.hot-display-license-info a:hover {
  color: var(--ht-link-hover-color);
}

.handsontable .htAutocompleteArrow {
  position: relative;
  cursor: default;
  width: var(--ht-icon-size);
  height: var(--ht-icon-size);
  font-size: 0;
  float: right;
  top: calc((var(--ht-line-height) - var(--ht-icon-size)) / 2);
  margin-inline-start: calc(var(--ht-gap-size) * 2);
  margin-inline-end: 1px;
}
.handsontable .htAutocompleteArrow::after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.6;
}

[dir=rtl].handsontable .htAutocompleteArrow {
  float: left;
}

.handsontable .htCheckboxRendererInput {
  position: relative;
  display: inline-block;
  width: var(--ht-checkbox-size);
  height: var(--ht-checkbox-size);
  margin: 0;
  vertical-align: middle;
  cursor: pointer;
  margin-top: -2px;
  outline: none;
}
.handsontable .htCheckboxRendererInput:first-child {
  margin-inline-end: var(--ht-gap-size);
}
.handsontable .htCheckboxRendererInput:last-child {
  margin-inline-start: var(--ht-gap-size);
}
.handsontable .htCheckboxRendererInput::before {
  content: "";
  display: inline-block;
  position: absolute;
  top: 0;
  left: 0;
  width: var(--ht-checkbox-size);
  height: var(--ht-checkbox-size);
  border-radius: var(--ht-checkbox-border-radius);
  border: 1px solid var(--ht-checkbox-border-color);
  background-color: var(--ht-checkbox-background-color);
  box-sizing: border-box;
  pointer-events: none;
  transition: all var(--ht-table-transition) ease-in-out;
}
.handsontable .htCheckboxRendererInput::after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  color: var(--ht-checkbox-icon-color);
  pointer-events: none;
  width: var(--ht-checkbox-size) !important;
  height: var(--ht-checkbox-size) !important;
}
.handsontable .htCheckboxRendererInput:checked::before {
  border-color: var(--ht-checkbox-checked-border-color);
  background-color: var(--ht-checkbox-checked-background-color);
}
.handsontable .htCheckboxRendererInput:checked::after {
  color: var(--ht-checkbox-checked-icon-color);
}
.handsontable .htCheckboxRendererInput:checked:disabled::before {
  border-color: var(--ht-checkbox-checked-disabled-border-color);
  background-color: var(--ht-checkbox-checked-disabled-background-color);
}
.handsontable .htCheckboxRendererInput:checked:disabled::after {
  color: var(--ht-checkbox-checked-disabled-icon-color);
}
.handsontable .htCheckboxRendererInput:checked:focus::before {
  border-color: var(--ht-checkbox-checked-focus-border-color);
  background-color: var(--ht-checkbox-checked-focus-background-color);
}
.handsontable .htCheckboxRendererInput:checked:focus::after {
  color: var(--ht-checkbox-checked-focus-icon-color);
}
.handsontable .htCheckboxRendererInput:focus::before {
  border-color: var(--ht-checkbox-focus-border-color);
  background-color: var(--ht-checkbox-focus-background-color);
  outline: 1px solid var(--ht-checkbox-focus-ring-color);
}
.handsontable .htCheckboxRendererInput:focus::after {
  color: var(--ht-checkbox-focus-icon-color);
}
.handsontable .htCheckboxRendererInput:disabled {
  cursor: initial;
}
.handsontable .htCheckboxRendererInput:disabled::before {
  border-color: var(--ht-checkbox-disabled-border-color);
  background-color: var(--ht-checkbox-disabled-background-color);
}
.handsontable .htCheckboxRendererInput:disabled::after {
  color: var(--ht-checkbox-disabled-icon-color);
}
.handsontable .htCheckboxRendererInput:indeterminate::before {
  border-color: var(--ht-checkbox-indeterminate-border-color);
  background-color: var(--ht-checkbox-indeterminate-background-color);
}
.handsontable .htCheckboxRendererInput:indeterminate::after {
  color: var(--ht-checkbox-indeterminate-icon-color);
}
.handsontable .htCheckboxRendererInput:indeterminate:disabled::before {
  border-color: var(--ht-checkbox-indeterminate-disabled-border-color);
  background-color: var(--ht-checkbox-indeterminate-disabled-background-color);
}
.handsontable .htCheckboxRendererInput:indeterminate:disabled::after {
  color: var(--ht-checkbox-indeterminate-disabled-icon-color);
}
.handsontable .htCheckboxRendererInput:indeterminate:focus::before {
  border-color: var(--ht-checkbox-indeterminate-focus-border-color);
  background-color: var(--ht-checkbox-indeterminate-focus-background-color);
}
.handsontable .htCheckboxRendererInput:indeterminate:focus::after {
  color: var(--ht-checkbox-indeterminate-focus-icon-color);
}
.handsontable .htCheckboxRendererInput.noValue {
  opacity: 0.5;
}
.handsontable .htCheckboxRendererLabel {
  display: inline-block;
  position: relative;
  font-size: inherit;
  line-height: inherit;
  cursor: pointer;
  color: inherit;
  margin: 0;
}
.handsontable .htCheckboxRendererLabel.fullWidth {
  width: 100%;
}

.handsontable .htPlaceholder {
  color: var(--ht-placeholder-color);
}
.handsontable .htDimmed {
  color: var(--ht-read-only-color) !important;
  background-color: var(--ht-cell-read-only-background-color) !important;
}
.handsontable .htLeft {
  text-align: left;
}
.handsontable .htCenter {
  text-align: center;
}
.handsontable .htRight {
  text-align: right;
}
.handsontable .htJustify {
  text-align: justify;
}
.handsontable .htTop {
  vertical-align: top;
}
.handsontable .htMiddle {
  vertical-align: middle;
}
.handsontable .htBottom {
  vertical-align: bottom;
}
.handsontable .htInvalid {
  /* gives priority over td.area selection background */
  background-color: var(--ht-cell-error-background-color) !important;
}
.handsontable .htNoWrap {
  white-space: nowrap;
}
.handsontable .htSearchResult {
  background-color: var(--ht-cell-success-background-color) !important;
}

.handsontableInputHolder {
  position: absolute;
  top: 0;
  left: 0;
}
.handsontableInputHolder .handsontableInput {
  display: block;
  margin: 0;
  padding: calc(var(--ht-cell-vertical-padding, 4px) + 1px) calc(var(--ht-cell-horizontal-padding, 8px) + 1px);
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  color: var(--ht-cell-editor-foreground-color);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px) var(--ht-cell-editor-border-color, #1a42e8), 0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0 var(--ht-cell-editor-shadow-color, transparent);
  border: none;
  border-radius: 0;
  -webkit-appearance: none !important;
  box-sizing: border-box;
  /* Miscellaneous */
  outline-width: 0;
  /* overwrite styles potentially made by a framework */
}
.handsontableInputHolder .handsontableInput:focus {
  outline: none;
}

.htSelectEditor {
  position: absolute;
}
.htSelectEditor select {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: calc(var(--ht-cell-vertical-padding, 4px) + 1px) calc(var(--ht-cell-horizontal-padding, 8px) + 1px);
  padding-inline-end: 26px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ht-cell-editor-foreground-color);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px) var(--ht-cell-editor-border-color, #1a42e8), 0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0 var(--ht-cell-editor-shadow-color, transparent);
  border: none;
  border-radius: 0;
  box-sizing: border-box;
  -webkit-appearance: none !important;
}
.htSelectEditor select:focus {
  outline: none;
}
.htSelectEditor .htAutocompleteArrow {
  top: 50%;
  transform: translateY(-50%);
  margin-inline-end: 4px;
  z-index: 1;
  pointer-events: none;
}

.handsontable.listbox {
  box-shadow: var(--ht-menu-shadow-x, 0) var(--ht-menu-shadow-y, 0) var(--ht-menu-shadow-blur, 8px) var(--ht-menu-shadow-color, rgba(0, 0, 0, 0.08));
  margin: 0;
  border: var(--ht-menu-border-width, 1px) solid var(--ht-menu-border-color, #e5e5e9);
}
.handsontable.listbox .ht_master {
  overflow: hidden;
  background-color: var(--ht-background-color);
}
.handsontable.listbox .wtHolder {
  overflow: auto;
  border-radius: 0 !important;
}
.handsontable.listbox .wtHider, .handsontable.listbox .htCore {
  border-radius: 0 !important;
}
.handsontable.listbox table {
  overflow: hidden;
}
.handsontable.listbox table th,
.handsontable.listbox table tr:first-child th,
.handsontable.listbox table tr:last-child th,
.handsontable.listbox table tr:first-child td,
.handsontable.listbox table td {
  border-color: transparent !important;
}
.handsontable.listbox table th,
.handsontable.listbox table td {
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: 0 !important;
}
.handsontable.listbox table .wtBorder {
  visibility: hidden;
}
.handsontable.listbox table strong {
  font-weight: bold;
  color: inherit;
}
.handsontable.listbox table tr td:hover td {
  background: var(--ht-menu-item-hover-color, #e5e5e9) !important;
  cursor: pointer;
  box-shadow: none !important;
}
.handsontable.listbox table td {
  transition: var(--ht-table-transition) background ease-in-out;
}
.handsontable.listbox table td:hover {
  background-color: var(--ht-menu-item-hover-color, #e5e5e9) !important;
  cursor: pointer;
}
.handsontable.listbox table td.current:not([aria-expanded=true]) {
  box-shadow: inset 0 0 0 1px var(--ht-accent-color);
}
.handsontable.listbox table td.htDimmed {
  cursor: default;
  font-style: inherit;
  color: inherit !important;
}
.handsontable.listbox table td.htDimmed:not(.handsontable.listbox table td:hover) {
  background-color: inherit !important;
}
.handsontable.listbox table thead th {
  height: auto !important;
  text-align: left;
  border-width: 0 1px 1px;
}
.handsontable.listbox table thead th > div {
  padding-top: 8px;
  padding-bottom: 8px;
}
.handsontable.listbox table thead th:first-child {
  padding-left: 8px;
}
.handsontable.listbox .ht_clone_top .wtHider {
  overflow: hidden;
}
.handsontable.listbox .ht_clone_top table {
  border-radius: 0;
}
.handsontable.listbox .htBorders div {
  background: none !important;
}
.handsontable.autocompleteEditor tr.ht__row_even th,
.handsontable.autocompleteEditor tr.ht__row_even td {
  background-color: var(--ht-background-color, #ffffff);
}
.handsontable.autocompleteEditor tr.ht__row_odd th,
.handsontable.autocompleteEditor tr.ht__row_odd td {
  background-color: var(--ht-background-color, #ffffff);
}

.pika-single {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Helvetica Neue, Arial, sans-serif;
  box-shadow: var(--ht-menu-shadow-x, 0) var(--ht-menu-shadow-y, 0) var(--ht-menu-shadow-blur, 8px) var(--ht-menu-shadow-color, rgba(0, 0, 0, 0.08));
  position: relative;
  display: block;
  padding: 10px;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  font-weight: var(--ht-font-weight);
  color: var(--ht-foreground-color);
  background: var(--ht-background-color, #ffffff);
  border: var(--ht-menu-border-width, 1px) solid var(--ht-menu-border-color, #e5e5e9);
  border-radius: var(--ht-menu-border-radius);
  z-index: 9999;
}
.pika-single.is-hidden {
  display: none;
}
.pika-single .pika-row {
  background-color: transparent;
}
.pika-single .pika-title {
  display: flex;
  align-items: center;
  justify-content: center;
}
.pika-single .pika-label {
  position: relative;
  order: 2;
  padding: 5px;
  color: var(--ht-accent-color);
}
.pika-single .pika-label .pika-select {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.pika-single .pika-prev,
.pika-single .pika-next {
  width: 20px;
  height: 20px;
  white-space: nowrap;
  text-indent: -9999px;
  cursor: pointer;
  color: var(--ht-accent-color);
  background: none;
  border: none;
  padding: 0;
}
.pika-single .pika-prev {
  order: 1;
  margin-right: auto;
}
.pika-single .pika-next {
  order: 3;
  margin-left: auto;
}
.pika-single .pika-table thead {
  height: 50px;
}
.pika-single .pika-table th {
  padding: 1px;
  vertical-align: middle;
}
.pika-single .pika-table th abbr {
  text-decoration: none;
  font-weight: normal;
  border: none;
  cursor: initial;
}
.pika-single .pika-table td {
  padding: 1px;
  vertical-align: middle;
}
.pika-single .pika-table td.is-disabled .pika-button {
  pointer-events: none;
  opacity: 0.5;
}
.pika-single .pika-table td.is-today .pika-button {
  background: var(--ht-menu-item-hover-color);
}
.pika-single .pika-table td.is-selected .pika-button {
  background: var(--ht-accent-color, #1a42e8);
  color: var(--ht-background-color, #ffffff);
}
.pika-single .pika-table td.pika-week {
  width: 12.5%;
  text-align: center;
}
.pika-single .pika-table .pika-button {
  width: 100%;
  aspect-ratio: 1/1;
  background: transparent;
  color: var(--ht-foreground-color);
  border: none;
  border-radius: var(--ht-button-border-radius);
  margin: 0;
  padding: 10px;
  cursor: pointer;
  font-size: inherit;
}
.pika-single .pika-table .pika-button:hover {
  background: var(--ht-menu-item-hover-color);
}

[dir=rtl].htDatepickerHolder .pika-single .pika-next {
  transform: rotate(180deg);
  margin-left: 0;
  margin-right: auto;
}
[dir=rtl].htDatepickerHolder .pika-single .pika-prev {
  transform: rotate(180deg);
  margin-left: auto;
  margin-right: 0;
}

.handsontable .htUISelectCaption {
  width: 100%;
  padding: var(--ht-input-vertical-padding) var(--ht-input-horizontal-padding);
  padding-inline-end: calc(var(--ht-input-horizontal-padding) + var(--ht-icon-size));
  margin: 0;
  font-family: inherit;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  font-weight: var(--ht-font-weight);
  border-radius: var(--ht-input-border-radius);
  box-sizing: border-box;
  cursor: pointer;
  outline: none !important;
  border: var(--ht-input-border-width) solid var(--ht-input-border-color);
  color: var(--ht-input-foreground-color);
  background-color: var(--ht-input-background-color);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  transition: var(--ht-table-transition) all ease-in-out;
}
.handsontable .htUISelectCaption::after {
  content: "";
  display: block;
  position: absolute;
  right: calc(var(--ht-input-horizontal-padding) - var(--ht-icon-size) / 4);
  top: 50%;
  transform: translateY(-50%);
}
.handsontable .htUISelectCaption:hover {
  border-color: var(--ht-input-hover-border-color);
  color: var(--ht-input-hover-foreground-color);
  background-color: var(--ht-input-hover-background-color);
}
.handsontable .htUISelectCaption:disabled {
  border-color: var(--ht-input-disabled-border-color);
  color: var(--ht-input-disabled-foreground-color);
  background-color: var(--ht-input-disabled-background-color);
}
.handsontable .htUISelectCaption:focus {
  border-color: var(--ht-input-focus-border-color);
  color: var(--ht-input-focus-foreground-color);
  background-color: var(--ht-input-focus-background-color);
}
.handsontable .htUISelect {
  cursor: pointer;
  position: relative;
  outline: none !important;
}
.handsontable .htUISelect:focus .htUISelectCaption {
  border-color: var(--ht-input-focus-border-color);
  color: var(--ht-input-focus-foreground-color);
  background-color: var(--ht-input-focus-background-color);
}

[dir=rtl].handsontable .htUISelectCaption::after {
  right: auto;
  left: calc(var(--ht-input-horizontal-padding) - var(--ht-icon-size) / 4);
}

.handsontable .htFiltersMenuCondition .htUIInput input,
.handsontable .htFiltersMenuValue .htUIMultipleSelectSearch input {
  width: 100%;
  padding: var(--ht-input-vertical-padding) var(--ht-input-horizontal-padding);
  font-family: inherit;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  font-weight: var(--ht-font-weight);
  border-radius: var(--ht-input-border-radius);
  box-sizing: border-box;
  cursor: pointer;
  outline: none !important;
  border: var(--ht-input-border-width) solid var(--ht-input-border-color);
  color: var(--ht-input-foreground-color);
  background-color: var(--ht-input-background-color);
  transition: var(--ht-table-transition) all ease-in-out;
}
.handsontable .htFiltersMenuCondition .htUIInput input:hover,
.handsontable .htFiltersMenuValue .htUIMultipleSelectSearch input:hover {
  border-color: var(--ht-input-hover-border-color);
  color: var(--ht-input-hover-foreground-color);
  background-color: var(--ht-input-hover-background-color);
}
.handsontable .htFiltersMenuCondition .htUIInput input:disabled,
.handsontable .htFiltersMenuValue .htUIMultipleSelectSearch input:disabled {
  border-color: var(--ht-input-disabled-border-color);
  color: var(--ht-input-disabled-foreground-color);
  background-color: var(--ht-input-disabled-background-color);
}
.handsontable .htFiltersMenuCondition .htUIInput input:focus,
.handsontable .htFiltersMenuValue .htUIMultipleSelectSearch input:focus {
  border-color: var(--ht-input-focus-border-color);
  color: var(--ht-input-focus-foreground-color);
  background-color: var(--ht-input-focus-background-color);
}
.handsontable .htUIInput {
  position: relative;
  padding: 0;
  outline: none !important;
  text-align: center;
}
.handsontable .htUIInputIcon {
  position: absolute;
}

.handsontable .htUIInput.htUIButton input, .handsontable .ht-button {
  min-width: 64px;
  padding: var(--ht-button-vertical-padding) var(--ht-button-horizontal-padding);
  font-family: inherit;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  font-weight: var(--ht-font-weight);
  border-radius: var(--ht-button-border-radius);
  border-width: 1px;
  border-style: solid;
  box-sizing: border-box;
  outline: none !important;
  cursor: pointer;
  transition: var(--ht-table-transition) all ease-in-out;
}
.handsontable .htUIInput.htUIButtonCancel input, .handsontable .ht-button--secondary {
  border-color: var(--ht-secondary-button-border-color);
  background-color: var(--ht-secondary-button-background-color);
  color: var(--ht-secondary-button-foreground-color);
}
.handsontable .htUIInput.htUIButtonCancel input:hover, .handsontable .ht-button--secondary:hover {
  border-color: var(--ht-secondary-button-hover-border-color);
  background-color: var(--ht-secondary-button-hover-background-color);
  color: var(--ht-secondary-button-hover-foreground-color);
}
.handsontable .htUIInput.htUIButtonCancel input:disabled, .handsontable .ht-button--secondary:disabled {
  border-color: var(--ht-secondary-button-disabled-border-color);
  background-color: var(--ht-secondary-button-disabled-background-color);
  color: var(--ht-secondary-button-disabled-foreground-color);
}
.handsontable .htUIInput.htUIButtonCancel input:focus, .handsontable .ht-button--secondary:focus {
  border-color: var(--ht-secondary-button-focus-border-color);
  background-color: var(--ht-secondary-button-focus-background-color);
  color: var(--ht-secondary-button-focus-foreground-color);
  box-shadow: 0 0 0 1px var(--ht-accent-color);
}

.htUIInput.htUIButtonOK input, .ht-button--primary {
  border-color: var(--ht-primary-button-border-color);
  background-color: var(--ht-primary-button-background-color);
  color: var(--ht-primary-button-foreground-color);
}
.htUIInput.htUIButtonOK input:hover, .ht-button--primary:hover {
  border-color: var(--ht-primary-button-hover-border-color);
  background-color: var(--ht-primary-button-hover-background-color);
  color: var(--ht-primary-button-hover-foreground-color);
}
.htUIInput.htUIButtonOK input:disabled, .ht-button--primary:disabled {
  border-color: var(--ht-primary-button-disabled-border-color);
  background-color: var(--ht-primary-button-disabled-background-color);
  color: var(--ht-primary-button-disabled-foreground-color);
}
.htUIInput.htUIButtonOK input:focus, .ht-button--primary:focus {
  border-color: var(--ht-primary-button-focus-border-color);
  background-color: var(--ht-primary-button-focus-background-color);
  color: var(--ht-primary-button-focus-foreground-color);
  box-shadow: 0 0 0 1px var(--ht-accent-color);
}

.handsontable .htUIRadio {
  position: relative;
  display: inline-flex;
  margin: 0;
  padding: var(--ht-gap-size) calc(2 * var(--ht-gap-size));
  padding-bottom: 0;
  align-items: center;
  gap: var(--ht-gap-size);
  cursor: pointer;
}
.handsontable .htUIRadio:first-child {
  padding-inline-start: 0;
}
.handsontable .htUIRadio > input[type=radio] {
  position: relative;
  width: var(--ht-radio-size);
  height: var(--ht-radio-size);
  margin: 0;
  appearance: none;
  cursor: pointer;
  border-radius: calc(0.5 * var(--ht-radio-size));
  outline: none;
}
.handsontable .htUIRadio > input[type=radio]::before {
  content: "";
  display: block;
  position: absolute;
  inset: 0;
  border-radius: calc(0.5 * var(--ht-radio-size));
  border: 1px solid var(--ht-radio-border-color);
  background-color: var(--ht-radio-background-color);
}
.handsontable .htUIRadio > input[type=radio]::after {
  content: "";
  display: block;
  position: absolute;
  color: var(--ht-radio-icon-color);
}
.handsontable .htUIRadio > input[type=radio]:checked::before {
  border-color: var(--ht-radio-checked-border-color);
  background-color: var(--ht-radio-checked-background-color);
}
.handsontable .htUIRadio > input[type=radio]:checked::after {
  color: var(--ht-radio-checked-icon-color);
}
.handsontable .htUIRadio > input[type=radio]:checked:disabled {
  cursor: initial;
}
.handsontable .htUIRadio > input[type=radio]:checked:disabled::before {
  border-color: var(--ht-radio-checked-disabled-border-color);
  background-color: var(--ht-radio-checked-disabled-background-color);
}
.handsontable .htUIRadio > input[type=radio]:checked:disabled::after {
  color: var(--ht-radio-checked-disabled-icon-color);
}
.handsontable .htUIRadio > input[type=radio]:checked:focus::before {
  border-color: var(--ht-radio-checked-focus-border-color);
  background-color: var(--ht-radio-checked-focus-background-color);
}
.handsontable .htUIRadio > input[type=radio]:checked:focus::after {
  color: var(--ht-radio-checked-focus-icon-color);
}
.handsontable .htUIRadio > input[type=radio]:disabled {
  cursor: initial;
}
.handsontable .htUIRadio > input[type=radio]:disabled::before {
  border-color: var(--ht-radio-disabled-border-color);
  background-color: var(--ht-radio-disabled-background-color);
}
.handsontable .htUIRadio > input[type=radio]:disabled::after {
  color: var(--ht-radio-disabled-icon-color);
}
.handsontable .htUIRadio > input[type=radio]:focus::before {
  border-color: var(--ht-radio-focus-border-color);
  background-color: var(--ht-radio-focus-background-color);
  outline: 1px solid var(--ht-radio-focus-ring-color);
}
.handsontable .htUIRadio > input[type=radio]:focus::after {
  color: var(--ht-radio-focus-icon-color);
}
.handsontable .htUIRadio label {
  vertical-align: middle;
  cursor: pointer;
  color: inherit;
}
.handsontable .htUIRadio label::before {
  content: "";
  display: block;
  position: absolute;
  inset: 0;
}

.handsontable .collapsibleIndicator {
  top: calc((var(--ht-line-height) - var(--ht-icon-size)) / 2);
  margin-inline-start: var(--ht-gap-size);
  margin-inline-end: 1px;
}
.handsontable .collapsibleIndicator,
.handsontable .ht_nestingButton {
  position: relative;
  width: var(--ht-icon-size);
  height: var(--ht-icon-size);
  box-sizing: border-box;
  border-radius: var(--ht-collapse-button-border-radius);
  overflow: hidden;
  cursor: pointer;
  /* hide text */
  text-indent: -100px;
  font-size: 0;
  float: right;
}
.handsontable .collapsibleIndicator::before,
.handsontable .ht_nestingButton::before {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  transition: var(--ht-table-transition) all ease-in-out;
}
.handsontable .collapsibleIndicator.expanded, .handsontable .collapsibleIndicator.ht_nestingCollapse,
.handsontable .ht_nestingButton.expanded,
.handsontable .ht_nestingButton.ht_nestingCollapse {
  background-color: var(--ht-collapse-button-open-background-color);
  box-shadow: 0 0 0 1px var(--ht-collapse-button-open-border-color);
}
.handsontable .collapsibleIndicator.expanded::before, .handsontable .collapsibleIndicator.ht_nestingCollapse::before,
.handsontable .ht_nestingButton.expanded::before,
.handsontable .ht_nestingButton.ht_nestingCollapse::before {
  color: var(--ht-collapse-button-open-icon-color);
}
.handsontable .collapsibleIndicator.expanded:hover, .handsontable .collapsibleIndicator.ht_nestingCollapse:hover,
.handsontable .ht_nestingButton.expanded:hover,
.handsontable .ht_nestingButton.ht_nestingCollapse:hover {
  background-color: var(--ht-collapse-button-open-hover-background-color);
  box-shadow: 0 0 0 1px var(--ht-collapse-button-open-hover-border-color);
}
.handsontable .collapsibleIndicator.expanded:hover::before, .handsontable .collapsibleIndicator.ht_nestingCollapse:hover::before,
.handsontable .ht_nestingButton.expanded:hover::before,
.handsontable .ht_nestingButton.ht_nestingCollapse:hover::before {
  color: var(--ht-collapse-button-open-hover-icon-color);
}
.handsontable .collapsibleIndicator.collapsed, .handsontable .collapsibleIndicator.ht_nestingExpand,
.handsontable .ht_nestingButton.collapsed,
.handsontable .ht_nestingButton.ht_nestingExpand {
  background-color: var(--ht-collapse-button-close-background-color);
  box-shadow: 0 0 0 1px var(--ht-collapse-button-close-border-color);
}
.handsontable .collapsibleIndicator.collapsed::before, .handsontable .collapsibleIndicator.ht_nestingExpand::before,
.handsontable .ht_nestingButton.collapsed::before,
.handsontable .ht_nestingButton.ht_nestingExpand::before {
  color: var(--ht-collapse-button-close-icon-color);
}
.handsontable .collapsibleIndicator.collapsed:hover, .handsontable .collapsibleIndicator.ht_nestingExpand:hover,
.handsontable .ht_nestingButton.collapsed:hover,
.handsontable .ht_nestingButton.ht_nestingExpand:hover {
  background-color: var(--ht-collapse-button-close-hover-background-color);
  box-shadow: 0 0 0 1px var(--ht-collapse-button-close-hover-border-color);
}
.handsontable .collapsibleIndicator.collapsed:hover::before, .handsontable .collapsibleIndicator.ht_nestingExpand:hover::before,
.handsontable .ht_nestingButton.collapsed:hover::before,
.handsontable .ht_nestingButton.ht_nestingExpand:hover::before {
  color: var(--ht-collapse-button-close-hover-icon-color);
}
.handsontable th.ht__active_highlight .collapsibleIndicator.collapsed::before, .handsontable th.ht__active_highlight .collapsibleIndicator.ht_nestingExpand::before,
.handsontable th.ht__active_highlight .ht_nestingButton.collapsed::before,
.handsontable th.ht__active_highlight .ht_nestingButton.ht_nestingExpand::before {
  color: var(--ht-collapse-button-close-icon-active-color);
}
.handsontable th.ht__active_highlight .collapsibleIndicator.collapsed:hover::before, .handsontable th.ht__active_highlight .collapsibleIndicator.ht_nestingExpand:hover::before,
.handsontable th.ht__active_highlight .ht_nestingButton.collapsed:hover::before,
.handsontable th.ht__active_highlight .ht_nestingButton.ht_nestingExpand:hover::before {
  color: var(--ht-collapse-button-close-hover-icon-active-color);
}
.handsontable th.ht__active_highlight .collapsibleIndicator.expanded::before, .handsontable th.ht__active_highlight .collapsibleIndicator.ht_nestingCollapse::before,
.handsontable th.ht__active_highlight .ht_nestingButton.expanded::before,
.handsontable th.ht__active_highlight .ht_nestingButton.ht_nestingCollapse::before {
  color: var(--ht-collapse-button-open-icon-active-color);
}
.handsontable th.ht__active_highlight .collapsibleIndicator.expanded:hover::before, .handsontable th.ht__active_highlight .collapsibleIndicator.ht_nestingCollapse:hover::before,
.handsontable th.ht__active_highlight .ht_nestingButton.expanded:hover::before,
.handsontable th.ht__active_highlight .ht_nestingButton.ht_nestingCollapse:hover::before {
  color: var(--ht-collapse-button-open-hover-icon-active-color);
}

[dir=rtl].handsontable .collapsibleIndicator,
[dir=rtl].handsontable .ht_nestingButton {
  float: left;
}

.handsontable thead th.hiddenHeader:not(:first-of-type) {
  display: none;
}
.handsontable thead th.hiddenHeaderText .colHeader {
  opacity: 0;
}

.handsontable th.ht_nestingLevels > .relative {
  display: flex;
  align-items: center;
  gap: 5px;
}
.handsontable th.ht_nestingLevels span:last-child {
  padding-left: calc(var(--ht-icon-size) + 5px);
}
.handsontable th.ht_nestingLevels span.ht_nestingLevel {
  display: inline-block;
}
.handsontable th.ht_nestingLevels span.ht_nestingLevel_empty {
  position: relative;
  display: inline-block;
  width: 5px;
  height: 1px;
  order: -2;
}
.handsontable th.ht_nestingLevels .ht_nestingButton {
  position: relative;
  cursor: pointer;
  order: -1;
}

.handsontable th.beforeHiddenColumn, .handsontable th.afterHiddenColumn {
  position: relative;
}
.handsontable th.beforeHiddenColumn::before, .handsontable th.beforeHiddenColumn::after, .handsontable th.afterHiddenColumn::before, .handsontable th.afterHiddenColumn::after {
  position: absolute;
  top: 50%;
  width: 10px !important;
  height: 10px !important;
  transform: translateY(-50%);
  color: var(--ht-hidden-indicator-color);
}
.handsontable th.beforeHiddenColumn::after {
  content: "";
  display: block;
  right: -2px;
}
.handsontable th.afterHiddenColumn::before {
  content: "";
  display: block;
  left: -2px;
}
.handsontable th.ht__active_highlight.beforeHiddenColumn::before, .handsontable th.ht__active_highlight.beforeHiddenColumn::after, .handsontable th.ht__active_highlight.afterHiddenColumn::before, .handsontable th.ht__active_highlight.afterHiddenColumn::after {
  color: var(--ht-icon-button-active-icon-color, var(--ht-icon-active-button-icon-color));
}

[dir=rtl].handsontable th.beforeHiddenColumn::after {
  right: initial;
  left: -2px;
  transform: translateY(-50%) rotate(180deg);
}
[dir=rtl].handsontable th.afterHiddenColumn::before {
  right: -2px;
  left: initial;
  transform: translateY(-50%) rotate(180deg);
}

.handsontable th.beforeHiddenRow, .handsontable th.afterHiddenRow {
  position: relative;
}
.handsontable th.beforeHiddenRow::before, .handsontable th.beforeHiddenRow::after, .handsontable th.afterHiddenRow::before, .handsontable th.afterHiddenRow::after {
  position: absolute;
  left: 50%;
  width: 10px !important;
  height: 10px !important;
  transform: translateX(-50%);
  color: var(--ht-hidden-indicator-color);
}
.handsontable th.beforeHiddenRow::after {
  content: "";
  display: block;
  bottom: -2px;
}
.handsontable th.afterHiddenRow::before {
  content: "";
  display: block;
  top: -2px;
}
.handsontable th.ht__active_highlight.beforeHiddenRow::before, .handsontable th.ht__active_highlight.beforeHiddenRow::after, .handsontable th.ht__active_highlight.afterHiddenRow::before, .handsontable th.ht__active_highlight.afterHiddenRow::after {
  color: var(--ht-icon-button-active-icon-color, var(--ht-icon-active-button-icon-color));
}

.handsontable .changeType {
  position: relative;
  box-sizing: border-box;
  width: var(--ht-icon-size);
  height: var(--ht-icon-size);
  border-radius: var(--ht-icon-button-border-radius);
  box-shadow: 0 0 0 1px var(--ht-icon-button-border-color);
  border: none;
  color: inherit;
  padding: 0;
  margin: 0;
  background-color: var(--ht-icon-button-background-color);
  order: 1;
  z-index: 1;
  float: right;
  top: calc((var(--ht-line-height) - var(--ht-icon-size)) / 2);
  margin-inline-start: var(--ht-gap-size);
  margin-inline-end: 1px;
}
.handsontable .changeType::before {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  color: var(--ht-icon-button-icon-color);
}
.handsontable .changeType:hover {
  cursor: pointer;
  box-shadow: 0 0 0 1px var(--ht-icon-button-hover-border-color);
  background-color: var(--ht-icon-button-hover-background-color);
}
.handsontable .changeType:hover::before {
  color: var(--ht-icon-button-hover-icon-color);
}
.handsontable .ht__active_highlight .changeType {
  box-shadow: 0 0 0 1px var(--ht-icon-button-active-border-color, var(--ht-icon-active-button-border-color));
  background-color: var(--ht-icon-button-active-background-color, var(--ht-icon-active-button-background-color));
}
.handsontable .ht__active_highlight .changeType::before {
  color: var(--ht-icon-button-active-icon-color, var(--ht-icon-active-button-icon-color));
}
.handsontable .ht__active_highlight .changeType:hover {
  box-shadow: 0 0 0 1px var(--ht-icon-button-active-hover-border-color, var(--ht-icon-active-button-hover-border-color));
  background-color: var(--ht-icon-button-active-hover-background-color, var(--ht-icon-active-button-hover-background-color));
}
.handsontable .ht__active_highlight .changeType:hover::before {
  color: var(--ht-icon-button-active-hover-icon-color, var(--ht-icon-active-button-hover-icon-color));
}
.handsontable th.htFiltersActive {
  background-color: var(--ht-header-filter-background-color);
}
.handsontable th.htFiltersActive.ht__active_highlight {
  background-color: color-mix(in srgb, var(--ht-header-active-background-color), var(--ht-header-filter-background-color) 20%);
}
.handsontable th.htFiltersActive.ht__active_highlight .changeType::after {
  background-color: var(--ht-header-active-foreground-color);
}
.handsontable.htDropdownMenu > .ht_master, .handsontable.htContextMenu > .ht_master, .handsontable.htFiltersConditionsMenu > .ht_master {
  box-shadow: var(--ht-menu-shadow-x, 0) var(--ht-menu-shadow-y, 0) var(--ht-menu-shadow-blur, 8px) var(--ht-menu-shadow-color, rgba(0, 0, 0, 0.08));
  border: var(--ht-menu-border-width, 1px) solid var(--ht-menu-border-color, #e5e5e9);
  border-radius: var(--ht-menu-border-radius);
  overflow: hidden;
  padding: var(--ht-menu-vertical-padding, 8px) var(--ht-menu-horizontal-padding, 0);
  background-color: var(--ht-background-color, #ffffff);
}
.handsontable.htDropdownMenu:not(.htGhostTable), .handsontable.htContextMenu:not(.htGhostTable), .handsontable.htFiltersConditionsMenu:not(.htGhostTable) {
  display: none;
  position: absolute;
  /* needs to be higher than 1050 - z-index for Twitter Bootstrap modal (#1569) */
  z-index: 1060;
}
.handsontable.htDropdownMenu .ht_clone_top,
.handsontable.htDropdownMenu .ht_clone_bottom,
.handsontable.htDropdownMenu .ht_clone_inline_start,
.handsontable.htDropdownMenu .ht_clone_top_inline_start_corner,
.handsontable.htDropdownMenu .ht_clone_bottom_inline_start_corner, .handsontable.htContextMenu .ht_clone_top,
.handsontable.htContextMenu .ht_clone_bottom,
.handsontable.htContextMenu .ht_clone_inline_start,
.handsontable.htContextMenu .ht_clone_top_inline_start_corner,
.handsontable.htContextMenu .ht_clone_bottom_inline_start_corner, .handsontable.htFiltersConditionsMenu .ht_clone_top,
.handsontable.htFiltersConditionsMenu .ht_clone_bottom,
.handsontable.htFiltersConditionsMenu .ht_clone_inline_start,
.handsontable.htFiltersConditionsMenu .ht_clone_top_inline_start_corner,
.handsontable.htFiltersConditionsMenu .ht_clone_bottom_inline_start_corner {
  display: none;
}
.handsontable.htDropdownMenu table.htCore, .handsontable.htContextMenu table.htCore, .handsontable.htFiltersConditionsMenu table.htCore {
  overflow: hidden;
}
.handsontable.htDropdownMenu .htCustomMenuRenderer .table.htCore, .handsontable.htContextMenu .htCustomMenuRenderer .table.htCore, .handsontable.htFiltersConditionsMenu .htCustomMenuRenderer .table.htCore {
  box-shadow: none;
}
.handsontable.htDropdownMenu.handsontable:focus, .handsontable.htContextMenu.handsontable:focus, .handsontable.htFiltersConditionsMenu.handsontable:focus {
  outline: none;
}
.handsontable.htDropdownMenu .wtBorder, .handsontable.htContextMenu .wtBorder, .handsontable.htFiltersConditionsMenu .wtBorder {
  visibility: hidden;
}
.handsontable.htDropdownMenu tbody tr:first-of-type td:first-child, .handsontable.htDropdownMenu tbody tr:first-of-type th:first-child, .handsontable.htContextMenu tbody tr:first-of-type td:first-child, .handsontable.htContextMenu tbody tr:first-of-type th:first-child, .handsontable.htFiltersConditionsMenu tbody tr:first-of-type td:first-child, .handsontable.htFiltersConditionsMenu tbody tr:first-of-type th:first-child {
  height: calc(var(--ht-cell-vertical-padding) * 2 + var(--ht-line-height) + 1px);
}
.handsontable.htDropdownMenu table tbody tr td, .handsontable.htContextMenu table tbody tr td, .handsontable.htFiltersConditionsMenu table tbody tr td {
  position: relative;
  padding: var(--ht-menu-item-vertical-padding, 4px) var(--ht-menu-item-horizontal-padding, 8px);
  border-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: var(--ht-background-color, #ffffff);
  cursor: pointer;
  transition: var(--ht-table-transition) background ease-in-out;
}
.handsontable.htDropdownMenu table tbody tr td:first-child, .handsontable.htContextMenu table tbody tr td:first-child, .handsontable.htFiltersConditionsMenu table tbody tr td:first-child {
  border-top-width: 0;
  border-inline-end-width: 0;
  border-bottom-width: 0;
  border-inline-start-width: 0;
}
.handsontable.htDropdownMenu table tbody tr td.htDimmed, .handsontable.htContextMenu table tbody tr td.htDimmed, .handsontable.htFiltersConditionsMenu table tbody tr td.htDimmed {
  font-style: normal;
  color: inherit !important;
  background-color: inherit !important;
}
.handsontable.htDropdownMenu table tbody tr td:not(.handsontable.htDropdownMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htDropdownMenu table tbody tr td.htDisabled, .handsontable.htContextMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htContextMenu table tbody tr td.htDisabled, .handsontable.htFiltersConditionsMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htFiltersConditionsMenu table tbody tr td.htDisabled):hover, .handsontable.htContextMenu table tbody tr td:not(.handsontable.htDropdownMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htDropdownMenu table tbody tr td.htDisabled, .handsontable.htContextMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htContextMenu table tbody tr td.htDisabled, .handsontable.htFiltersConditionsMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htFiltersConditionsMenu table tbody tr td.htDisabled):hover, .handsontable.htFiltersConditionsMenu table tbody tr td:not(.handsontable.htDropdownMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htDropdownMenu table tbody tr td.htDisabled, .handsontable.htContextMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htContextMenu table tbody tr td.htDisabled, .handsontable.htFiltersConditionsMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htFiltersConditionsMenu table tbody tr td.htDisabled):hover {
  background: var(--ht-menu-item-hover-color, #e5e5e9) !important;
  cursor: pointer;
}
.handsontable.htDropdownMenu table tbody tr td:not(.handsontable.htDropdownMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htDropdownMenu table tbody tr td.htDisabled, .handsontable.htContextMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htContextMenu table tbody tr td.htDisabled, .handsontable.htFiltersConditionsMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htFiltersConditionsMenu table tbody tr td.htDisabled).current:not([aria-expanded=true]), .handsontable.htContextMenu table tbody tr td:not(.handsontable.htDropdownMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htDropdownMenu table tbody tr td.htDisabled, .handsontable.htContextMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htContextMenu table tbody tr td.htDisabled, .handsontable.htFiltersConditionsMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htFiltersConditionsMenu table tbody tr td.htDisabled).current:not([aria-expanded=true]), .handsontable.htFiltersConditionsMenu table tbody tr td:not(.handsontable.htDropdownMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htDropdownMenu table tbody tr td.htDisabled, .handsontable.htContextMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htContextMenu table tbody tr td.htDisabled, .handsontable.htFiltersConditionsMenu table tbody tr td.htCustomMenuRenderer, .handsontable.htFiltersConditionsMenu table tbody tr td.htDisabled).current:not([aria-expanded=true]) {
  box-shadow: inset 0 0 0 1px var(--ht-accent-color);
}
.handsontable.htDropdownMenu table tbody tr td.htSubmenu .htItemWrapper, .handsontable.htContextMenu table tbody tr td.htSubmenu .htItemWrapper, .handsontable.htFiltersConditionsMenu table tbody tr td.htSubmenu .htItemWrapper {
  margin-inline-end: calc(2 * var(--ht-gap-size, 4px) + var(--ht-icon-size));
}
.handsontable.htDropdownMenu table tbody tr td.htSubmenu .htItemWrapper::after, .handsontable.htContextMenu table tbody tr td.htSubmenu .htItemWrapper::after, .handsontable.htFiltersConditionsMenu table tbody tr td.htSubmenu .htItemWrapper::after {
  content: "";
  display: block;
  position: absolute;
  top: 50%;
  right: calc(var(--ht-menu-item-horizontal-padding) + var(--ht-gap-size) * 2);
  transform: translateY(-50%);
}
.handsontable.htDropdownMenu table tbody tr td.htSeparator, .handsontable.htContextMenu table tbody tr td.htSeparator, .handsontable.htFiltersConditionsMenu table tbody tr td.htSeparator {
  border-top: 1px solid var(--ht-border-color);
  height: 0;
  padding: 0;
  cursor: default;
}
.handsontable.htDropdownMenu table tbody tr td.htDisabled, .handsontable.htContextMenu table tbody tr td.htDisabled, .handsontable.htFiltersConditionsMenu table tbody tr td.htDisabled {
  color: var(--ht-disabled-color);
  cursor: default;
}
.handsontable.htDropdownMenu table tbody tr td.htDisabled:hover, .handsontable.htContextMenu table tbody tr td.htDisabled:hover, .handsontable.htFiltersConditionsMenu table tbody tr td.htDisabled:hover {
  background: var(--ht-background-color);
  color: var(--ht-disabled-color);
}
.handsontable.htDropdownMenu table tbody tr td.htHidden, .handsontable.htContextMenu table tbody tr td.htHidden, .handsontable.htFiltersConditionsMenu table tbody tr td.htHidden {
  display: none;
}
.handsontable.htDropdownMenu table tbody tr td:has(.htItemWrapper .selected), .handsontable.htContextMenu table tbody tr td:has(.htItemWrapper .selected), .handsontable.htFiltersConditionsMenu table tbody tr td:has(.htItemWrapper .selected) {
  background-color: var(--ht-menu-item-active-color);
}
.handsontable.htDropdownMenu table tbody tr td .htItemWrapper, .handsontable.htContextMenu table tbody tr td .htItemWrapper, .handsontable.htFiltersConditionsMenu table tbody tr td .htItemWrapper {
  margin-inline: calc(2 * var(--ht-gap-size, 4px));
}
.handsontable.htDropdownMenu table tbody tr td .htItemWrapper::before, .handsontable.htContextMenu table tbody tr td .htItemWrapper::before, .handsontable.htFiltersConditionsMenu table tbody tr td .htItemWrapper::before {
  vertical-align: text-bottom;
  margin-right: 12px;
}
.handsontable.htDropdownMenu table tbody tr td .htItemWrapper span.selected, .handsontable.htContextMenu table tbody tr td .htItemWrapper span.selected, .handsontable.htFiltersConditionsMenu table tbody tr td .htItemWrapper span.selected {
  font-size: 0;
  inset: 0;
}
.handsontable.htDropdownMenu table tbody tr td .htItemWrapper span.selected::after, .handsontable.htContextMenu table tbody tr td .htItemWrapper span.selected::after, .handsontable.htFiltersConditionsMenu table tbody tr td .htItemWrapper span.selected::after {
  content: "";
  display: block;
  position: absolute;
  top: 50%;
  right: calc(var(--ht-menu-item-horizontal-padding) + var(--ht-gap-size) * 2);
  color: var(--ht-accent-color);
  transform: translateY(-50%);
}
.handsontable.htDropdownMenu table tbody tr td div span.selected, .handsontable.htContextMenu table tbody tr td div span.selected, .handsontable.htFiltersConditionsMenu table tbody tr td div span.selected {
  position: absolute;
  inset-inline-end: 0;
}
.handsontable.htDropdownMenu table tbody tr td .htUIButton, .handsontable.htContextMenu table tbody tr td .htUIButton, .handsontable.htFiltersConditionsMenu table tbody tr td .htUIButton {
  width: calc(50% - var(--ht-gap-size));
}
.handsontable.htDropdownMenu table tbody tr td .htUIButton input, .handsontable.htContextMenu table tbody tr td .htUIButton input, .handsontable.htFiltersConditionsMenu table tbody tr td .htUIButton input {
  width: 100%;
}
.handsontable .htUIClearAll a,
.handsontable .htUISelectAll a {
  padding: var(--ht-gap-size);
  display: inline-block;
  text-decoration: none;
}
.handsontable .htUIMultipleSelect .ht_master .wtHolder {
  overflow-y: scroll !important;
  background: transparent;
  border-radius: 0 !important;
}
.handsontable .htUIMultipleSelect .ht_master .wtHolder .htCore {
  box-shadow: none;
}

[dir=rtl].handsontable.htDropdownMenu table tbody tr td.htSubmenu .htItemWrapper::after, [dir=rtl].handsontable.htContextMenu table tbody tr td.htSubmenu .htItemWrapper::after, [dir=rtl].handsontable.htFiltersConditionsMenu table tbody tr td.htSubmenu .htItemWrapper::after {
  left: calc(4 * var(--ht-gap-size));
  right: auto;
  transform: translateY(-50%) rotate(180deg);
}
[dir=rtl].handsontable.htDropdownMenu table tbody tr td .htItemWrapper span.selected::after, [dir=rtl].handsontable.htContextMenu table tbody tr td .htItemWrapper span.selected::after, [dir=rtl].handsontable.htFiltersConditionsMenu table tbody tr td .htItemWrapper span.selected::after {
  left: calc(4 * var(--ht-gap-size));
  right: auto;
}
[dir=rtl].handsontable .changeType {
  float: left;
}

.handsontable.htFiltersConditionsMenu:not(.htGhostTable) {
  z-index: 1070;
}
.handsontable .ht_master table td.htCustomMenuRenderer {
  cursor: auto;
}
.handsontable .ht_master table td.htCustomMenuRenderer.htFiltersMenuActionBar {
  padding-top: calc(var(--ht-menu-item-vertical-padding, 4px) * 2);
}
.handsontable .htFiltersMenuLabel {
  font-size: var(--ht-font-size-small);
  line-height: var(--ht-line-height-small);
  font-weight: var(--ht-font-weight);
  margin-bottom: calc(var(--ht-gap-size, 2px) * 2);
}
.handsontable .htFiltersMenuLabel:empty {
  display: none;
}
.handsontable .htFiltersMenuCondition {
  padding-top: calc(var(--ht-gap-size, 2px) * 3) !important;
  padding-bottom: 0 !important;
}
.handsontable .htFiltersMenuCondition .border {
  border-bottom: 1px solid var(--ht-border-color) !important;
}
.handsontable .htFiltersMenuCondition .htUIInput {
  margin-top: calc(var(--ht-gap-size, 2px) * 2);
}
.handsontable .htFiltersMenuValue {
  padding-top: calc(var(--ht-gap-size, 2px) * 3) !important;
  padding-bottom: 0 !important;
  border-bottom: 1px solid var(--ht-border-color) !important;
}
.handsontable .htFiltersMenuOperators {
  padding-top: calc(var(--ht-gap-size, 2px) * 2) !important;
  padding-bottom: 0 !important;
}
.handsontable .htUISelectionControls {
  padding-top: calc(var(--ht-gap-size, 2px) * 2) !important;
  padding-bottom: var(--ht-gap-size, 2px) !important;
  margin: 0 calc(var(--ht-gap-size, 2px) * -1);
}
.handsontable .htUIMultipleSelectHot {
  --ht-cell-horizontal-padding: calc(
          var(--ht-menu-item-horizontal-padding, 2px) +
          var(--ht-gap-size, 2px) * 2);
  overflow: initial !important;
  width: calc(100% + var(--ht-menu-item-horizontal-padding, 2px) * 2 + var(--ht-gap-size, 2px) * 4);
  margin: 0 calc((var(--ht-menu-item-horizontal-padding, 2px) + var(--ht-gap-size, 2px) * 2) * -1);
}
.handsontable .htUIMultipleSelectHot::before {
  content: "";
  display: block;
  position: absolute;
  top: -1px;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--ht-border-color);
}
.handsontable .htUIMultipleSelectHot .wtHolder {
  padding: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}
.handsontable .htUIMultipleSelectHot .wtHolder .wtSpreader {
  padding: calc(var(--ht-gap-size) * 2) 0;
}
.handsontable .htUIMultipleSelectHot .wtHolder td {
  height: auto !important;
  padding: 4px var(--ht-cell-horizontal-padding);
}
.handsontable .htUIClearAll,
.handsontable .htUISelectAll {
  display: inline-block;
  margin-right: var(--ht-gap-size, 4px);
  margin-bottom: var(--ht-gap-size, 4px);
}
.handsontable .htUIClearAll a,
.handsontable .htUISelectAll a {
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  color: var(--ht-link-color);
  border-radius: var(--ht-button-border-radius);
}
.handsontable .htUIClearAll a:hover,
.handsontable .htUISelectAll a:hover {
  color: var(--ht-link-hover-color);
}
.handsontable .htUIClearAll a:focus,
.handsontable .htUISelectAll a:focus {
  outline: 1px solid var(--ht-link-hover-color);
}
.handsontable .htUIMultipleSelect .ht_master .wtHolder {
  overflow: auto;
}
.handsontable .htUIMultipleSelect .ht_master .wtHolder .wtHider,
.handsontable .htUIMultipleSelect .ht_master .wtHolder .htCore,
.handsontable .htUIMultipleSelect .ht_master .wtHolder tr,
.handsontable .htUIMultipleSelect .ht_master .wtHolder td {
  background: none;
}
.handsontable .htUIInput.htUIButton {
  cursor: pointer;
  display: inline-block;
}
.handsontable .htUIInput.htUIButtonOK {
  margin-inline-start: 0;
  margin-inline-end: calc(2 * var(--ht-gap-size, 2px));
}

.handsontable .htCommentCell {
  position: relative;
}
.handsontable .htCommentCell::after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  inset-inline-end: 0;
  inset-inline-start: unset;
  border-inline-start: var(--ht-comments-indicator-size, 4px) solid transparent;
  border-inline-end: none;
  border-top: var(--ht-comments-indicator-size, 4px) solid var(--ht-comments-indicator-color, #1a42e8);
}

.htCommentsContainer .htComments {
  display: none;
  z-index: 1059;
  position: absolute;
}
.htCommentsContainer .htCommentTextArea {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Helvetica Neue, Arial, sans-serif;
  box-shadow: var(--ht-menu-shadow-x, 0) var(--ht-menu-shadow-y, 0) var(--ht-menu-shadow-blur, 8px) var(--ht-menu-shadow-color, rgba(0, 0, 0, 0.08));
  width: 240px;
  height: 88px;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  font-weight: var(--ht-font-weight);
  margin: 0 -1px;
  padding: var(--ht-comments-textarea-vertical-padding) var(--ht-comments-textarea-horizontal-padding);
  border: var(--ht-comments-textarea-border-width, 1px) solid var(--ht-comments-textarea-border-color, transparent);
  border-inline-start: var(--ht-comments-textarea-border-width, 1px) solid var(--ht-comments-textarea-border-color, #1a42e8);
  color: var(--ht-comments-textarea-foreground-color);
  background-color: var(--ht-comments-textarea-background-color, #ffffff);
  outline: 0 !important;
  box-sizing: border-box;
  -webkit-appearance: none;
}
.htCommentsContainer .htCommentTextArea:focus {
  border: var(--ht-comments-textarea-focus-border-width, 1px) solid var(--ht-comments-textarea-focus-border-color, #1a42e8);
  color: var(--ht-comments-textarea-focus-foreground-color);
  background-color: var(--ht-comments-textarea-focus-background-color, #ffffff);
}

.handsontable .columnSorting:not(.indicatorDisabled) {
  position: relative;
}
.handsontable .columnSorting:not(.indicatorDisabled).sortAction {
  padding-inline-start: calc(var(--ht-icon-size, 16px) + 2px);
  padding-inline-end: calc(var(--ht-icon-size, 16px) + 2px);
  min-width: calc(var(--ht-icon-size, 16px) + 8px);
  max-width: calc(100% - var(--ht-icon-size, 16px) * 2 - 5px) !important;
}
.handsontable .columnSorting:not(.indicatorDisabled).sortAction:hover {
  text-decoration: none;
  cursor: pointer;
}
.handsontable .columnSorting:not(.indicatorDisabled).sortAction::before {
  content: "";
  display: block;
  width: var(--ht-icon-size, 16px);
  position: absolute;
  top: 50%;
  right: 2px;
  transform: translateY(-50%);
  text-align: right;
}
.handsontable .htLeft .columnSorting.sortAction {
  padding-inline-start: 0;
}
.handsontable .htRight .columnSorting.sortAction {
  padding-inline-start: var(--ht-icon-size, 16px);
  padding-inline-end: var(--ht-gap-size, 4px);
}
.handsontable .htRight .columnSorting.sortAction::before {
  left: 2px;
  right: auto;
  text-align: left;
}

[dir=rtl] .handsontable .columnSorting.sortAction::before {
  left: 2px;
  right: auto;
  text-align: left;
}
[dir=rtl] .handsontable .htRight .columnSorting.sortAction {
  padding-inline-start: var(--ht-gap-size, 4px);
  padding-inline-end: var(--ht-icon-size, 16px);
}
[dir=rtl] .handsontable .htLeft .columnSorting.sortAction {
  padding-inline-start: var(--ht-icon-size, 16px);
  padding-inline-end: var(--ht-gap-size, 4px);
}
[dir=rtl] .handsontable .htLeft .columnSorting.sortAction::before {
  left: auto;
  right: 2px;
  text-align: right;
}

.htGhostTable .htCore span.colHeader.columnSorting:not(.indicatorDisabled)::before {
  content: "*";
  display: inline-block;
  position: relative;
  /* The multi-line header and header with longer text need more padding to not hide arrow,
      we make header wider in \`GhostTable\` to make some space for arrow which is positioned absolutely in the main table */
  padding-right: 20px;
}

.handsontable .colHeader.columnSorting::after {
  content: "";
  display: block;
  width: 8px;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  margin-top: 4px;
  font-size: 8px;
  text-align: right;
}
.handsontable .colHeader.columnSorting[class^=sort-]::after, .handsontable .colHeader.columnSorting[class*=" sort-"]::after {
  content: "+";
}
.handsontable .colHeader.columnSorting.sort-1::after {
  content: "1";
}
.handsontable .colHeader.columnSorting.sort-2::after {
  content: "2";
}
.handsontable .colHeader.columnSorting.sort-3::after {
  content: "3";
}
.handsontable .colHeader.columnSorting.sort-4::after {
  content: "4";
}
.handsontable .colHeader.columnSorting.sort-5::after {
  content: "5";
}
.handsontable .colHeader.columnSorting.sort-6::after {
  content: "6";
}
.handsontable .colHeader.columnSorting.sort-7::after {
  content: "7";
}
.handsontable .htRight .colHeader.columnSorting::after {
  left: 0;
  right: auto;
  text-align: left;
}

[dir=rtl] .handsontable .colHeader.columnSorting::after {
  left: 0;
  right: auto;
  text-align: left;
}
[dir=rtl] .handsontable .htLeft .colHeader.columnSorting::after {
  left: auto;
  right: 0;
  text-align: right;
}

.htGhostTable th div button.changeType + span.colHeader.columnSorting:not(.indicatorDisabled) {
  padding-right: var(--ht-gap-size);
}

.handsontable .htRowHeaders .ht_master.innerBorderInlineStart ~ .ht_clone_top_inline_start_corner th:nth-child(2), .handsontable .htRowHeaders .ht_master.innerBorderInlineStart ~ .ht_clone_inline_start td:first-of-type {
  border-left: 0 none;
}
.handsontable .ht_clone_top_inline_start_corner th.ht__active_highlight {
  box-shadow: none;
}

.handsontable .manualColumnResizer {
  position: absolute;
  top: 0;
  width: 10px;
  margin: 0;
  cursor: col-resize;
  background: none;
  opacity: 0;
  z-index: 210;
}
.handsontable .manualColumnResizer::before, .handsontable .manualColumnResizer::after {
  content: "";
  display: block;
  position: absolute;
  top: 50%;
  left: 1px;
  width: 2px;
  height: calc(100% - 12px);
  max-height: 16px;
  margin-top: 0.5px;
  background: var(--ht-resize-indicator-color);
  border-radius: 2px;
  transform: translateY(-50%);
}
.handsontable .manualColumnResizer::after {
  left: auto;
  right: 0;
}
.handsontable .manualColumnResizer:hover, .handsontable .manualColumnResizer.active {
  opacity: 1;
}
.handsontable .manualColumnResizerGuide {
  position: absolute;
  inset-inline-end: unset;
  top: 0;
  width: 0;
  margin-inline-start: 5px;
  margin-inline-end: unset;
  display: none;
  border-inline-end: 1px solid var(--ht-accent-color);
  border-inline-start: none;
}
.handsontable .manualColumnResizerGuide.active {
  display: block;
  z-index: 209;
}

.handsontable .manualRowResizer {
  position: absolute;
  left: 0;
  z-index: 210;
  height: 10px;
  margin: 0;
  cursor: row-resize;
  background: none;
  opacity: 0;
}
.handsontable .manualRowResizer::before, .handsontable .manualRowResizer::after {
  content: "";
  display: block;
  position: absolute;
  top: 1px;
  left: 50%;
  width: calc(100% - 12px);
  max-width: 16px;
  height: 2px;
  background: var(--ht-resize-indicator-color);
  border-radius: 2px;
  transform: translateX(-50%);
}
.handsontable .manualRowResizer::after {
  top: auto;
  bottom: 0;
}
.handsontable .manualRowResizer:hover, .handsontable .manualRowResizer.active {
  opacity: 1;
}
.handsontable .manualRowResizerGuide {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 0;
  margin-top: 5px;
  display: none;
  border-bottom: 1px solid var(--ht-accent-color);
  border-top: none;
}
.handsontable .manualRowResizerGuide.active {
  display: block;
  z-index: 209;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight]:not([class*=fullySelectedMergedCell])::before {
  opacity: 0;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-multiple]::before {
  opacity: 0.14;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-0]:before {
  opacity: 0.14;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-1]:before {
  opacity: 0.21;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-2]:before {
  opacity: 0.28;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-3]:before {
  opacity: 0.35;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-4]:before {
  opacity: 0.42;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-5]:before {
  opacity: 0.49;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-6]:before {
  opacity: 0.56;
}

.handsontable tbody td[rowspan][class*=area][class*=highlight][class*=fullySelectedMergedCell-7]:before {
  opacity: 0.63;
}

.handsontable .wtHider {
  position: relative;
}
.handsontable .ht__manualColumnMove.after-selection--columns thead th.ht__highlight, .handsontable.ht__manualColumnMove.after-selection--columns thead th.ht__highlight {
  cursor: move;
  cursor: -moz-grab;
  cursor: -webkit-grab;
  cursor: grab;
}
.handsontable .ht__manualColumnMove.on-moving--columns *,
.handsontable .ht__manualColumnMove.on-moving--columns thead th.ht__highlight, .handsontable.ht__manualColumnMove.on-moving--columns *,
.handsontable.ht__manualColumnMove.on-moving--columns thead th.ht__highlight {
  cursor: move;
  cursor: -moz-grabbing;
  cursor: -webkit-grabbing;
  cursor: grabbing;
}
.handsontable .ht__manualColumnMove.on-moving--columns .manualColumnResizer, .handsontable.ht__manualColumnMove.on-moving--columns .manualColumnResizer {
  display: none;
}
.handsontable .ht__manualColumnMove--guideline, .handsontable .ht__manualColumnMove--backlight, .handsontable.ht__manualColumnMove--guideline, .handsontable.ht__manualColumnMove--backlight {
  position: absolute;
  height: 100%;
  display: none;
}
.handsontable .ht__manualColumnMove--guideline, .handsontable.ht__manualColumnMove--guideline {
  width: 1px;
  top: 0;
  margin-inline-start: -0.5px;
  margin-inline-end: 0;
  z-index: 205;
  background: var(--ht-move-indicator-color, #1a42e8);
}
.handsontable .ht__manualColumnMove--backlight, .handsontable.ht__manualColumnMove--backlight {
  display: none;
  z-index: 205;
  pointer-events: none;
  background: var(--ht-move-backlight-color);
}
.handsontable .on-moving--columns.show-ui .ht__manualColumnMove--guideline,
.handsontable .on-moving--columns .ht__manualColumnMove--backlight, .handsontable.on-moving--columns.show-ui .ht__manualColumnMove--guideline,
.handsontable.on-moving--columns .ht__manualColumnMove--backlight {
  display: block;
}

.handsontable .wtHider {
  position: relative;
}
.handsontable .ht__manualRowMove.after-selection--rows tbody th.ht__highlight, .handsontable.ht__manualRowMove.after-selection--rows tbody th.ht__highlight {
  cursor: move;
  cursor: -moz-grab;
  cursor: -webkit-grab;
  cursor: grab;
}
.handsontable .ht__manualRowMove.on-moving--rows *,
.handsontable .ht__manualRowMove.on-moving--rows tbody th.ht__highlight, .handsontable.ht__manualRowMove.on-moving--rows *,
.handsontable.ht__manualRowMove.on-moving--rows tbody th.ht__highlight {
  cursor: move;
  cursor: -moz-grabbing;
  cursor: -webkit-grabbing;
  cursor: grabbing;
}
.handsontable .ht__manualRowMove.on-moving--rows .manualRowResizer, .handsontable.ht__manualRowMove.on-moving--rows .manualRowResizer {
  display: none;
}
.handsontable .ht__manualRowMove--guideline, .handsontable .ht__manualRowMove--backlight, .handsontable.ht__manualRowMove--guideline, .handsontable.ht__manualRowMove--backlight {
  position: absolute;
  width: 100%;
  display: none;
}
.handsontable .ht__manualRowMove--guideline, .handsontable.ht__manualRowMove--guideline {
  border-top: 1px solid var(--ht-move-indicator-color);
  left: 0;
  z-index: 205;
}
.handsontable .ht__manualRowMove--backlight, .handsontable.ht__manualRowMove--backlight {
  display: none;
  z-index: 205;
  pointer-events: none;
  background: var(--ht-move-backlight-color);
}
.handsontable .on-moving--rows.show-ui .ht__manualRowMove--guideline,
.handsontable .on-moving--rows .ht__manualRowMove--backlight, .handsontable.on-moving--rows.show-ui .ht__manualRowMove--guideline,
.handsontable.on-moving--rows .ht__manualRowMove--backlight {
  display: block;
}

.ht-dialog {
  position: absolute;
  top: 0;
  left: 0;
  display: none;
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  letter-spacing: var(--ht-letter-spacing);
  width: 100%;
  height: 100%;
  z-index: 1060;
  opacity: 0;
  overflow-y: auto;
  border-radius: var(--ht-wrapper-border-radius);
  border: 1px solid var(--ht-border-color);
  box-sizing: border-box !important;
}
.ht-dialog[dir=rtl] {
  left: auto;
  right: 0;
}
.ht-dialog:focus {
  border: 1px solid var(--ht-accent-color);
  outline: none;
}
.ht-dialog:has(.htFocusCatcher:focus) {
  border: 1px solid var(--ht-accent-color);
  outline: none;
}
.ht-dialog * {
  box-sizing: border-box !important;
}
.ht-dialog--background-solid {
  background-color: var(--ht-dialog-solid-background-color);
}
.ht-dialog--background-semi-transparent {
  background-color: var(--ht-dialog-semi-transparent-background-color);
}
.ht-dialog--animation {
  transition: opacity var(--ht-table-transition) ease-in-out;
}
.ht-dialog--show {
  opacity: 1;
}
.ht-dialog__content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  padding: calc(var(--ht-gap-size) * 4);
  border-radius: var(--ht-wrapper-border-radius);
}
.ht-dialog__content {
  position: relative;
  padding: var(--ht-dialog-content-padding-horizontal) var(--ht-dialog-content-padding-vertical);
  max-width: 480px;
  color: var(--ht-foreground-color);
}
.ht-dialog__content--background {
  box-shadow: var(--ht-shadow-x, 0) var(--ht-shadow-y, 0) var(--ht-shadow-blur, 8px) var(--ht-shadow-color, rgba(0, 0, 0, 0.08));
  border-radius: var(--ht-dialog-content-border-radius);
  background-color: var(--ht-dialog-content-background-color);
}
.ht-dialog--confirm .ht-dialog__content-wrapper {
  text-align: center;
  padding: calc(var(--ht-gap-size) * 2);
}
.ht-dialog--confirm .ht-dialog__content-wrapper-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 480px;
  padding: calc(var(--ht-gap-size) * 2);
  border-radius: var(--ht-wrapper-border-radius);
}
.ht-dialog--confirm .ht-dialog__content-wrapper-inner--background {
  box-shadow: var(--ht-shadow-x, 0) var(--ht-shadow-y, 0) var(--ht-shadow-blur, 8px) var(--ht-shadow-color, rgba(0, 0, 0, 0.08));
  border-radius: var(--ht-dialog-content-border-radius);
  background-color: var(--ht-dialog-content-background-color);
}
.ht-dialog--confirm .ht-dialog__content-wrapper-inner:focus {
  outline: none;
  box-shadow: 0 0 0 1px var(--ht-accent-color);
}
.ht-dialog--confirm .ht-dialog__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ht-gap-size);
}
.ht-dialog--confirm .ht-dialog__content:has(.ht-dialog__buttons) {
  gap: calc(var(--ht-gap-size) * 2);
}
.ht-dialog--confirm .ht-dialog__title {
  margin: 0;
  font-size: var(--ht-font-size);
  font-weight: var(--ht-font-weight);
  line-height: var(--ht-line-height);
}
.ht-dialog--confirm .ht-dialog__description {
  margin: 0;
  color: var(--ht-foreground-secondary-color);
  font-size: var(--ht-font-size-small);
  line-height: var(--ht-line-height-small);
  font-weight: var(--ht-font-weight);
}
.ht-dialog--confirm .ht-dialog__buttons {
  display: flex;
  justify-content: center;
  flex-direction: row;
  flex-wrap: wrap;
  gap: calc(var(--ht-gap-size) * 2);
}

.handsontable.ht-pagination {
  color: var(--ht-pagination-bar-foreground-color);
  background: var(--ht-pagination-bar-background-color);
  border: 1px solid var(--ht-wrapper-border-color);
  border-top-color: transparent;
  border-radius: 0 0 var(--ht-wrapper-border-radius) var(--ht-wrapper-border-radius);
  font-size: var(--ht-font-size);
  line-height: var(--ht-line-height);
  box-sizing: border-box;
  overflow-x: auto;
}
.handsontable.ht-pagination--bordered {
  border-top-color: var(--ht-wrapper-border-color);
}
.handsontable.ht-pagination .ht-pagination__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(var(--ht-gap-size) * 4);
  border-radius: 0 0 var(--ht-wrapper-border-radius) var(--ht-wrapper-border-radius);
  padding-inline: var(--ht-pagination-bar-horizontal-padding);
  padding-block: var(--ht-pagination-bar-vertical-padding);
  min-width: 230px;
}
.handsontable.ht-pagination .ht-page-size-section {
  display: flex;
  align-items: center;
  gap: calc(var(--ht-gap-size) * 2);
}
.handsontable.ht-pagination .ht-page-size-section__label {
  white-space: nowrap;
}
.handsontable.ht-pagination .ht-page-size-section__select-wrapper {
  position: relative;
  border-radius: var(--ht-input-border-radius);
}
.handsontable.ht-pagination .ht-page-size-section__select-wrapper select {
  padding-inline-start: var(--ht-gap-size);
  padding-inline-end: calc(var(--ht-gap-size) + var(--ht-icon-size));
  padding-top: var(--ht-gap-size);
  padding-bottom: var(--ht-gap-size);
  border-radius: var(--ht-input-border-radius);
  color: var(--ht-input-foreground-color);
  background-color: var(--ht-input-background-color);
  border: 1px solid var(--ht-input-border-color);
  line-height: calc(var(--ht-line-height) - 4px);
  -webkit-appearance: none;
  font-size: inherit;
  cursor: pointer;
}
.handsontable.ht-pagination .ht-page-size-section__select-wrapper select:disabled {
  opacity: 0.4;
  cursor: default;
  color: var(--ht-input-disabled-foreground-color);
  background-color: var(--ht-input-disabled-background-color);
  border-color: var(--ht-input-disabled-border-color);
}
.handsontable.ht-pagination .ht-page-size-section__select-wrapper select:hover:not(:disabled) {
  color: var(--ht-input-hover-foreground-color);
  background-color: var(--ht-input-hover-background-color);
  border-color: var(--ht-input-hover-border-color);
}
.handsontable.ht-pagination .ht-page-size-section__select-wrapper select:focus {
  color: var(--ht-input-focus-foreground-color);
  background-color: var(--ht-input-focus-background-color);
  border-color: var(--ht-input-focus-border-color);
  outline: none;
}
.handsontable.ht-pagination .ht-page-size-section__select-wrapper::after {
  content: "";
  display: block;
  position: absolute;
  inset-inline-end: var(--ht-gap-size);
  inset-block-end: 50%;
  transform: translateY(50%);
  background-color: var(--ht-foreground-color);
  pointer-events: none;
}
.handsontable.ht-pagination .ht-page-counter-section {
  margin-inline-end: auto;
}
.handsontable.ht-pagination .ht-page-navigation-section {
  display: flex;
  align-items: center;
  gap: 1px;
}
.handsontable.ht-pagination .ht-page-navigation-section__button {
  font-size: inherit;
  border: 1px solid var(--ht-pagination-bar-background-color);
  color: var(--ht-secondary-button-foreground-color);
  background-color: var(--ht-pagination-bar-background-color);
  border-radius: var(--ht-icon-button-large-border-radius);
  padding: var(--ht-icon-button-large-padding);
  cursor: pointer;
}
.handsontable.ht-pagination .ht-page-navigation-section__button::before {
  content: "";
  display: block;
}
.handsontable.ht-pagination .ht-page-navigation-section__button--disabled {
  cursor: default;
  pointer-events: none;
  color: var(--ht-secondary-button-disabled-foreground-color);
}
.handsontable.ht-pagination .ht-page-navigation-section__button:hover:not(:disabled) {
  background-color: var(--ht-secondary-button-hover-background-color);
}
.handsontable.ht-pagination .ht-page-navigation-section__button:focus {
  outline: none;
  border: 1px solid var(--ht-accent-color);
}
.handsontable.ht-pagination .ht-page-navigation-section__label {
  white-space: nowrap;
  min-width: 100px;
  text-align: center;
}
.handsontable.ht-wrapper.htPagination {
  border-end-start-radius: 0;
  border-end-end-radius: 0;
}
.handsontable.ht-wrapper.htPagination .htCore {
  border-end-start-radius: 0;
  border-end-end-radius: 0;
}
.handsontable.ht-wrapper.htPagination .htCore thead tr:last-child th:first-child,
.handsontable.ht-wrapper.htPagination .htCore tbody tr:last-child td:first-child,
.handsontable.ht-wrapper.htPagination .htCore tbody tr:last-child th:first-child {
  border-end-start-radius: 0 !important;
}
.handsontable.ht-wrapper.htPagination .htCore thead tr:last-child th:last-child,
.handsontable.ht-wrapper.htPagination .htCore tbody tr:last-child td:last-child,
.handsontable.ht-wrapper.htPagination .htCore tbody tr:last-child th:last-child {
  border-end-end-radius: 0 !important;
}

.ht-loading__icon-svg {
  display: block;
  width: var(--ht-icon-size);
  height: var(--ht-icon-size);
  color: var(--ht-accent-color);
  animation: ht-loading-spin 1s linear infinite;
  transform-origin: 50% 50%;
}
.ht-loading__content {
  display: flex;
  align-items: center;
  gap: calc(var(--ht-gap-size) * 2);
}
.ht-loading__title {
  margin: 0;
  font-size: var(--ht-font-size);
  font-weight: var(--ht-font-weight);
  line-height: var(--ht-line-height);
}
.ht-loading__description {
  margin: 0;
  color: var(--ht-foreground-secondary-color);
  font-size: var(--ht-font-size-small);
  line-height: var(--ht-line-height-small);
  font-weight: var(--ht-font-weight);
}

@keyframes ht-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
.ht-empty-data-state {
  display: none;
  position: absolute;
  width: 100%;
  left: 0;
  z-index: 999;
  overflow-y: auto;
  border: 1px solid var(--ht-border-color);
  border-radius: var(--ht-wrapper-border-radius);
  box-sizing: border-box;
  background-color: var(--ht-background-color);
}
.ht-empty-data-state * {
  box-sizing: border-box !important;
}
.ht-empty-data-state__content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  min-height: 100%;
  padding: calc(var(--ht-gap-size) * 2);
  border-radius: var(--ht-wrapper-border-radius);
}
.ht-empty-data-state__content-wrapper-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 480px;
  padding: calc(var(--ht-gap-size) * 2);
  border-radius: var(--ht-wrapper-border-radius);
}
.ht-empty-data-state__content-wrapper-inner:focus {
  outline: none;
  box-shadow: 0 0 0 1px var(--ht-accent-color);
}
.ht-empty-data-state__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ht-gap-size);
}
.ht-empty-data-state__title {
  margin: 0;
  font-size: var(--ht-font-size);
  font-weight: var(--ht-font-weight);
  line-height: var(--ht-line-height);
}
.ht-empty-data-state__description {
  margin: 0;
  color: var(--ht-foreground-secondary-color);
  font-size: var(--ht-font-size-small);
  line-height: var(--ht-line-height-small);
  font-weight: var(--ht-font-weight);
}
.ht-empty-data-state__buttons {
  display: flex;
  justify-content: center;
  flex-direction: row;
  flex-wrap: wrap;
  gap: calc(var(--ht-gap-size) * 2);
}
.ht-empty-data-state__buttons--has-buttons {
  margin-top: calc(var(--ht-gap-size) * 2);
}
.ht-empty-data-state--disable-top-border {
  border-start-start-radius: 0;
  border-start-end-radius: 0;
  border-top-width: 0;
}
.ht-empty-data-state--disable-inline-border {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  border-inline-start-width: 0;
}
.ht-empty-data-state--disable-bottom-border, .ht-empty-data-state:has(~ .ht-pagination) {
  border-end-start-radius: 0;
  border-end-end-radius: 0;
  border-bottom-width: 0;
}`;
