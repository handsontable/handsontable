/* eslint-disable no-console */ // console is supported way of Netlify logging
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import type { Context, Config } from '@netlify/edge-functions';

declare let Netlify: {
  env: {
    get: (key: string) => string;
    context: string;
  }
};

interface RedirectRaw {
  from: string,
  to: string
}

interface Redirect {
  from: RegExp;
  to: string;
}

/**
 * Adds base URL to relative paths in the `to` property of redirect objects.
 *
 * @param {Redirect[]} redirects - Array of redirect objects.
 * @param {string} baseUrl - The base URL to prepend to the `to` field if it's a relative path.
 * @returns {Redirect[]} - Array of redirect objects with the base URL added to relative paths.
 */
const addBaseUrlToRelativePaths = (redirects: Redirect[], baseUrl: string): Redirect[] =>
  redirects.map(redirect => (redirect.to.startsWith('/')
    ? { ...redirect, to: `${baseUrl}${redirect.to}` }
    : redirect)
  );

/**
 * Generates a regular expression string that matches versioned documentation URLs.
 *
 * @param {string} docsLatestVersion - The latest version of the documentation.
 * @returns {string} - The regular expression string for matching versioned URLs.
 */
function getVersionRegexString(docsLatestVersion: string) {
  // replace each '\' with '\\'
  const escapedVersion = docsLatestVersion.replace(/[\\.]/g, '\\$&');
  const basePattern = '^\\/docs\\/';
  const versionPattern = `(?!${escapedVersion})`;
  const remainingPattern = '(\\d+\\.\\d+(?:\\.\\d+)?)(\\/.*)?$';

  return `${basePattern}${versionPattern}${remainingPattern}`;
}
/**
 * Prepares an array of redirect objects by replacing the `$framework` placeholder in the `to` field with the specified framework.
 *
 * @param {string} framework - The framework to replace in the `to` field (e.g., `react-data-grid`, `javascript-data-grid`).
 * @returns {Redirect[]} - Array of redirect objects with the `$framework` placeholder replaced.
 */
function prepareRedirects(framework: string): Redirect[] {
  return getLocalRedirects().map(redirect => ({
    from: new RegExp(redirect.from),
    to: redirect.to.replace('$framework', framework),
  }));
}

/**
 * Handles 404 responses by returning the URL of the 404 page.
 *
 * @param {string} url - The current URL that caused the 404 error.
 * @returns {Promise<URL>} - A promise that resolves to the URL of the 404 page.
 */
async function handle404(url: string): Promise<URL> {
  return new URL('/docs/404.html', url);
}

/**
 * Checks if a status code is a redirection (i.e., 3xx status codes).
 *
 * @param {number} status - The HTTP status code to check.
 * @returns {boolean} - True if the status code indicates redirection, otherwise false.
 */
function redirectionWasFound(status: number): boolean {
  return status >= 300 && status < 400;
}

/**
 * The main handler for Netlify edge functions. Processes requests and handles redirects and rewrites based on the URL.
 *
 * @param {Request} request - The incoming request object.
 * @param {Context} context - The context object provided by Netlify edge functions.
 * @returns {Promise<Response | URL | void>} - A promise that resolves to the appropriate response or rewrite URL.
 */
export default async function handler(request: Request, context: Context): Promise<Response | URL | void> {
  try {
    const currentUrl = new URL(request.url);
    const baseUrl = currentUrl.origin;

    // Serve the 404 page without further rewrites to avoid rewrite loop
    if (currentUrl.pathname === '/docs/404.html') {
      return context.next();
    }

    // if 404 was requested - always rewrite
    if (request.method !== 'GET') {
      return;
    }

    // handling cookie to set the framework value
    const cookieValue = context.cookies.get('docs_fw');
    const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

    // External redirect handling
    const external = getExternalRedirects();
    const externalMatchFound = external.find(entry => entry.from.test(currentUrl.pathname));

    if (externalMatchFound) {
      const url = currentUrl.pathname.replace(externalMatchFound.from, externalMatchFound.to);

      console.warn('handleExternalMatch');

      return Response.redirect(url, 301);
    }

    // External rewrite handling (OVH)
    const externalRewrites = getExternalRewrites();
    const externalRewritesFound = externalRewrites.find(entry => entry.from.test(currentUrl.pathname));

    if (externalRewritesFound) {
      const url = currentUrl.pathname.replace(externalRewritesFound.from, externalRewritesFound.to);

      try {
        const response = await fetch(url, { redirect: 'manual' });

        if (response.ok) {
          return response;
        }

        if (redirectionWasFound(response.status)) {
          console.warn('Redirection was found', url, response.status, response.headers.get('location'));
          const location = response.headers.get('location');
          if(location) {
            return Response.redirect(location, 301)
          }
          console.error('Redirection without location', url, response.status, response.statusText);
          return handle404( baseUrl);
        }

        console.error('Response not ok ', url, response.status, response.statusText);
        return handle404(baseUrl);
      } catch (e) {
        console.error('External Rewrite: Server error', url, e);
        return handle404(baseUrl);
      }
    }

    // Local redirection handling
    const localRedirects = addBaseUrlToRelativePaths(prepareRedirects(framework), baseUrl);
    const matchFound = localRedirects.find(redirect => redirect.from.test(currentUrl.pathname));

    if (matchFound) {
      const newUrl = currentUrl.pathname.replace(matchFound.from, matchFound.to);

      return Response.redirect(newUrl, 301);
    }

    // Static file handling
    try {
      const response = await context.next();

      if (response.ok) {
        return response;
      } else if (redirectionWasFound(response.status)) {
        console.warn('Redirection was found', response.status, response.statusText);
      }

      console.error('File was not found', request.url, response.status, response.statusText);

      return handle404(baseUrl);
    } catch (e) {
      console.error('External Rewrite: Server error', request.url, e);

      return handle404(baseUrl);
    }
  } catch (e) {
    console.error('Uncaught server error', e);
  }
}

/**
 * Netlify Edge function configuration.
 *
 * @type {Config}
 */
export const config: Config = {
  path: ['/*'],
};

/** .........
 * Retrieves OVH semver redirects with x.x.x format.
 *
 * @returns {Redirect[]} - Array of external rewrite rules.
 */
function getOvhSemverRedirects(): RedirectRaw[] {
  return [
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/AutoColumnSize.html$',
      to: '/docs/javascript-data-grid/api/auto-column-size/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/Autofill.html$',
      to: '/docs/javascript-data-grid/api/autofill/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/AutoRowSize.html$',
      to: '/docs/javascript-data-grid/api/auto-row-size/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/BaseEditor_BaseEditor.html$',
      to: '/docs/javascript-data-grid/cell-editor/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/BaseEditor.html$',
      to: '/docs/javascript-data-grid/cell-editor/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/BasePlugin.html$',
      to: '/docs/javascript-data-grid/api/base-plugin/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/BindRowsWithHeaders.html$',
      to: '/docs/javascript-data-grid/api/bind-rows-with-headers/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/CellCoords.html$',
      to: '/docs/javascript-data-grid/api/cell-coords/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/CellRange.html$',
      to: '/docs/javascript-data-grid/api/cell-range/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/CollapsibleColumns.html$',
      to: '/docs/javascript-data-grid/api/collapsible-columns/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ColumnSorting.html$',
      to: '/docs/javascript-data-grid/api/column-sorting/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ColumnSummary.html$',
      to: '/docs/javascript-data-grid/api/column-summary/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/Comments.html$',
      to: '/docs/javascript-data-grid/api/api/comments/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ContextMenu.html$',
      to: '/docs/javascript-data-grid/api/context-menu/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/CopyPaste.html$',
      to: '/docs/javascript-data-grid/api/copy-paste/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/Core.html$',
      to: '/docs/javascript-data-grid/api/core/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/CustomBorders.html$',
      to: '/docs/javascript-data-grid/api/custom-borders/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/DragToScroll.html$',
      to: '/docs/javascript-data-grid/api/drag-to-scroll/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/DropdownMenu.html$',
      to: '/docs/javascript-data-grid/api/dropdown-menu/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ExportFile.html$',
      to: '/docs/javascript-data-grid/api/export-file/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/Filters.html$',
      to: '/docs/javascript-data-grid/api/filters/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/Formulas.html$',
      to: '/docs/javascript-data-grid/api/formulas/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/GhostTable.html$',
      to: '/docs/javascript-data-grid/api/ghost-table/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/HiddenColumns.html$',
      to: '/docs/javascript-data-grid/api/hidden-columns/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/HiddenRows.html$',
      to: '/docs/javascript-data-grid/api/hidden-rows/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/Hooks.html$',
      to: '/docs/javascript-data-grid/api/hooks/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ManualColumnFreeze.html$',
      to: '/docs/javascript-data-grid/api/manual-column-freeze/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ManualColumnMove.html$',
      to: '/docs/javascript-data-grid/api/manual-column-move/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ManualColumnResize.html$',
      to: '/docs/javascript-data-grid/api/manual-column-resize/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ManualRowMove.html$',
      to: '/docs/javascript-data-grid/api/manual-row-move/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/ManualRowResize.html$',
      to: '/docs/javascript-data-grid/api/manual-row-resize/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/MergeCells.html$',
      to: '/docs/javascript-data-grid/api/merge-cells/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/MultiColumnSorting.html$',
      to: '/docs/javascript-data-grid/api/multi-column-sorting/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/NestedHeaders.html$',
      to: '/docs/javascript-data-grid/api/nested-headers/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/NestedRows.html$',
      to: '/docs/javascript-data-grid/api/nested-rows/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/Options.html$',
      to: '/docs/javascript-data-grid/api/options/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/PersistentState.html$',
      to: '/docs/javascript-data-grid/api/persistent-state/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/Search.html$',
      to: '/docs/javascript-data-grid/api/search/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/TrimRows.html$',
      to: '/docs/javascript-data-grid/trim-rows/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/UndoRedo.html$',
      to: '/docs/javascript-data-grid/api/undo-redo/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-alignment.html$',
      to: '/docs/javascript-data-grid/text-alignment/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-auto-fill.html$',
      to: '/docs/javascript-data-grid/autofill-values/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-autocomplete.html$',
      to: '/docs/javascript-data-grid/autocomplete-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-bind-rows-headers.html$',
      to: '/docs/javascript-data-grid/binding-to-data/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-checkbox.html$',
      to: '/docs/javascript-data-grid/checkbox-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-collapsing-columns.html$',
      to: '/docs/javascript-data-grid/column-groups/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-comments_.html$',
      to: '/docs/javascript-data-grid/comments/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-conditional-formatting.html$',
      to: '/docs/javascript-data-grid/conditional-formatting/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-context-menu.html$',
      to: '/docs/javascript-data-grid/context-menu/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-copy-paste.html$',
      to: '/docs/javascript-data-grid/basic-clipboard/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-custom-renderers.html$',
      to: '/docs/javascript-data-grid/cell-renderer/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-customizing-borders.html$',
      to: '/docs/javascript-data-grid/formatting-cells/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-data-validation.html$',
      to: '/docs/javascript-data-grid/cell-validator/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-date.html$',
      to: '/docs/javascript-data-grid/date-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-disabled-editing.html$',
      to: '/docs/javascript-data-grid/disabled-cells/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-dropdown-menu.html$',
      to: '/docs/javascript-data-grid/column-menu/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-dropdown.html$',
      to: '/docs/javascript-data-grid/dropdown-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-export-file.html$',
      to: '/docs/javascript-data-grid/export-to-csv/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-filtering.html$',
      to: '/docs/javascript-data-grid/column-filter/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-fixing-bottom.html$',
      to: '/docs/javascript-data-grid/row-freezing/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-fixing.html$',
      to: '/docs/javascript-data-grid/column-freezing/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-formula-support.html$',
      to: '/docs/javascript-data-grid/formula-calculation/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-freezing.html$',
      to: '/docs/javascript-data-grid/column-freezing'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-handsontable.html$',
      to: '/docs/javascript-data-grid/handsontable-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-hiding-columns.html$',
      to: '/docs/javascript-data-grid/column-hiding/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-hiding-rows.html$',
      to: '/docs/javascript-data-grid/row-hiding/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-highlighting-selection.html$',
      to: '/docs/javascript-data-grid/selection/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-merged-cells.html$',
      to: '/docs/javascript-data-grid/merge-cells/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-moving.html$',
      to: '/docs/javascript-data-grid/column-moving/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-multicolumn-sorting.html$',
      to: '/docs/javascript-data-grid/rows-sorting/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-nested-headers.html$',
      to: '/docs/javascript-data-grid/column-groups/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-nested-rows.html$',
      to: '/docs/javascript-data-grid/row-parent-child/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-numeric.html$',
      to: '/docs/javascript-data-grid/numeric-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-password.html$',
      to: '/docs/javascript-data-grid/password-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-pre-populating.html$',
      to: '/docs/javascript-data-grid/row-prepopulating/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-read-only.html$',
      to: '/docs/javascript-data-grid/disabled-cells/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-resizing.html$',
      to: '/docs/javascript-data-grid/column-width/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-searching.html$',
      to: '/docs/javascript-data-grid/searching-values/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-select.html$',
      to: '/docs/javascript-data-grid/select-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-selecting-ranges.html$',
      to: '/docs/javascript-data-grid/selection/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-sorting.html$',
      to: '/docs/javascript-data-grid/rows-sorting/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-spreadsheet-icons.html$',
      to: '/docs/javascript-data-grid/icon-pack/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-stretching.html$',
      to: '/docs/javascript-data-grid/column-width/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-summary-calculations.html$',
      to: '/docs/javascript-data-grid/column-summary/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-time.html$',
      to: '/docs/javascript-data-grid/time-cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/demo-trimming-rows.html$',
      to: '/docs/javascript-data-grid/row-trimming/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-custom-context-menu-example.html$',
      to: '/docs/javascript-data-grid/angular-installation/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-custom-editor-example.html$',
      to: '/docs/javascript-data-grid/angular-custom-editor-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-custom-id.html$',
      to: '/docs/javascript-data-grid/angular-custom-id/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-custom-renderer-example.html$',
      to: '/docs/javascript-data-grid/angular-custom-renderer-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-hot-reference.html$',
      to: '/docs/javascript-data-grid/angular-hot-reference/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-installation.html$',
      to: '/docs/javascript-data-grid/angular-installation/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-language-change-example.html$',
      to: '/docs/javascript-data-grid/angular-language-change-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-setting-up-a-locale.html$',
      to: '/docs/javascript-data-grid/angular-language-change-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-angular-simple-example.html$',
      to: '/docs/javascript-data-grid/angular-basic-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-custom-context-menu-example.html$',
      to: '/docs/react-data-grid/context-menu/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-custom-editor-example.html$',
      to: '/docs/react-data-grid/cell-editor/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-custom-renderer-example.html$',
      to: '/docs/react-data-grid/cell-renderer/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-hot-column.html$',
      to: '/docs/react-data-grid/hot-column/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-hot-reference.html$',
      to: '/docs/react-data-grid/instance-methods/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-installation.html$',
      to: '/docs/react-data-grid/installation/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-language-change-example.html$',
      to: '/docs/react-data-grid/language/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-redux-example.html$',
      to: '/docs/react-data-grid/redux/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-setting-up-a-locale.html$',
      to: '/docs/react-data-grid/locale/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-react-simple-examples.html$',
      to: '/docs/react-data-grid/binding-to-data/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-custom-context-menu-example.html$',
      to: '/docs/javascript-data-grid/vue-custom-context-menu-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-custom-editor-example.html$',
      to: '/docs/javascript-data-grid/vue-custom-editor-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-custom-id-class-style.html$',
      to: '/docs/javascript-data-grid/vue-custom-id-class-style/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-custom-renderer-example.html$',
      to: '/docs/javascript-data-grid/vue-custom-renderer-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-hot-column.html$',
      to: '/docs/javascript-data-grid/vue-hot-column/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-hot-reference.html$',
      to: '/docs/javascript-data-grid/vue-hot-reference/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-installation.html$',
      to: '/docs/javascript-data-grid/vue-installation/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-language-change-example.html$',
      to: '/docs/javascript-data-grid/vue-language-change-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-setting-up-a-locale.html$',
      to: '/docs/javascript-data-grid/vue-setting-up-a-translation/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-simple-example.html$',
      to: '/docs/javascript-data-grid/vue-basic-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/frameworks-wrapper-for-vue-vuex-example.html$',
      to: '/docs/javascript-data-grid/vue-vuex-example/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-cell-editor.html$',
      to: '/docs/javascript-data-grid/cell-editor/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-cell-function.html$',
      to: '/docs/javascript-data-grid/cell-function/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-cell-types.html$',
      to: '/docs/javascript-data-grid/cell-type/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-change-log.html$',
      to: '/docs/javascript-data-grid/release-notes/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-compatibility.html$',
      to: '/docs/javascript-data-grid/supported-browsers/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-custom-build.html$',
      to: '/docs/javascript-data-grid/custom-builds/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-custom-plugin.html$',
      to: '/docs/javascript-data-grid/custom-plugins/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-data-binding.html$',
      to: '/docs/javascript-data-grid/binding-to-data/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-data-sources.html$',
      to: '/docs/javascript-data-grid/binding-to-data/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-data-validation-demos.html$',
      to: '/docs/javascript-data-grid/cell-validator/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-formula-support-demos.html$',
      to: '/docs/javascript-data-grid/formula-calculation/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-grid-sizing.html$',
      to: '/docs/javascript-data-grid/grid-size/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-index_.html$',
      to: '/docs/javascript-data-grid/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-internationalization.html$',
      to: '/docs/javascript-data-grid/language/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-introduction.html$',
      to: '/docs/javascript-data-grid/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-jquery.html$',
      to: '/docs/javascript-data-grid/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-keyboard-navigation.html$',
      to: '/docs/javascript-data-grid/keyboard-shortcuts/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-license-key.html$',
      to: '/docs/javascript-data-grid/license-key/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-licensing.html$',
      to: '/docs/javascript-data-grid/software-license/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-load-and-save.html$',
      to: '/docs/javascript-data-grid/saving-data/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-migration-guide.html$',
      to: '/docs/javascript-data-grid/release-notes/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-milestones.html$',
      to: '/docs/javascript-data-grid/release-notes/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-modules.html$',
      to: '/docs/javascript-data-grid/modules/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-navigation-demos.html$',
      to: '/docs/javascript-data-grid/keyboard-shortcuts/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-performance-tips.html$',
      to: '/docs/javascript-data-grid/performance/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-quick-start.html$',
      to: '/docs/javascript-data-grid/installation/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-release-notes.html$',
      to: '/docs/javascript-data-grid/release-notes/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-releasing.html$',
      to: '/docs/javascript-data-grid/versioning-policy/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-setting-options.html$',
      to: '/docs/javascript-data-grid/configuration-options/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-sorting-data-demos.html$',
      to: '/docs/javascript-data-grid/rows-sorting/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-suspend-rendering.html$',
      to: '/docs/javascript-data-grid/batch-operations/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-testing.html$',
      to: '/docs/javascript-data-grid/testing/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-using-callbacks.html$',
      to: '/docs/javascript-data-grid/events-and-hooks/'
    },
    {
      from: '^/docs/(\\d+.\\d+.\\d+)/tutorial-wrapper-for-react-examples.html$',
      to: '/docs/react-data-grid/binding-to-data/'
    }
  ];
}

/** .........
 * Retrieves different number of versions permanent redirects.
 *
 * @returns {Redirect[]} - Array of external rewrite rules.
 */
function getOvhVersionRedirects(): RedirectRaw[] {
  return [
    // --- redirect /x.x/ to /x.x.x/ (rewrites short semvers to long one only for 8.4.x and lower. Then this is consumed by old docs stack) ---
    {
      from: '^/docs/((?:[0-7]\\.\\d+)|(?:8\\.[0-4]))(?:/(.+)?)?$',
      to: '/docs/$1.0$2', // Adds ".0" to short semvers for 8.4.x and lower
    },

    // --- redirect /x/ to /x.x.x/ (rewrites short semvers to long one only for 8.x and lower. Then this is consumed by old docs stack) ---
    {
      from: '^/docs/([0-8])(?:/(.+)?)?$',
      to: '/docs/$1.0.0$2', // Adds ".0.0" to short semvers for 8.x and lower
    },

    // --- redirect /x.x.x/ to /x.x/ only for the new docs engine (/docs/9.4.6/ to /docs/9.4/) ---
    {
      from: '^/docs/((9|\\d{2,5})\\.\\d+\\.\\d+)(?:/(.+)?)?$',
      to: '/docs/$1$3', // Removes the third ".x" from semver for 9.x or larger
    },

    // --- redirect /x.x.x/ to /x.x.x/tutorial-introduction.html ---
    {
      from: '^/docs/(\\d+\\.\\d+\\.\\d+)(?:/)?$',
      to: '/docs/$1/tutorial-introduction.html', // Adds "tutorial-introduction.html" for semver
    },

    // --- entry for legacy docs (to version 8.4.x and lower use old documentation stack) ---
    {
      from: '^/docs/((?:[0-7]\\.\\d+\\.\\d+)|(?:8\\.\\d+\\.\\d+))(?:/(.+))?$',
      to: '/home/httpd/docs.handsontable.com/$1/current/generated/$2', // Legacy doc handling
      // break: true, // Stops further processing of rules after this one
    }
  ];
}

/**
 * Retrieves the external rewrites for OVH.
 *
 * @returns {Redirect[]} - Array of external rewrite rules.
 */
function getExternalRewrites(): Redirect[] {
  return [
    {
      from: new RegExp(getVersionRegexString(Netlify.env.get('DOCS_LATEST_VERSION'))),
      to: 'https://_docs.handsontable.com/docs/$1$2',
    }
  ];
}

/**
 * Retrieves external redirect rules for Hyperformula documentation.
 *
 * @returns {Redirect[]} - Array of external redirect rules.
 */
function getExternalRedirects(): Redirect[] {
  return [
    {
      from: new RegExp('^/docs/hyperformula$'),
      to: 'https://hyperformula.handsontable.com',
    },
    {
      from: new RegExp('^/docs/hyperformula/(.*)$'),
      to: 'https://hyperformula.handsontable.com/$1$2',
    },
  ];
}

/**
 * Retrieves local redirect rules for the documentation site.
 *
 * @returns {RedirectRaw[]} - Array of local redirect rules.
 */
function getLocalRedirects():RedirectRaw[] {
  return [
    {
      from: '^/docs/?$',
      to: '/docs/$framework/',
    },
    {
      from: '^/docs/(\\d+\\.\\d+|next)/?$',
      to: '/docs/$1/$framework/',
    },
    {
      from: '^/docs/i18n/missing-language-code',
      to: '/docs/$framework/language/#loading-the-prepared-language-files',
    },
    {
      from: '^/docs/react$',
      to: '/docs/react-data-grid/installation/',
    },
    {
      from: '^/docs/angular$',
      to: '/docs/javascript-data-grid/angular-installation/',
    },
    {
      from: '^/docs/vue$',
      to: '/docs/javascript-data-grid/vue-installation/',
    },
    {
      from: '^/docs/vue3$',
      to: '/docs/javascript-data-grid/vue3-installation/',
    },
    {
      from: '^/docs/frameworks-wrapper-for-((?:angular|vue).*)$',
      to: '/docs/javascript-data-grid/$1/',
    },
    {
      from: '^/docs/(\\d+\\.\\d+|next)/frameworks-wrapper-for-((?:angular|vue).*)$',
      to: '/docs/$1/javascript-data-grid/$2/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-installation/?$',
      to: '/docs/$1react-data-grid/installation/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-simple-examples?/?$',
      to: '/docs/$1react-data-grid/binding-to-data/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-modules/?$',
      to: '/docs/$1react-data-grid/modules/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-hot-column/?$',
      to: '/docs/$1react-data-grid/hot-column/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-setting-up-a-language/?$',
      to: '/docs/$1react-data-grid/language/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-setting-up-a-locale/?$',
      to: '/docs/$1react-data-grid/numeric-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-custom-context-menu-example/?$',
      to: '/docs/$1react-data-grid/context-menu/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-custom-editor-example/?$',
      to: '/docs/$1react-data-grid/cell-editor/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-custom-renderer-example/?$',
      to: '/docs/$1react-data-grid/cell-renderer/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-language-change-example/?$',
      to: '/docs/$1react-data-grid/language/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-redux-example/?$',
      to: '/docs/$1react-data-grid/redux/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?react-hot-reference/?$',
      to: '/docs/$1react-data-grid/methods/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-installation/?$',
      to: '/docs/$1react-data-grid/installation/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-simple-examples/?$',
      to: '/docs/$1react-data-grid/binding-to-data/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-hot-column/?$',
      to: '/docs/$1react-data-grid/hot-column/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-setting-up-a-locale/?$',
      to: '/docs/$1react-data-grid/numeric-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-custom-context-menu-example/?$',
      to: '/docs/$1react-data-grid/context-menu/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-custom-editor-example/?$',
      to: '/docs/$1react-data-grid/cell-editor/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-custom-renderer-example/?$',
      to: '/docs/$1react-data-grid/cell-renderer/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-language-change-example/?$',
      to: '/docs/$1react-data-grid/language/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-redux-example/?$',
      to: '/docs/$1react-data-grid/redux/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-hot-reference/?$',
      to: '/docs/$1react-data-grid/methods/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-introduction/?$',
      to: '/docs/$1$framework/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-compatibility/?$',
      to: '/docs/$1$framework/supported-browsers/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-licensing/?$',
      to: '/docs/$1$framework/software-license/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-license-key/?$',
      to: '/docs/$1$framework/license-key/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-quick-start/?$',
      to: '/docs/$1$framework/installation/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-data-binding/?$',
      to: '/docs/$1$framework/binding-to-data/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-data-sources/?$',
      to: '/docs/$1$framework/binding-to-data/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-load-and-save/?$',
      to: '/docs/$1$framework/saving-data/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-setting-options/?$',
      to: '/docs/$1$framework/setting-options/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-grid-sizing/?$',
      to: '/docs/$1$framework/grid-size/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-using-callbacks/?$',
      to: '/docs/$1$framework/events-and-hooks/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-keyboard-navigation/?$',
      to: '/docs/$1$framework/keyboard-navigation/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-internationalization/?$',
      to: '/docs/$1$framework/internationalization-i18n/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-modules/?$',
      to: '/docs/$1$framework/modules/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-custom-build/?$',
      to: '/docs/$1$framework/building/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-custom-plugin/?$',
      to: '/docs/$1$framework/plugins/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-cell-types/?$',
      to: '/docs/$1$framework/cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-cell-editor/?$',
      to: '/docs/$1$framework/cell-editor/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-cell-function/?$',
      to: '/docs/$1$framework/cell-function/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-suspend-rendering/?$',
      to: '/docs/$1$framework/batch-operations/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-testing/?$',
      to: '/docs/$1$framework/testing/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-performance-tips/?$',
      to: '/docs/$1$framework/performance/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-release-notes/?$',
      to: '/docs/$1$framework/changelog/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-changelog/?$',
      to: '/docs/$1$framework/changelog/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-migration-guide/?$',
      to: '/docs/$1$framework/migration-from-7.4-to-8.0/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?tutorial-known-limitations/?$',
      to: '/docs/$1$framework/third-party-licenses/',
    },
    {
      from: '^/docs/internationalization-i18n/?$',
      to: '/docs/$framework/language/',
    },
    {
      from: '^/docs/keyboard-navigation/?$',
      to: '/docs/$framework/keyboard-shortcuts/',
    },
    {
      from: '^/docs/hello-world/?$',
      to: '/docs/$framework/demo/',
    },
    {
      from: '^/docs/building/?$',
      to: '/docs/$framework/custom-builds/',
    },
    {
      from: '^/docs/plugins/?$',
      to: '/docs/$framework/custom-plugins/',
    },
    {
      from: '^/docs/file-structure/?$',
      to: '/docs/$framework/folder-structure/',
    },
    {
      from: '^/docs/examples/?$',
      to: '/docs/$framework/',
    },
    {
      from: '^/docs/setting-options/?$',
      to: '/docs/$framework/configuration-options/',
    },
    {
      from: '^/docs/angular-simple-example/?$',
      to: '/docs/javascript-data-grid/angular-basic-example/',
    },
    {
      from: '^/docs/angular-setting-up-a-language/?$',
      to: '/docs/javascript-data-grid/angular-setting-up-a-translation/',
    },
    {
      from: '^/docs/vue-simple-example/?$',
      to: '/docs/javascript-data-grid/vue-basic-example/',
    },
    {
      from: '^/docs/vue-setting-up-a-language/?$',
      to: '/docs/javascript-data-grid/vue-setting-up-a-translation/',
    },
    {
      from: '^/docs/vue3-simple-example/?$',
      to: '/docs/javascript-data-grid/vue3-basic-example/',
    },
    {
      from: '^/docs/vue3-setting-up-a-language/?$',
      to: '/docs/javascript-data-grid/vue3-setting-up-a-translation/',
    },
    {
      from: '^/docs/row-sorting/?$',
      to: '/docs/$framework/rows-sorting/',
    },
    {
      from: '^/docs/column-sorting/?$',
      to: '/docs/$framework/rows-sorting/',
    },
    {
      from: '^/docs/(javascript|react)-data-grid/row-sorting/?$',
      to: '/docs/$framework/rows-sorting/',
    },
    {
      from: '^/docs/(javascript|react)-data-grid/column-sorting/?$',
      to: '/docs/$framework/rows-sorting/',
    },
    {
      from: '^/docs/(javascript|react)-data-grid/release-notes/?$',
      to: '/docs/$framework/changelog/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-scrolling/?$',
      to: '/docs/$1$framework/row-virtualization/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-fixing/?$',
      to: '/docs/$1$framework/column-freezing/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-resizing/?$',
      to: '/docs/$1$framework/column-width/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-moving/?$',
      to: '/docs/$1$framework/column-moving/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-pre-populating/?$',
      to: '/docs/$1$framework/row-prepopulating/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-stretching/?$',
      to: '/docs/$1$framework/column-width/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-freezing/?$',
      to: '/docs/$1$framework/column-freezing/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-fixing-bottom/?$',
      to: '/docs/$1$framework/row-freezing/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-hiding-rows/?$',
      to: '/docs/$1$framework/row-hiding/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-hiding-columns/?$',
      to: '/docs/$1$framework/column-hiding/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-trimming-rows/?$',
      to: '/docs/$1$framework/row-trimming/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-bind-rows-headers/?$',
      to: '/docs/$1$framework/row-header/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-collapsing-columns/?$',
      to: '/docs/$1$framework/column-groups/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-nested-headers/?$',
      to: '/docs/$1$framework/column-groups/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-nested-rows/?$',
      to: '/docs/$1$framework/row-parent-child/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-dropdown-menu/?$',
      to: '/docs/$1$framework/column-menu/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-sorting/?$',
      to: '/docs/$1$framework/rows-sorting/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-multicolumn-sorting/?$',
      to: '/docs/$1$framework/rows-sorting/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-searching/?$',
      to: '/docs/$1$framework/searching-values/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-filtering/?$',
      to: '/docs/$1$framework/column-filter/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-summary-calculations/?$',
      to: '/docs/$1$framework/column-summary/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-data-validation/?$',
      to: '/docs/$1$framework/cell-validator/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-auto-fill/?$',
      to: '/docs/$1$framework/autofill-values/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-merged-cells/?$',
      to: '/docs/$1$framework/merge-cells/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-alignment/?$',
      to: '/docs/$1$framework/text-alignment/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-read-only/?$',
      to: '/docs/$1$framework/disabled-cells/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-disabled-editing/?$',
      to: '/docs/$1$framework/disabled-cells/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-custom-renderers/?$',
      to: '/docs/$1$framework/cell-renderer/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-numeric/?$',
      to: '/docs/$1$framework/numeric-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-date/?$',
      to: '/docs/$1$framework/date-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-time/?$',
      to: '/docs/$1$framework/time-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-checkbox/?$',
      to: '/docs/$1$framework/checkbox-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-select/?$',
      to: '/docs/$1$framework/select-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-dropdown/?$',
      to: '/docs/$1$framework/dropdown-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-autocomplete/?$',
      to: '/docs/$1$framework/autocomplete-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-password/?$',
      to: '/docs/$1$framework/password-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-handsontable/?$',
      to: '/docs/$1$framework/handsontable-cell-type/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-context-menu/?$',
      to: '/docs/$1$framework/context-menu/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-spreadsheet-icons/?$',
      to: '/docs/$1$framework/icon-pack/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-comments_/?$',
      to: '/docs/$1$framework/comments/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-copy-paste/?$',
      to: '/docs/$1$framework/basic-clipboard/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-export-file/?$',
      to: '/docs/$1$framework/export-to-csv/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-conditional-formatting/?$',
      to: '/docs/$1$framework/conditional-formatting/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-customizing-borders/?$',
      to: '/docs/$1$framework/formatting-cells/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-custom-borders/?$',
      to: '/docs/$1$framework/formatting-cells/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-selecting-ranges/?$',
      to: '/docs/$1$framework/selection/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-formula-support/?$',
      to: '/docs/$1$framework/formula-calculation/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-using-callbacks/?$',
      to: '/docs/$1$framework/events-and-hooks/',
    },
    {
      from: '^/docs/((\\d+\\.\\d+|next)/)?demo-react-simple-examples/?$',
      to: '/docs/$1$framework/react-simple-example/',
    },
    {
      // eslint-disable-next-line max-len
      from: '^/docs/((?:\\d+\\.\\d+|next)/)(?!(?:javascript|react)-data-grid|redirect|assets/|data/|handsontable|@handsontable/|img/|scripts/|404\\.html|sitemap\\.xml|securitum-certificate\\.pdf|seqred-certificate\\.pdf|testarmy-certificate\\.pdf|testarmy-certificate-2024\\.pdf)(.+)$',
      to: '/docs/$1$framework/$2',
    },
    {
      // eslint-disable-next-line max-len
      from: '^/docs/(?!\\d+\\.\\d+|next\\/)(?!(?:javascript|react)-data-grid|redirect|assets/|data/|handsontable/|@handsontable/|img/|scripts/|404\\.html|sitemap\\.xml|securitum-certificate\\.pdf|seqred-certificate\\.pdf|testarmy-certificate\\.pdf|testarmy-certificate-2024\\.pdf)(.+)$',
      to: '/docs/$framework/$1',
    }
  ];
}
