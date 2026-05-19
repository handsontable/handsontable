---
type: reference
id: r7vpat01
title: Accessibility conformance report (VPAT)
metaTitle: Accessibility conformance report (VPAT) - JavaScript Data Grid | Handsontable
description: Review Handsontable's Voluntary Product Accessibility Template (VPAT) report, covering WCAG 2.2 Level A and AA conformance.
permalink: /accessibility-conformance-report
canonicalUrl: /accessibility-conformance-report
tags:
  - accessibility
  - a11y
  - vpat
  - wcag
  - compliance
  - conformance
  - section 508
react:
  id: r7vpat02
  metaTitle: Accessibility conformance report (VPAT) - React Data Grid | Handsontable
angular:
  id: r7vpat03
  metaTitle: Accessibility conformance report (VPAT) - Angular Data Grid | Handsontable
searchCategory: Guides
category: Accessibility
---

This page is the Voluntary Product Accessibility Template (VPAT) for Handsontable, documenting conformance with WCAG 2.1 and Section 508 accessibility standards.

This Accessibility Conformance Report (ACR) follows the VPAT&reg; 2.5 format developed by the Information Technology Industry Council (ITI). It describes how Handsontable, a JavaScript data grid component, conforms to the Web Content Accessibility Guidelines (WCAG) 2.2 at Level A and Level AA.

[[toc]]

## Report details

<table>
  <tr><td><strong>Product name</strong></td><td>Handsontable - JavaScript Data Grid</td></tr>
  <tr><td><strong>Report date</strong></td><td>March 2026</td></tr>
  <tr><td><strong>Report version</strong></td><td>1.1</td></tr>
  <tr><td><strong>Standards covered</strong></td><td>WCAG 2.2 Level A and AA</td></tr>
  <tr><td><strong>Vendor</strong></td><td>Handsontable sp. z o.o.</td></tr>
  <tr><td><strong>Contact</strong></td><td>support@handsontable.com</td></tr>
  <tr><td><strong>Audit report reference</strong></td><td>Kinaole (December 2025 - January 2026)</td></tr>
  <tr><td><strong>VPAT template version</strong></td><td>VPAT&reg; 2.5 (October 2024)</td></tr>
</table>

::: tip

Handsontable is an embeddable component, not a standalone web application. The final accessible experience depends on developer configuration choices and the surrounding host application. Developers integrating Handsontable bear responsibility for overall application-level conformance.

:::

## Applicable standards

This report covers the following standard:

- **Web Content Accessibility Guidelines 2.2** - [https://www.w3.org/TR/WCAG22/](https://www.w3.org/TR/WCAG22/) - Level A and Level AA

WCAG 2.2, published October 2023, supersedes WCAG 2.1. It removes Success Criterion 4.1.1 Parsing and adds nine new success criteria. The Kinaole audit report (December 2025 - January 2026) was conducted against WCAG 2.1; additional WCAG 2.2 criteria are assessed via internal evaluation and noted accordingly.

## Notes

Handsontable supports two primary keyboard navigation paradigms configurable by the developer:

- **Spreadsheet Mode** (default) - <kbd>Tab</kbd>/<kbd>Shift+Tab</kbd> as primary navigation, emulating Microsoft Excel and Google Sheets behavior.
- **Data Grid Mode** - Arrow-key navigation with a single tab stop; navigable headers via [`navigableHeaders: true`](@/api/options.md#navigableheaders); Tab navigation disabled via [`tabNavigation: false`](@/api/options.md#tabnavigation).

Row and column virtualization is enabled by default. For complete assistive technology support, [`renderAllRows: true`](@/api/options.md#renderallrows) and [`renderAllColumns: true`](@/api/options.md#renderallcolumns) are recommended, which ensures a complete accessibility tree is available to screen readers.

Known issues are tracked in the public GitHub repository at [github.com/handsontable/handsontable](https://github.com/handsontable/handsontable) and in an internal backlog.

## Evaluation methods

- Manual keyboard-only navigation testing across all major interaction patterns
- Screen reader testing: **VoiceOver** (macOS Sequoia 15.3.2 / iOS 18.3) and **NVDA 2025.3** (Windows 11)
- Browsers tested: Chrome 141.0.7390.66, Firefox 143.0.4
- Additional testing on Android 14
- Color contrast analysis using contrast ratio measurement tools
- HTML/ARIA code inspection of rendered markup
- **Kinaole accessibility audit report** (December 2025 / January 2026) - this ACR was prepared internally by Handsontable based on that report

### Audit scope - 8 interaction patterns evaluated

- Nested Menus
- Arabic / RTL Nested Menu
- Cell Types (dropdown, autocomplete, checkbox, date)
- Summary Row
- Pagination and Data Loading
- Row Parents (nested rows with expand/collapse)
- Merged Cells with Formula
- Empty Data State

::: tip

JAWS is listed as a supported screen reader in Handsontable documentation and is addressed in code design. However, JAWS was not included in the most recent formal audit cycle (December 2025 - January 2026). Internal testing with JAWS is under evaluation for inclusion in future audit cycles.

:::

## Conformance summary

The table below summarizes the count of criteria per conformance level across WCAG 2.2 Level A and AA (55 success criteria total).

| Supports | Partially Supports | Does Not Support | Not Applicable | Not Evaluated |
|---|---|---|---|---|
| 8 | 8 | 7 | 17 | 15 |

Conformance levels used in this report:

- **Supports** - The functionality of the product has at least one method that meets the criterion without known defects or meets with equivalent facilitation.
- **Partially Supports** - Some functionality of the product does not meet the criterion.
- **Does Not Support** - The majority of product functionality does not meet the criterion.
- **Not Applicable** - The criterion is not relevant to this product.
- **Not Evaluated** - The criterion has not been evaluated against the conformance level.

## WCAG 2.2 Level A

<div class="table-container vpat-table">

<table>
  <thead>
    <tr>
      <th>Criteria</th>
      <th>Conformance level</th>
      <th>Remarks and explanations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1.1.1 Non-text Content</strong></td>
      <td>Partially Supports</td>
      <td>The decorative loading spinner SVG (<code>ht-loading__icon-svg</code>) is not hidden from assistive technologies - it lacks <code>aria-hidden="true"</code> and <code>role="img"</code>, causing unnecessary announcements. All other non-text content with functional purpose includes accessible names. Fix is tracked internally (trivial severity).</td>
    </tr>
    <tr>
      <td><strong>1.2.1 Audio-only and Video-only (Prerecorded)</strong></td>
      <td>Not Applicable</td>
      <td>The product contains no audio-only or video-only content.</td>
    </tr>
    <tr>
      <td><strong>1.2.2 Captions (Prerecorded)</strong></td>
      <td>Not Applicable</td>
      <td>No audio content in synchronized media.</td>
    </tr>
    <tr>
      <td><strong>1.2.3 Audio Description or Media Alternative (Prerecorded)</strong></td>
      <td>Not Applicable</td>
      <td>No prerecorded video content.</td>
    </tr>
    <tr>
      <td><strong>1.3.1 Info and Relationships</strong></td>
      <td>Does Not Support</td>
      <td>
        Multiple critical and normal severity issues identified in the external audit:
        <ol>
          <li><strong>Mixed table/ARIA semantics (Critical):</strong> Native <code>&lt;table&gt;</code>, <code>&lt;thead&gt;</code>, <code>&lt;th&gt;</code> elements are combined with ARIA grid roles (<code>rowgroup</code>, <code>row</code>, <code>columnheader</code>, <code>gridcell</code>), causing screen readers to misinterpret header-cell relationships - including announcing the wrong column header.</li>
          <li><strong>No table caption (Normal):</strong> The grid provides no <code>&lt;caption&gt;</code> or <code>aria-label</code> to describe its purpose (tracked: #3044).</li>
          <li><strong>Column header filter button hidden (Critical):</strong> The only interactive element inside column headers has <code>aria-hidden="true"</code>, making filter access impossible for keyboard/screen reader users.</li>
          <li><strong>Checkbox group semantics (Critical):</strong> Filter checkboxes use incorrect <code>aria-label</code> values ("Checked"/"Unchecked" instead of option values), preventing users from identifying which option they are selecting.</li>
          <li><strong>Menu separators as interactive items (Normal):</strong> Separators implemented as <code>role="menuitem"</code> with decorative dash labels, announced as selectable options.</li>
          <li><strong>Autocomplete semantics (Major):</strong> Autocomplete list implemented using <code>&lt;table&gt;</code> with ARIA listbox roles - conflicting semantics.</li>
          <li><strong>Summary row not identified (Critical):</strong> The summary/totals row is indistinguishable from data rows programmatically.</li>
          <li><strong>Row headers not associated (Critical):</strong> Row number headers are in a separate <code>&lt;table&gt;</code>, not programmatically linked to data cells.</li>
        </ol>
      </td>
    </tr>
    <tr>
      <td><strong>1.3.2 Meaningful Sequence</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>1.3.3 Sensory Characteristics</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>1.4.1 Use of Color</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>1.4.2 Audio Control</strong></td>
      <td>Not Applicable</td>
      <td>No audio content.</td>
    </tr>
    <tr>
      <td><strong>2.1.1 Keyboard</strong></td>
      <td>Partially Supports</td>
      <td>The expand/collapse control in the Row Parents (nested rows) feature is accessible via keyboard when navigation menu mode is enabled (<a href="@/api/options.md#navigableheaders"><code>navigableHeaders: true</code></a>). In the default spreadsheet mode, the control has <code>tabindex="-1"</code> and is <code>aria-hidden="true"</code>, making it inaccessible via keyboard without this configuration.</td>
    </tr>
    <tr>
      <td><strong>2.1.2 No Keyboard Trap</strong></td>
      <td>Not Evaluated</td>
      <td>Not explicitly tested in this cycle. No keyboard traps were reported as discovered issues.</td>
    </tr>
    <tr>
      <td><strong>2.1.4 Character Key Shortcuts</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>2.2.1 Timing Adjustable</strong></td>
      <td>Not Applicable</td>
      <td>No time-limited content in the product.</td>
    </tr>
    <tr>
      <td><strong>2.2.2 Pause, Stop, Hide</strong></td>
      <td>Not Applicable</td>
      <td>No moving, blinking, or auto-updating content by default.</td>
    </tr>
    <tr>
      <td><strong>2.3.1 Three Flashes or Below Threshold</strong></td>
      <td>Not Applicable</td>
      <td>No flashing content.</td>
    </tr>
    <tr>
      <td><strong>2.4.1 Bypass Blocks</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>2.4.2 Page Titled</strong></td>
      <td>Not Applicable</td>
      <td>Component-level product. Page title is the responsibility of the host application.</td>
    </tr>
    <tr>
      <td><strong>2.4.3 Focus Order</strong></td>
      <td>Not Evaluated</td>
      <td>Not explicitly tested. Mixed table/ARIA semantics identified in 1.3.1 may produce unpredictable focus ordering for screen reader users.</td>
    </tr>
    <tr>
      <td><strong>2.4.4 Link Purpose (In Context)</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>2.5.1 Pointer Gestures</strong></td>
      <td>Partially Supports</td>
      <td>Column resizing and row reordering are implemented via drag gestures that require a specific path of movement. Single-pointer alternatives that do not require a path are not consistently available for these operations. Not formally included in the Kinaole audit scope; assessed internally.</td>
    </tr>
    <tr>
      <td><strong>2.5.2 Pointer Cancellation</strong></td>
      <td>Supports</td>
      <td>Functionality is not triggered on the down-event alone. Activation events use the up-event, allowing users to abort unintended interactions by moving the pointer away before release.</td>
    </tr>
    <tr>
      <td><strong>2.5.3 Label in Name</strong></td>
      <td>Partially Supports</td>
      <td>Some interactive controls expose accessible names that do not contain the visible label text. The top-left corner button ("Select whole grid") has an accessible name conveyed only via <code>aria-label</code> with no matching visible text. Sorting and filter controls may similarly diverge. Under review in the internal backlog.</td>
    </tr>
    <tr>
      <td><strong>2.5.4 Motion Actuation</strong></td>
      <td>Not Applicable</td>
      <td>No product functionality is operated through device motion or user motion.</td>
    </tr>
    <tr>
      <td><strong>3.1.1 Language of Page</strong></td>
      <td>Not Applicable</td>
      <td>Component-level product. Page language is the responsibility of the host application.</td>
    </tr>
    <tr>
      <td><strong>3.2.1 On Focus</strong></td>
      <td>Supports</td>
      <td>Receiving focus does not initiate a change of context. Verified across all tested interaction patterns. Passed in external audit.</td>
    </tr>
    <tr>
      <td><strong>3.2.2 On Input</strong></td>
      <td>Supports</td>
      <td>Changing settings does not automatically cause a change of context. Verified across all tested interaction patterns. Passed in external audit.</td>
    </tr>
    <tr>
      <td><strong>3.2.6 Consistent Help</strong></td>
      <td>Not Applicable</td>
      <td>Handsontable is a data grid component and provides no human contact details, self-help mechanism, or automated contact mechanism. <em>(New criterion in WCAG 2.2.)</em></td>
    </tr>
    <tr>
      <td><strong>3.3.1 Error Identification</strong></td>
      <td>Partially Supports</td>
      <td>Some input errors are not identified programmatically. Issues are related to labelling failures described under 3.3.2.</td>
    </tr>
    <tr>
      <td><strong>3.3.2 Labels or Instructions</strong></td>
      <td>Partially Supports</td>
      <td>The top-left corner button ("Select whole grid") provides an accessible name via <code>aria-label</code> for screen reader users but has no visible label, icon, or text to communicate its purpose to sighted users - particularly those with cognitive impairments (Normal severity). Other controls are generally labelled appropriately.</td>
    </tr>
    <tr>
      <td><strong>3.3.7 Redundant Entry</strong></td>
      <td>Not Applicable</td>
      <td>Handsontable is a data grid component with no multi-step process that requests previously provided information within the same session. <em>(New criterion in WCAG 2.2.)</em></td>
    </tr>
    <tr>
      <td><strong>4.1.2 Name, Role, Value</strong></td>
      <td>Does Not Support</td>
      <td>
        Multiple critical failures across name, role, and value exposure:
        <ol>
          <li>Sorting state changes not announced to screen readers (known issue #2375).</li>
          <li>Range/area selection not announced (#2343).</li>
          <li>Nested column header announcement issues (#2373).</li>
          <li>Expand/collapse state management issues in nested rows.</li>
          <li>Date picker (Pikaday) not properly announced.</li>
          <li>ARIA roles inconsistently applied across components (see 1.3.1).</li>
        </ol>
      </td>
    </tr>
  </tbody>
</table>

</div>

## WCAG 2.2 Level AA

<div class="table-container vpat-table">

<table>
  <thead>
    <tr>
      <th>Criteria</th>
      <th>Conformance level</th>
      <th>Remarks and explanations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1.2.4 Captions (Live)</strong></td>
      <td>Not Applicable</td>
      <td>No live audio content.</td>
    </tr>
    <tr>
      <td><strong>1.2.5 Audio Description (Prerecorded)</strong></td>
      <td>Not Applicable</td>
      <td>No prerecorded video content.</td>
    </tr>
    <tr>
      <td><strong>1.3.4 Orientation</strong></td>
      <td>Supports</td>
      <td>Content is not restricted to a single display orientation. Verified on macOS, iOS, Windows, and Android 14. Passed in external audit.</td>
    </tr>
    <tr>
      <td><strong>1.3.5 Identify Input Purpose</strong></td>
      <td>Partially Supports</td>
      <td>Input purpose identification is partially implemented. Some fields (e.g., website address inputs in certain configurations) do not correctly expose input purpose via <code>autocomplete</code> attributes.</td>
    </tr>
    <tr>
      <td><strong>1.4.3 Contrast (Minimum)</strong></td>
      <td>Does Not Support</td>
      <td>
        Insufficient text contrast identified in the Horizon theme:
        <ol>
          <li>Summary row: foreground <code>#37bc6c</code> on background <code>#F7F7F9</code> - contrast ratio <strong>2.29:1</strong> (required: 4.5:1).</li>
          <li>Additional link text contrast failures in the Summary area.</li>
        </ol>
        Custom themes may vary. Fixes are tracked in the internal backlog.
      </td>
    </tr>
    <tr>
      <td><strong>1.4.4 Resize Text</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>1.4.5 Images of Text</strong></td>
      <td>Not Applicable</td>
      <td>The product does not use images of text for meaningful content.</td>
    </tr>
    <tr>
      <td><strong>1.4.10 Reflow</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope. A data grid by nature has complex reflow behavior; this criterion warrants dedicated evaluation.</td>
    </tr>
    <tr>
      <td><strong>1.4.11 Non-text Contrast</strong></td>
      <td>Does Not Support</td>
      <td>
        UI component contrast failures identified in the Horizon theme:
        <ol>
          <li>Green navigation icon (<code>#37bc6c</code>) on white background (<code>#FFFFFF</code>) in Nested Menu / date picker navigation - contrast ratio <strong>2.45:1</strong> (required: 3:1).</li>
          <li>Similar icon contrast failure in the Summary area - contrast ratio <strong>2.29:1</strong>.</li>
        </ol>
        Fixes are tracked in the internal backlog.
      </td>
    </tr>
    <tr>
      <td><strong>1.4.12 Text Spacing</strong></td>
      <td>Supports</td>
      <td>Content and functionality are fully preserved when text-spacing overrides are applied (line height 1.5x, paragraph spacing 2x, letter spacing 0.12x, word spacing 0.16x). Passed in external audit.</td>
    </tr>
    <tr>
      <td><strong>1.4.13 Content on Hover or Focus</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>2.4.5 Multiple Ways</strong></td>
      <td>Not Applicable</td>
      <td>Single-component product. Multi-page navigation is the responsibility of the host application.</td>
    </tr>
    <tr>
      <td><strong>2.4.6 Headings and Labels</strong></td>
      <td>Does Not Support</td>
      <td>The column header element that combines sorting and filter menu functionality provides no descriptive label - the only interactive element within it is <code>aria-hidden="true"</code>. Users cannot determine the purpose of interactive controls within column headers. Related to failures in 1.3.1.</td>
    </tr>
    <tr>
      <td><strong>2.4.7 Focus Visible</strong></td>
      <td>Supports</td>
      <td>Keyboard focus indicator is visible across all tested interaction patterns. Passed in external audit.</td>
    </tr>
    <tr>
      <td><strong>2.4.11 Focus Not Obscured (Minimum)</strong></td>
      <td>Not Evaluated</td>
      <td>Not formally evaluated in the external audit. Frozen rows and frozen columns may potentially obscure the currently focused element. Dedicated evaluation is planned for a future audit cycle. <em>(New criterion in WCAG 2.2.)</em></td>
    </tr>
    <tr>
      <td><strong>2.5.7 Dragging Movements</strong></td>
      <td>Partially Supports</td>
      <td>Column resizing and row reordering are implemented via drag operations. A single-pointer alternative that does not require a dragging movement is not consistently available for these interactions. Under review internally; fix is planned. <em>(New criterion in WCAG 2.2.)</em></td>
    </tr>
    <tr>
      <td><strong>2.5.8 Target Size (Minimum)</strong></td>
      <td>Not Evaluated</td>
      <td>The minimum 24x24 CSS pixel target size for interactive elements (column resize handles, row header controls, cell editors, filter buttons) has not been formally verified. Evaluation is planned. <em>(New criterion in WCAG 2.2.)</em></td>
    </tr>
    <tr>
      <td><strong>3.1.2 Language of Parts</strong></td>
      <td>Does Not Support</td>
      <td>When the grid is configured with RTL/Arabic content, <code>aria-label</code> and other ARIA attributes are not translated to match the page language. Screen reader users hear labels announced in a different language than the surrounding content, creating an inconsistent experience (Normal severity finding in external audit).</td>
    </tr>
    <tr>
      <td><strong>3.2.3 Consistent Navigation</strong></td>
      <td>Supports</td>
      <td>Navigation mechanisms are consistent across all tested interaction patterns. Passed in external audit.</td>
    </tr>
    <tr>
      <td><strong>3.2.4 Consistent Identification</strong></td>
      <td>Supports</td>
      <td>Components with the same functionality are consistently identified. Passed in external audit.</td>
    </tr>
    <tr>
      <td><strong>3.3.3 Error Suggestion</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>3.3.4 Error Prevention (Legal, Financial, Transactions)</strong></td>
      <td>Not Evaluated</td>
      <td>Not included in the external audit scope.</td>
    </tr>
    <tr>
      <td><strong>3.3.8 Accessible Authentication (Minimum)</strong></td>
      <td>Not Applicable</td>
      <td>Handsontable does not provide authentication functionality. <em>(New criterion in WCAG 2.2.)</em></td>
    </tr>
    <tr>
      <td><strong>4.1.3 Status Messages</strong></td>
      <td>Does Not Support</td>
      <td>
        Multiple status conditions are not programmatically conveyed:
        <ol>
          <li>Sorting state changes not announced (#2375).</li>
          <li>Range/area selection state not announced (#2343).</li>
          <li>Cell values identified as formula results not exposed (#3046).</li>
          <li>Empty cell status not announced (#2441).</li>
          <li>Loading state may not be consistently announced in all configurations.</li>
        </ol>
      </td>
    </tr>
  </tbody>
</table>

</div>

## Known open issues

The following issues are acknowledged, tracked, and actively prioritized. Transparency about open issues is integral to our approach to accessibility improvement.

| Issue | Ref. | Severity | WCAG Criterion |
|---|---|---|---|
| Sorting state not announced to screen readers | #2375 | High | 4.1.3 |
| Range/area selection not announced | #2343 | High | 4.1.2, 4.1.3 |
| Nested column headers announcement issues | #2373 | Normal | 4.1.2 |
| No mechanism to add accessible table description | #3044 | Normal | 1.3.1 |
| Cell value as formula result not indicated | #3046 | Normal | 4.1.2, 4.1.3 |
| Empty cell index not announced | #2441 | Normal | 4.1.3 |
| Date picker (Pikaday) not properly announced | - | Normal | 4.1.2 |
| SVG loading icon not hidden from screen readers | - | Trivial | 1.1.1 |
| Menu separators exposed as interactive menu items | - | Normal | 1.3.1, 4.1.2 |
| Checkbox group semantics in filter menu | - | Critical | 1.3.1, 4.1.2 |
| Color contrast failures in Horizon theme (summary row, icons) | - | Normal | 1.4.3, 1.4.11 |

## WCAG 2.2 assessment notes

This report targets **WCAG 2.2 Level AA**, published October 2023. WCAG 2.2 removes Success Criterion 4.1.1 Parsing and adds the following criteria (all included in the tables above):

- **Level A (new):** 3.2.6 Consistent Help, 3.3.7 Redundant Entry - both assessed as Not Applicable to a data grid component.
- **Level A (inherited from WCAG 2.1, now formally assessed):** 2.5.1 Pointer Gestures (Partially Supports), 2.5.2 Pointer Cancellation (Supports), 2.5.3 Label in Name (Partially Supports), 2.5.4 Motion Actuation (Not Applicable).
- **Level AA (new):** 2.4.11 Focus Not Obscured Minimum (Not Evaluated - frozen rows/columns require dedicated testing), 2.5.7 Dragging Movements (Partially Supports - drag alternatives incomplete), 2.5.8 Target Size Minimum (Not Evaluated - formal verification pending), 3.3.8 Accessible Authentication Minimum (Not Applicable).

The Kinaole audit report (December 2025 - January 2026) covered WCAG 2.1 A and AA criteria. The nine WCAG 2.2-specific criteria have been assessed internally and are clearly labelled in the tables above. A future audit cycle will include formal third-party evaluation of all WCAG 2.2 additions.

## Legal disclaimer

This Accessibility Conformance Report was prepared internally by Handsontable, based on the Kinaole audit report (December 2025 - January 2026) and internal evaluation. It represents the product's conformance status at the time of evaluation.

Accessibility is an ongoing commitment. Handsontable maintains an active issue backlog, regularly updates the product, and continues to invest in improving conformance. This report will be updated as issues are resolved and new evaluations are completed.

Conformance claims reflect the **default configuration** of Handsontable. Developer-controlled options ([`navigableHeaders`](@/api/options.md#navigableheaders), [`renderAllRows`](@/api/options.md#renderallrows), [`renderAllColumns`](@/api/options.md#renderallcolumns), [`tabNavigation`](@/api/options.md#tabnavigation), and others) may significantly affect the accessible experience. Developers are responsible for implementing appropriate configurations and for overall application-level accessibility.

This document does not constitute a legal certification of conformance. Use of this document is voluntary and for informational procurement purposes.

## Related

<div class="boxes-list gray">

- [Accessibility](@/guides/accessibility/accessibility/accessibility.md)

</div>
