import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { EDITOR_STATE } from '../baseEditor';
import { HandsontableEditor } from '../handsontableEditor';
import { pivot } from '../../helpers/array';
import { isKeyValueObject, isObject } from '../../helpers/object';
import {
  addClass,
  fastInnerHTML,
  getCaretPosition,
  getFractionalScalingCompensation,
  getScrollbarWidth,
  getSelectionEndPosition,
  outerWidth,
  setAttribute,
  setCaretPosition,
  empty,
} from '../../helpers/dom/element';
import { isDefined, stringify } from '../../helpers/mixed';
import { stripTags, localeLowerCase } from '../../helpers/string';
import { KEY_CODES, isPrintableChar } from '../../helpers/unicode';
import { textRenderer } from '../../renderers/textRenderer';
import {
  A11Y_ACTIVEDESCENDANT,
  A11Y_AUTOCOMPLETE,
  A11Y_COMBOBOX,
  A11Y_CONTROLS,
  A11Y_EXPANDED,
  A11Y_HASPOPUP,
  A11Y_LISTBOX,
  A11Y_LIVE,
  A11Y_OPTION,
  A11Y_POSINSET,
  A11Y_PRESENTATION,
  A11Y_RELEVANT,
  A11Y_SELECTED,
  A11Y_SETSIZE,
  A11Y_TEXT,
} from '../../helpers/a11y';
import { debounce } from '../../helpers/function';

export const EDITOR_TYPE = 'autocomplete';

type ChoiceArray = unknown[];

/**
 * @private
 * @class AutocompleteEditor
 */
export class AutocompleteEditor extends HandsontableEditor {
  /**
   * Returns the unique editor type identifier for the autocomplete editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Query string to turn available values over.
   *
   * @type {string}
   */
  query: string | null = null;
  /**
   * Contains stripped choices.
   *
   * @type {string[]}
   */
  strippedChoices: ChoiceArray = [];
  /**
   * Contains raw choices.
   *
   * @type {Array}
   */
  rawChoices: ChoiceArray = [];
  /**
   * Holds the prefix of the editor's id.
   *
   * @type {string}
   */
  #idPrefix = this.hot.guid.slice(0, 9);
  /**
   * Generation token for the in-flight choices query. Bumped on every `queryChoices()` call, so a
   * response belonging to a superseded query can be told apart from the one the editor is waiting
   * for.
   *
   * @type {number}
   */
  #queryGeneration = 0;
  /**
   * Edit-session token. Bumped on every `close()`, so a `source` response can tell that the edit it
   * belongs to has ended - which neither `state` nor `_opened` reports reliably. Only the response
   * needs a token: user code holds that callback and there is nothing to cancel, while the editor's
   * own deferred queries are cancelled outright through `#queryTimeouts`.
   *
   * @type {number}
   */
  #editSession = 0;
  /**
   * Timer ids of the `queryChoices()` calls this editor has deferred and not yet run. Cleared on
   * `close()`, so a query scheduled during an edit never runs after it.
   *
   * @type {Set}
   */
  #queryTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  /**
   * Gets current value from editable element.
   *
   * @returns {string}
   */
  getValue(): unknown {
    const selectedValue = this.rawChoices.find((value) => {
      const strippedValue = this.stripValueIfNeeded(value);

      const resolvedValue = this.#isKeyValueObject(strippedValue)
        ? (strippedValue as Record<string, unknown>).value : strippedValue;

      return resolvedValue === this.TEXTAREA.value;
    });

    if (isDefined(selectedValue)) {
      return selectedValue;
    }

    return this.TEXTAREA.value;
  }

  /**
   * Creates an editor's elements and adds necessary CSS classnames.
   */
  createElements(): void {
    super.createElements();

    // Typing supersedes a pick made with the arrow keys or a click - that pick never wrote to the
    // TEXTAREA, so nothing about the text says it happened. `input` rather than the `beforeKeyDown`
    // hook because text arrives here by routes that fire no keydown at all: a right-click Paste, a
    // drag-and-drop, an IME commit. It does not fire for a programmatic `setValue()`, so the commit
    // path writing the resolved choice back cannot clear the origin it just acted on.
    this.eventManager.addEventListener(this.TEXTAREA, 'input', () => {
      this.innerSelectionOrigin = null;
    });

    addClass(this.htContainer, 'autocompleteEditor');
    addClass(this.htContainer, this.hot.rootWindow.navigator.platform.indexOf('Mac') === -1 ? '' : 'htMacScroll');

    if (this.hot.getSettings().ariaTags) {
      setAttribute(this.TEXTAREA, [
        A11Y_TEXT(),
        A11Y_COMBOBOX(),
        A11Y_HASPOPUP('listbox'),
        A11Y_AUTOCOMPLETE(),
      ]);
    }
  }

  /**
   * Prepares editor's metadata and configuration of the internal Handsontable's instance.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  prepare(
    row: number, col: number, prop: string | number,
    td: HTMLTableCellElement, value: unknown, cellProperties: CellProperties): void {
    super.prepare(row, col, prop, td, value, cellProperties);

    if (this.hot.getSettings().ariaTags) {
      setAttribute(this.TEXTAREA, [
        A11Y_EXPANDED('false'),
        A11Y_CONTROLS(`${this.#idPrefix}-listbox-${row}-${col}`),
      ]);
    }

    this.htOptions = {
      ...this.htOptions,
      valueGetter: (cellValue: unknown) => (this.#isKeyValueObject(cellValue)
        ? (cellValue as Record<string, unknown>).value : cellValue),
    };
  }

  /**
   * Opens the editor and adjust its size and internal Handsontable's instance.
   */
  open(): void {
    // The editor instance is reused across cells and `updateChoicesList()` is the only writer, so
    // without this the list from the PREVIOUS cell survives until this cell's deferred query lands.
    // `resolveInnerSelectionValue()` matches against it, so a commit inside that window could write
    // a choice belonging to another column's `source`.
    this.strippedChoices = [];
    this.rawChoices = [];

    super.open();

    const trimDropdownSetting = this.cellProperties.trimDropdown as boolean | undefined;
    const trimDropdown = trimDropdownSetting === undefined ? true : trimDropdownSetting;
    const rootInstanceAriaTagsEnabled = this.hot.getSettings().ariaTags;
    const sourceArray = Array.isArray(this.cellProperties.source) ? this.cellProperties.source as unknown[] : null;
    const sourceSize = sourceArray?.length;
    const { row: rowIndex, col: colIndex } = this;

    this.showEditableElement();
    this.focus();
    this.addHook('beforeKeyDown', (event: KeyboardEvent) => this.onBeforeKeyDown(event));
    this.htEditor.addHook('afterScroll', this.#focusDebounced);

    this.htEditor.updateSettings({
      colWidths: trimDropdown ? [outerWidth(this.TEXTAREA) - 2] : undefined,
      autoColumnSize: true,
      // With `trimDropdown: false` the list column is sized from its content by
      // AutoColumnSize, so short options produced a list narrower than the edited
      // cell (#13180). Floor the column at the cell width: the option rows stay
      // full-width click targets, and `getTargetEditorWidth()` (which reads
      // `getColWidth(0)`) widens the outer container to match automatically.
      modifyColWidth: trimDropdown ? undefined : (width?: number): number => {
        return Math.max(width ?? 0, outerWidth(this.TEXTAREA) - 2);
      },
      renderer: (
        hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
        prop: string | number, value: unknown, cellProperties: CellProperties) => {
        textRenderer(hotInstance, TD, row, col, prop, value, cellProperties);

        const { filteringCaseSensitive, allowHtml } = this.cellProperties;
        const locale = this.cellProperties.locale as string | undefined;
        const query = this.query;
        const cellValue = stringify(value);

        if (allowHtml) {
          // `allowHtml` is an explicit opt-in to raw HTML, disabled by default and warned about in
          // its own documentation. PR #7368 turned sanitizing off for it and for the `html` cell
          // type deliberately, and `autocompleteRenderer` still writes the cell that way, so the
          // dropdown keeps matching it: `false` means raw, and silent about it.
          //
          // Going through `fastInnerHTML` rather than assigning `innerHTML` directly is what makes
          // that a stated policy instead of an unguarded sink, and leaves one place to revisit if
          // a configured `sanitizer` is ever made to cover this content.
          //
          // The scope argument is inert while the sanitizer is `false` - nothing reads an option
          // and nothing warns. It is `this.hot.rootElement`, not the `hotInstance` argument,
          // because this renderer runs inside `htEditor`, a separate Handsontable instance with
          // its own settings. That matters the moment the `false` above is revisited: reading the
          // option off the argument would silently consult the wrong grid.
          fastInnerHTML(TD, cellValue, false, 'html', this.hot.rootElement);
        } else if (cellValue && query && query.length > 0) {
          const indexOfMatch = filteringCaseSensitive === true ?
            cellValue.indexOf(query) : localeLowerCase(cellValue, locale).indexOf(localeLowerCase(query, locale));

          if (indexOfMatch !== -1) {
            const match = cellValue.slice(indexOfMatch, indexOfMatch + query.length);
            const { rootDocument } = hotInstance;

            empty(TD);
            TD.appendChild(rootDocument.createTextNode(cellValue.slice(0, indexOfMatch)));

            const strong = rootDocument.createElement('strong');

            strong.textContent = match;
            TD.appendChild(strong);
            TD.appendChild(rootDocument.createTextNode(cellValue.slice(indexOfMatch + query.length)));
          }
        }

        if (rootInstanceAriaTagsEnabled) {
          setAttribute(TD, [
            A11Y_OPTION(),
            // Add `setsize` and `posinset` only if the source is an array.
            ...(sourceArray ? [A11Y_SETSIZE(sourceSize ?? 0)] : []),
            ...(sourceArray ? [A11Y_POSINSET(sourceArray.indexOf(value) + 1)] : []),
            ['id', `${this.htEditor.rootElement.id}_${row}-${col}`],
          ]);
        }
      },
      afterSelectionEnd: (startRow: number, startCol: number) => {
        if (rootInstanceAriaTagsEnabled) {
          const setA11yAttributes = (TD: HTMLTableCellElement) => {
            setAttribute(TD, [
              A11Y_SELECTED(),
            ]);

            setAttribute(this.TEXTAREA, ...A11Y_ACTIVEDESCENDANT(TD.id));
          };
          const TD = this.htEditor.getCell(startRow, startCol, true);

          if (TD !== null) {
            setA11yAttributes(TD);

          } else {
            // If TD is null, it means that the cell is not (yet) in the viewport.
            // Moving the logic to after it's been scrolled to the requested cell.
            this.htEditor.addHookOnce('afterScrollVertically', () => {
              const renderedTD = this.htEditor.getCell(startRow, startCol, true);

              if (renderedTD !== null) {
                setA11yAttributes(renderedTD);
              }
            });
          }
        }
      },
    });

    if (rootInstanceAriaTagsEnabled) {
      // Add `role=presentation` to the main table to prevent the readers from treating the option list as a table.
      const a11yPres = A11Y_PRESENTATION();

      setAttribute(this.htEditor.view._wt.wtOverlays.wtTable.TABLE, a11yPres[0], a11yPres[1]);

      setAttribute(this.htEditor.rootElement, [
        A11Y_LISTBOX(),
        A11Y_LIVE('polite'),
        A11Y_RELEVANT('text'),
        ['id', `${this.#idPrefix}-listbox-${rowIndex}-${colIndex}`],
      ]);

      setAttribute(this.TEXTAREA, ...A11Y_EXPANDED('true'));
    }

    this.#deferQuery();
  }

  /**
   * Returns the editor's current value in the form the choice matching works on.
   */
  #editorValue(): unknown {
    return this.stripValueIfNeeded(this.getValue());
  }

  /**
   * Works out which choice the list highlights for a value: the narrowed choice array plus the
   * index within it, or `null` when nothing matches.
   *
   * Extracted so `updateChoicesList()` and `resolveInnerSelectionValue()` cannot answer this question
   * differently. The check is only meaningful while both derive the match identically, and a copy
   * of these rules that drifted would fail silently - by committing a value the user never saw
   * highlighted.
   *
   * @param {Array} choicesList The choices to match against, already stripped.
   * @param {*} value The editor value, already stripped.
   * @returns {{ choices: Array, highlightIndex: number | null }}
   */
  #deriveHighlight(choicesList: ChoiceArray, value: unknown):
    { choices: ChoiceArray, highlightIndex: number | null } {
    const sortByRelevanceSetting = this.cellProperties.sortByRelevance as boolean | undefined;
    const filterSetting = this.cellProperties.filter as boolean | undefined;
    const locale = this.cellProperties.locale as string | undefined;
    const filteringCaseSensitive = this.cellProperties.filteringCaseSensitive as boolean | undefined;
    const comparableValue = this.#isKeyValueObject(value) ?
      (value as Record<string, unknown>).value : value;

    let highlightIndex: number | null = null;
    let choices = choicesList;

    if (!sortByRelevanceSetting) {
      // Sort a copy: `updateChoicesList` is public API, so the caller's array (typically the
      // `source` setting) must keep its original order. The spread also keeps iterable callers (a
      // Set, a NodeList) working, which `Array#toSorted` would not — the floor now allows it, but
      // switching would narrow what this public method accepts.
      choices = [...choices].sort((a, b) => stringify(a).localeCompare(stringify(b)));
    }

    const filteredChoiceIndexes: number[] = [];
    const valueToMatch = filteringCaseSensitive ? comparableValue : localeLowerCase(String(comparableValue), locale);

    for (let i = 0; i < choices.length; i++) {
      const currentItem =
        this.#isKeyValueObject(choices[i]) ?
          stripTags(stringify((choices[i] as Record<string, unknown>).value)) :
          stripTags(stringify(choices[i]));
      const itemToMatch = filteringCaseSensitive ? currentItem : localeLowerCase(currentItem, locale);

      if (itemToMatch.indexOf(String(valueToMatch)) !== -1) {
        filteredChoiceIndexes.push(i);

        if (filterSetting === false) {
          break;
        }
      }
    }

    if (filterSetting === false) {
      if (String(value).length > 0) {
        highlightIndex = filteredChoiceIndexes[0] ?? null;
      }
    } else {
      choices = filteredChoiceIndexes.map(index => choices[index]);
      highlightIndex = choices.indexOf(valueToMatch) > -1 ? choices.indexOf(valueToMatch) : 0;
    }

    return { choices, highlightIndex };
  }

  /**
   * Defers a `queryChoices()` call and keeps its timer id so `close()` can cancel it.
   *
   * `hot._registerTimeout()` has no cancel path of its own - `_clearTimeouts()` runs only from
   * `Core#destroy()` - so without this a query scheduled during an edit still fires after the
   * editor closed, and starts a fresh request against a cell nobody is editing.
   *
   * @param {number} [delay] Delay in milliseconds.
   */
  #deferQuery(delay: number = 0): void {
    const timeoutId = this.hot._registerTimeout(() => {
      this.#queryTimeouts.delete(timeoutId);
      this.queryChoices(this.TEXTAREA.value);
    }, delay);

    this.#queryTimeouts.add(timeoutId);
  }

  /**
   * The value the choice list contributes to the commit, or `undefined` to keep the typed text.
   *
   * A pick the user made with the arrow keys or a click is theirs, and is returned as-is. In strict
   * mode anything else is a match derived from the typed value, and this works that match out
   * afresh rather than trusting the highlight: `highlightBestMatchingChoice()` runs from a query
   * deferred 10 ms behind the keystrokes, so the highlight routinely describes older text than the
   * value being committed - including for the whole time a function `source` has a response
   * outstanding, which no amount of waiting inside a commit can fix.
   *
   * Returning the derived match rather than merely accepting or rejecting the highlight matters
   * under `allowInvalid: false`: for a typed `'Alf'` whose list still shows `'Alpha'`, answering
   * "no" would commit `'Alf'`, which the strict validator then rejects outright. `'Alfa'` is the
   * value strict mode owes the user, and it is already in hand here.
   *
   * Derived from `strippedChoices` - the list actually loaded into the inner grid - NOT from
   * `rawChoices`. `updateChoicesList()` is public API and can be handed an array that never came
   * from `source` (`queryChoices()`'s own empty-source branch does exactly that), and matching
   * against a set the user cannot see would drop the choice they can.
   *
   * @private
   * @returns {*}
   */
  resolveInnerSelectionValue(): unknown {
    if (this.innerSelectionOrigin === 'user') {
      return super.resolveInnerSelectionValue();
    }

    // Non-strict derives no highlight of its own, so with no pick outstanding there is nothing the
    // list can contribute. Checking the origin FIRST is what makes clearing it on `input` mean
    // something here: short-circuiting on `strict` would hand back a pick the typing superseded.
    if (this.cellProperties.strict !== true) {
      return undefined;
    }

    const { choices, highlightIndex } = this.#deriveHighlight(this.strippedChoices, this.#editorValue());

    if (highlightIndex === null || highlightIndex >= choices.length) {
      return undefined;
    }

    const matched = choices[highlightIndex];

    // Unwrapped the way the inner grid presents it - its `valueGetter` reduces a key/value entry to
    // the `value` half, so returning the raw entry would write an object into the cell.
    return this.#isKeyValueObject(matched) ? (matched as Record<string, unknown>).value : matched;
  }

  /**
   * Closes the editor.
   */
  close(): void {
    // The debounced refocus is armed by the inner grid's `afterScroll` and runs 100 ms later. It
    // outlives the close by the same route the choices response used to, and `hideEditableElement()`
    // only sets `opacity: 0`, so its `focus()` puts the caret back into a closed editor. The next
    // scroll of a reopened list re-arms it, so cancelling here loses nothing.
    this.#focusDebounced.cancel();

    // Ends the edit session. Closing is the one event that reliably means "no response is wanted
    // any more": `state` stays `EDITING` when `refreshDimensions()` closes an editor whose cell
    // scrolled out of the rendered range and when `afterSetTheme` closes one (`assignHooks`), and
    // `_opened` stays false after that same cell scrolls back and the editor is shown again.
    //
    // Queries this editor deferred are cancelled outright; the token below is for the ones already
    // handed to user code, which cannot be.
    //
    // Known limitation: `refreshDimensions()` also calls `close()` as "hide for now" when the
    // edited cell scrolls out of the rendered range, and there is no signal here to tell that apart
    // from "the edit ended". So after the cell scrolls back the editor is visible again but its
    // list can no longer populate. That path was already one-way before this change - the
    // `removeHooksByKey` below means typing could not re-query after a scroll round trip either -
    // and separating the two meanings belongs in `TextEditor`, not here.
    this.#queryTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.#queryTimeouts.clear();

    this.#editSession += 1;

    this.removeHooksByKey('beforeKeyDown');
    super.close();

    if (this.hot.getSettings().ariaTags) {
      setAttribute(this.TEXTAREA, [
        A11Y_EXPANDED('false'),
      ]);
    }
  }

  /**
   * Verifies result of validation or closes editor if user's cancelled changes.
   *
   * @param {boolean|undefined} result If `false` and the cell using allowInvalid option,
   *                                   then an editor won't be closed until validation is passed.
   */
  discardEditor(result?: boolean): void {
    super.discardEditor(result);

    this.hot.view.render();
  }

  /**
   * Prepares choices list based on applied argument.
   *
   * Does nothing when the editor is not editing, and ignores a `source` response that arrives after
   * the editor closed or after a newer query started.
   *
   * @param {string} query The query.
   */
  queryChoices(query: string): void {
    // `close()` cancels the queries this editor deferred, so no internal caller reaches here once
    // an edit has ended. This guard is for the public method: `queryChoices()` ships in the type
    // declarations, and calling it while no edit is in progress must not invoke the user's
    // `source`, which is typically a network request.
    //
    // `WAITING` counts as in progress. `close()` is what unhooks `beforeKeyDown`, so keystrokes
    // still schedule queries while an async validator runs, and under `allowInvalid: false` the
    // editor stays open and returns to `EDITING`. Rejecting them would stop the list refreshing for
    // the length of every validation, which is a behavior change rather than a fix.
    //
    // `state` rather than `isOpened()`: `_opened` stays false after `refreshDimensions()` closes an
    // editor whose cell scrolled out of view and then shows it again on the way back, without ever
    // restoring the flag.
    if (this.state !== EDITOR_STATE.EDITING && this.state !== EDITOR_STATE.WAITING) {
      return;
    }

    type SourceValue = unknown[] | ((query: string, callback: (choices: unknown[]) => void) => void);
    const source = this.cellProperties.source as SourceValue | undefined;
    const generation = this.#queryGeneration + 1;
    const editSession = this.#editSession;

    this.#queryGeneration = generation;
    this.query = query;

    if (typeof source === 'function') {
      type SourceFn = (query: string, callback: (choices: unknown[]) => void) => void;

      (source as SourceFn).call(this.cellProperties, query, (choices: unknown[]) => {
        // A user-supplied source answers whenever it likes, and `HandsontableEditor.close()` only
        // hides the nested grid, so a late response can still re-show the dropdown and pull focus
        // back through `hot.listen()`. Two ways a response stops being the one the editor waits
        // for, one token each: the edit ended, or a newer query superseded it. Deliberately no
        // state check - a response landing while an async validator holds the editor in `WAITING`
        // belongs to the still-open editor, and rejecting it would leave the list empty for the
        // rest of the edit when `allowInvalid: false` sends the state back to `EDITING`.
        // `Core#destroy()` reaches neither token - it never closes the active editor - and
        // `updateChoicesList()` would then touch an `htEditor` whose root element is gone. The
        // guide tells people to answer late, and in a single-page app a torn-down grid is the
        // usual way that happens.
        if (this.hot.isDestroyed || editSession !== this.#editSession ||
            generation !== this.#queryGeneration) {
          return;
        }

        this.rawChoices = choices;
        this.updateChoicesList(this.stripValuesIfNeeded(choices));
      });

    } else if (Array.isArray(source)) {
      this.rawChoices = source;
      this.updateChoicesList(this.stripValuesIfNeeded(source));

    } else {
      this.updateChoicesList([]);
    }
  }

  /**
   * Updates list of the possible completions to choose.
   *
   * @param {Array} choicesList The choices list to process.
   */
  updateChoicesList(choicesList: ChoiceArray): void {
    const pos = getCaretPosition(this.TEXTAREA);
    const endPos = getSelectionEndPosition(this.TEXTAREA);
    const { choices, highlightIndex } = this.#deriveHighlight(choicesList, this.#editorValue());

    this.strippedChoices = choices;

    if (choices.length === 0) {
      this.htEditor.rootElement.style.display = 'none';
    } else {
      this.htEditor.rootElement.style.display = '';
    }

    this.htEditor.loadData(pivot([choices]));

    if (choices.length > 0) {
      this.updateDropdownDimensions();
      this.flipDropdownVerticallyIfNeeded();
      this.flipDropdownHorizontallyIfNeeded();

      if (this.cellProperties.strict === true) {
        const matchedIndex = highlightIndex ?? undefined;

        this.highlightBestMatchingChoice(matchedIndex);

        // Only on this branch: in non-strict mode `highlightBestMatchingChoice()` never runs, so a
        // late query must not clear a `'user'` origin the arrow keys set.
        this.innerSelectionOrigin = matchedIndex === undefined ? null : 'auto';
      }
    } else {
      // The list is empty and hidden, so there is nothing left on screen that a pick could refer
      // to. Without this an arrow pick made against an earlier list stays authoritative.
      this.innerSelectionOrigin = null;
    }

    this.hot.listen();

    setCaretPosition(this.TEXTAREA, pos, (pos === endPos ? undefined : endPos));
  }

  /**
   * Calculates the space above and below the editor and flips it vertically if needed.
   *
   * @private
   * @returns {{ isFlipped: boolean, spaceAbove: number, spaceBelow: number}}
   */
  flipDropdownVerticallyIfNeeded(): { isFlipped: boolean, spaceAbove: number, spaceBelow: number } {
    const result = super.flipDropdownVerticallyIfNeeded();
    const {
      isFlipped,
      spaceAbove,
      spaceBelow,
    } = result;

    this.limitDropdownIfNeeded(isFlipped ? spaceAbove : spaceBelow);

    return result;
  }

  /**
   * Checks if the internal table should generate scrollbar or could be rendered without it.
   *
   * @private
   * @param {number} spaceAvailable The free space as height defined in px available for dropdown list.
   */
  limitDropdownIfNeeded(spaceAvailable: number): void {
    const dropdownHeight = this.getDropdownHeight();

    if (dropdownHeight > spaceAvailable) {
      const rowHeight = this.htEditor.stylesHandler.getDefaultRowHeight() ?? 0;

      if (rowHeight === 0) {
        return;
      }

      // Show whole rows only, and stop one row short of the boundary: `Math.ceil(...) - 1` is the
      // exact arithmetic of the do/while this replaced ("add rows until one crosses the free
      // space, then step back a row"), so an exactly-fitting space still leaves its last row out.
      // That margin is deliberately preserved - the list is trimmed because it overflows the
      // workspace, and the rendered rows carry a border the raw row height does not.
      //
      // `Math.max(..., 1)` is the fix: without it the height collapsed to 0 whenever the free
      // space was not taller than a single row, rendering the list as an invisible sliver that hid
      // every choice - the flexbox-squeezed grids reported in #8872. The MultiSelect editor's
      // dropdown clamps to one entry the same way (`dropdownController.updateDimensions()`).
      //
      // A caveat this cannot solve here: the grid's root element gets `overflow: clip` whenever a
      // `height` is set, so when the free space is narrower than the forced row, that row is
      // partly clipped by the grid's bottom edge - fully so when the space reaches 0. Making it
      // readable in those extremes needs the dropdown to escape the clipping root (DEV-1656).
      //
      // No border compensation here, unlike `getTargetDropdownHeight()`'s `getTableHeight() + 1`.
      // Adding it was measured and changes nothing a user sees: the clipping root, not the list's
      // own budget, is what bounds the visible row, so the extra pixel only pushes the holder
      // further past the clip (main 31->32px holder, 28px of option visible either way; classic
      // 28->29 and 25; horizon 37->38 and 37).
      const rowsThatFit = Math.max(Math.ceil(spaceAvailable / rowHeight) - 1, 1);
      const height = rowsThatFit * rowHeight;

      if (this.isFlippedVertically) {
        this.htEditor.rootElement.style.top =
          `${parseInt(this.htEditor.rootElement.style.top, 10) + dropdownHeight - height}px`;
      }

      this.setDropdownHeight(height);
    }
  }

  /**
   * Updates width and height of the internal Handsontable's instance.
   *
   * @private
   */
  updateDropdownDimensions(): void {
    const fractionalScalingCompensation = getFractionalScalingCompensation();
    const targetWidth = this.getTargetEditorWidth() + fractionalScalingCompensation;
    const targetHeight = this.getTargetEditorHeight() + fractionalScalingCompensation;

    this.htEditor.updateSettings({
      width: targetWidth,
      height: targetHeight,
    });

    this.#fixDropdownWidth();
    this.htEditor.view._wt.wtTable.alignOverlaysWithTrimmingContainer();
  }

  /**
   * Sets new height of the internal Handsontable's instance.
   *
   * @private
   * @param {number} height The new dropdown height.
   */
  setDropdownHeight(height: number): void {
    this.htEditor.updateSettings({
      height,
    });

    this.#fixDropdownWidth();
    this.htEditor.view._wt.wtTable.alignOverlaysWithTrimmingContainer();
  }

  /**
   * Creates new selection on specified row index, or deselects selected cells.
   *
   * @private
   * @param {number|undefined} index The visual row index.
   */
  highlightBestMatchingChoice(index: number | undefined): void {
    if (typeof index === 'number') {
      this.htEditor.selectCell(index, 0, undefined, undefined, undefined, false);
    } else {
      this.htEditor.deselectCell();
    }
  }

  /**
   * Calculates the proposed/target editor height that should be set once the editor is opened.
   * The method may be overwritten in the child class to provide a custom size logic.
   *
   * @returns {number}
   */
  getTargetEditorHeight(): number {
    let borderCompensation = 0;

    if (!this.hot.getCurrentThemeName()) {
      const htCoreElement = this.htContainer.querySelector('.htCore');

      if (htCoreElement) {
        const containerStyle = this.hot.rootWindow.getComputedStyle(htCoreElement);

        borderCompensation = parseInt(containerStyle.borderTopWidth, 10) +
          parseInt(containerStyle.borderBottomWidth, 10);
      }
    }

    const maxItems = Math.min(this.cellProperties.visibleRows as number, this.strippedChoices.length);
    const height = Array.from({ length: maxItems }, (_, i) => i)
      .reduce((totalHeight, index) => {
        // for the first row, we need to add 1px (border-top compensation)
        const rowHeight = (this.hot.stylesHandler.getDefaultRowHeight() ?? 0) + (index === 0 ? 1 : 0);

        return totalHeight + rowHeight;
      }, 0);

    return height + borderCompensation;
  }

  /**
   * Calculates the proposed/target editor width that should be set once the editor is opened.
   * The method may be overwritten in the child class to provide a custom size logic.
   *
   * @returns {number}
   */
  getTargetEditorWidth(): number {
    let borderCompensation = 0;

    if (!this.hot.getCurrentThemeName()) {
      const htCoreElement = this.htContainer.querySelector('.htCore');

      if (htCoreElement) {
        const containerStyle = this.hot.rootWindow.getComputedStyle(htCoreElement);

        borderCompensation = parseInt(containerStyle.borderInlineStartWidth, 10) +
          parseInt(containerStyle.borderInlineEndWidth, 10);
      }
    }

    return this.htEditor.getColWidth(0) + borderCompensation;
  }

  /**
   * Sanitizes value from potential dangerous tags.
   *
   * @private
   * @param {string} value The value to sanitize.
   * @returns {string}
   */
  stripValueIfNeeded(value: unknown): unknown {
    return this.stripValuesIfNeeded([value])[0];
  }

  /**
   * Sanitizes an array of the values from potential dangerous tags.
   *
   * @private
   * @param {string[]} values The value to sanitize.
   * @returns {Array<string|{key: string, value: string}>}
   */
  stripValuesIfNeeded(values: unknown[]): unknown[] {
    const { allowHtml } = this.cellProperties;
    const processValue = (value: unknown) => stringify(allowHtml ? value : stripTags(String(value)));

    if (values.every(value => isKeyValueObject(value))) {
      return values.map((value) => {
        const obj = value as Record<string, unknown>;

        return {
          key: processValue(obj.key),
          value: processValue(obj.value),
        };
      });
    }

    return values.map(value => processValue(value));
  }

  /**
   * Runs focus method after debounce.
   */
  #focusDebounced = debounce(() => {
    this.focus();
  }, 100);

  /**
   * Fix width of the internal Handsontable's instance when editor has vertical scroll.
   */
  #fixDropdownWidth() {
    if (this.htEditor.view.hasVerticalScroll()) {
      this.htEditor.updateSettings({
        width: this.getTargetEditorWidth() + getScrollbarWidth(this.hot.rootDocument),
      });
    }
  }

  /**
   * Checks if the value is a key/value object.
   *
   * @param {*} value The value to check.
   * @returns {boolean}
   */
  #isKeyValueObject(value: unknown): boolean {
    const rec = value as Record<string, unknown>;

    return isObject(value) && isDefined(rec.key) && isDefined(rec.value);
  }

  /**
   * OnBeforeKeyDown callback.
   *
   * @private
   * @param {KeyboardEvent} event The keyboard event object.
   */
  onBeforeKeyDown(event: KeyboardEvent): void {
    if (isPrintableChar(event.keyCode) || event.keyCode === KEY_CODES.BACKSPACE ||
      event.keyCode === KEY_CODES.DELETE || event.keyCode === KEY_CODES.INSERT) {
      // for Windows 10 + FF86 there is need to add delay to make sure that the value taken from
      // the textarea is the freshest value. Otherwise the list of choices does not update correctly (see #7570).
      // On the more modern version of the FF (~ >=91) it seems that the issue is not present or it is
      // more difficult to induce.
      let timeOffset = 10;

      // on ctl+c / cmd+c don't update suggestion list
      if (event.keyCode === KEY_CODES.C && (event.ctrlKey || event.metaKey)) {
        return;
      }
      if (!this.isOpened()) {
        timeOffset += 10;
      }

      this.#deferQuery(timeOffset);
    }
  }
}
