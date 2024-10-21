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
 * Fetches the 404 page for a specific version.
 *
 * @param {string} baseUrl BaseUrl.
 * @param {string} version HOT docs version.
 * @returns {Promise<Response>} Response.
 */
async function handle404(baseUrl: string, version: string) {
  const versioned404Url = new URL(`/docs/${version}/404.html`, baseUrl);

  return fetch(versioned404Url.href);
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
 * Proxies requests to the OVH docs server.
 *
 * @param {Request} request The original Request object.
 * @param {string} pathname The current request path.
 * @param {string} version HOT docs version.
 * @param {string} baseUrl BaseUrl.
 * @returns {Promise<Response>} A proxied Response object.
 */
async function proxyRequestToOvh(request: Request,
                                 pathname: string,
                                 version:string,
                                 baseUrl:string): Promise<Response> {
  const targetUrl = `https://_docs.handsontable.com${pathname}`;
  const proxiedResponse = await fetch(targetUrl, { redirect: 'manual' });

  if (proxiedResponse.status >= 300 && proxiedResponse.status < 400) {
    const locationHeader = proxiedResponse.headers.get('location');

    if (locationHeader) {
      const updatedLocation = locationHeader.replace('https://_docs.handsontable.com', '');

      console.log('updatedLocation', locationHeader);

      return Response.redirect(`${updatedLocation}`, proxiedResponse.status);
    }
  }

  if (proxiedResponse.status >= 400 && proxiedResponse.status < 600) {
    return handle404(baseUrl, version);
  }

  return proxiedResponse;
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
    const { pathname, search } = currentUrl;
    const DOCS_LATEST_VERSION = Netlify.env.get('DOCS_LATEST_VERSION');

    if (!DOCS_LATEST_VERSION) {
      console.warn('No latest version found');
    }

    // Serve the 404 page without further rewrites to avoid rewrite loop
    if (pathname === '/docs/404.html') {
      return context.next();
    }

    // handle POST and other request by the default
    if (request.method !== 'GET') {
      return;
    }

    // handling cookie to set the framework value
    const cookieValue = context.cookies.get('docs_fw');
    const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

    // External redirect handling, 404 is handled by the external website
    const external = getExternalRedirects();
    const externalMatchFound = external.find(entry => entry.from.test(pathname));

    if (externalMatchFound) {
      const url = pathname.replace(externalMatchFound.from, externalMatchFound.to);

      console.warn('handleExternalMatch');

      return Response.redirect(url, 301);
    }

    // Matches 1-3 digits docs version
    const versionPattern = /^\/docs\/(\d+\.\d+\.\d+|\d+\.\d+|\d+)(.*)$/;
    const match = pathname.match(versionPattern);

    if (match) {
      const version = match[1];

      // If it's not the latest version, redirect/proxy to external OVH docs
      if (version !== DOCS_LATEST_VERSION) {
        // Handle transparent proxy
        return proxyRequestToOvh(request, pathname, version, baseUrl);
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

      return handle404(baseUrl, DOCS_LATEST_VERSION);
    } catch (e) {
      console.error('External Rewrite: Server error', request.url, e);

      return handle404(baseUrl, DOCS_LATEST_VERSION);
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

/**
 * Retrieves OVH redirects.
 *
 * @returns {Redirect[]}
 */
function getOVHRedirects(): { from: RegExp; to: string }[] {
  return [
    {
      from: /^\/docs\/(\d+\.\d+)(.*)$/,
      to: 'https://_docs.handsontable.com/docs/$1.0$2',
    },
    {
      from: /^\/docs\/(\d+)(.*)$/,
      to: 'https://_docs.handsontable.com/docs/$1.0.0$2',
    },
    {
      from: /^\/docs\/(\d+\.\d+\.\d+)(.*)$/,
      to: 'https://_docs.handsontable.com/docs/$1$2',
    },
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
      to: 'https://hyperformula.handsontable.com/$1',
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
