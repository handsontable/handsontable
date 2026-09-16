/**
 * Fills in the "design system last updated" fields.
 *
 * Two pages carry one: the design system guide and the newest changelog. Both
 * mark the spot with a `data-design-system-updated` element that starts
 * hidden; this script reveals it only once a real date arrives. So a page with
 * no date - credentials unset, Figma unreachable - looks exactly as it did
 * before, with no empty row and no error in the console.
 *
 * The page owns the wording around the date, and the script writes only into
 * a `data-design-system-updated-date` slot inside the field. That split is
 * what lets the changelog wrap "Design system" in a link: the link is a
 * Markdown `@/` link, which the docs build resolves per framework, and writing
 * the field's whole `textContent` would delete it.
 *
 * The date itself comes from the docs worker (rule 18c in
 * `docs/cloudflare/_worker.js`), not from Figma directly: a Figma token in
 * client JavaScript would be public, and the site's CSP has no
 * `api.figma.com` in `connect-src` anyway.
 */
(function() {
  'use strict';

  var ENDPOINT = '/docs/api/design-system-updated.json';

  // A named version is the design team marking a release; last-touched is any
  // edit at all. They mean different things, so the field says which it got
  // rather than presenting both as "updated".
  var LABELS = {
    'named-version': 'last published',
    'last-touched': 'last Figma update',
  };

  /**
   * Formats an ISO timestamp as a long US date, or returns null if the date
   * did not parse.
   *
   * Rendered in UTC, not the reader's zone. The timestamp is the moment a
   * version was saved in Figma, and a version saved at 22:00 UTC would
   * otherwise read as the next day in Warsaw and the same day in New York -
   * two readers seeing two different publish dates for one event.
   *
   * @param {string} iso
   * @returns {string|null}
   */
  function formatDate(iso) {
    var parsed = new Date(iso);

    if (isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Writes the date into every field and reveals them.
   *
   * @param {NodeList} fields
   * @param {{date: string, source: string}} payload
   * @returns {void}
   */
  function render(fields, payload) {
    var formatted = formatDate(payload.date);

    if (formatted === null) {
      return;
    }

    var text = (LABELS[payload.source] || LABELS['last-touched']) + ': ' + formatted;

    Array.prototype.forEach.call(fields, function(field) {
      var slot = field.querySelector('[data-design-system-updated-date]');

      // A field without a slot is broken markup. Leave it hidden rather than
      // reveal a line that is missing its date.
      if (!slot) {
        return;
      }

      slot.textContent = text;
      // Inline `display` rather than the `hidden` attribute: an author-level
      // `p { display: block }` in the site CSS beats the user-agent rule for
      // `[hidden]`, which would show an empty paragraph before the fetch.
      field.style.display = '';
    });
  }

  /**
   * Looks for fields on this page and, if there are any, asks the worker for
   * the date.
   *
   * @returns {void}
   */
  function init() {
    var fields = document.querySelectorAll('[data-design-system-updated]');

    // Loaded on every docs page, used on two. Leaving early keeps it free
    // everywhere else - no request, no work.
    if (!fields.length || !window.fetch) {
      return;
    }

    window.fetch(ENDPOINT)
      .then(function(response) {
        return response.ok ? response.json() : null;
      })
      .then(function(payload) {
        if (payload && payload.date) {
          render(fields, payload);
        }
      })
      .catch(function() {
        // Endpoint unreachable - leave the fields hidden.
      });
  }

  // `defer` means this normally runs before DOMContentLoaded, but guard the
  // other order too: a listener added after the event has fired never runs.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
