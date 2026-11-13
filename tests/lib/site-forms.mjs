/**
 * The forms of a site: the pure half.
 *
 * `a11y/sites/forms.spec.ts` reads each form of the website as a screen reader gets it (every field's role, name,
 * description, and required and invalid states, from Chromium's accessibility tree), then presses its submit button
 * from the keyboard empty, again with a malformed email address, and once filled in as a visitor would. No write leaves
 * the runner: the guard answers a HubSpot submit and a booking on the page and aborts every other write
 * (`a11y/website/website-site.ts`, `guardSite()`). The verdicts are here:
 *
 * - 1.3.1: a field the form marks required in its label that is not exposed as required, and a spam trap a screen
 *   reader reads out (advisory).
 * - 1.3.5: a field asking for the visitor's own data (a name, an email address, a company) without the
 *   `autocomplete` token for it.
 * - 3.3.1: a required field left empty that the form does not flag, an error with no text, an error not tied to its
 *   field, a malformed email address taken as valid, and a form sent with its errors.
 * - 3.3.2: a field with no name, a field with no visible label, and a form with required and optional fields that
 *   tells them apart in neither way (a marker on the required ones, "optional" on the others).
 * - 3.3.3: an error for a malformed email address that says no more than the one for an empty field.
 * - 3.3.7 (advisory): an entry lost when the visitor switches the form's tab.
 * - 4.1.3: errors or a success a screen reader is not told about: no live region speaks and the focus does not move.
 *
 * A field is reported once per kind and name per form. Policy: `tests/AGENTS.md`, "A11y: the site checks beyond
 * axe". No I/O in here.
 */

/**
 * A pattern that matches a field's whole name, followed at most by a required or optional mark (`*`, `Optional`,
 * `(required)`), glued to it or not (`Company nameOptional`).
 *
 * @param {string} source The name, as a regular expression source.
 * @returns {RegExp} The pattern, case-insensitive.
 */
function wholeName(source) {
  return new RegExp(`^${source}\\s*(\\*|\\(?(optional|required)\\)?)?\\s*$`, 'i');
}

/**
 * The input purposes of WCAG 2.2 (section 7) a field's name can be matched with, and the `autocomplete` field names
 * that serve each. A field whose name matches none is not about the visitor, or not a purpose the list has, and 1.3.5
 * asks nothing of it. A pattern has no word boundary after "name": a label's "Optional" badge can follow it with no
 * space (`Last NameOptional`). A full name and the organization take the whole name, with a required or optional mark
 * at most (`wholeName()`): a name and a company are the subject of other questions too ("Name of your project",
 * "Company size", "Company website", "Position in the company"), which ask for neither, and a field's names come from
 * the live HubSpot schema, so such a field can appear with no change here.
 */
export const FIELD_PURPOSES = Object.freeze([
  { purpose: 'email', pattern: /\be-?mail\b/i, tokens: ['email'] },
  { purpose: 'given name', pattern: /\b(first|given) ?name/i, tokens: ['given-name'] },
  { purpose: 'family name', pattern: /\b(last|family|sur) ?name/i, tokens: ['family-name'] },
  { purpose: 'name', pattern: wholeName('(your |full )?name'), tokens: ['name'] },
  { purpose: 'organization', pattern: wholeName('(your )?(company|organi[sz]ation)( name)?'), tokens: ['organization'] },
  { purpose: 'job title', pattern: /\b(job title|position)\b/i, tokens: ['organization-title'] },
  { purpose: 'telephone', pattern: /\b(phone|mobile|telephone)\b/i, tokens: ['tel', 'tel-national'] },
  { purpose: 'country', pattern: /\bcountry\b/i, tokens: ['country', 'country-name'] },
  { purpose: 'website', pattern: /\b(web ?site|url)\b/i, tokens: ['url'] },
]);

// A label's mark of a required field, and of an optional one. A required mark ends the label, the way a name ends
// before it (`wholeName()`): "How many licenses are required?" asks a question, and "Phone (not required)" marks the
// field optional.
const REQUIRED_MARK = /(?:\*|(?<!\bnot\s+)\(?\brequired\b\)?)\s*$/i;
const OPTIONAL_MARK = /\boptional\b/i;
// The roles of a choice: left unticked, it is an answer, never a missing entry, so no form marks it optional.
const CHOICE_ROLES = new Set(['checkbox', 'radio', 'switch']);
// What an error says when it tells the visitor what a valid entry looks like (3.3.3).
const FORMAT_HINT = /\bvalid\b|\bformat\b|@|\bexample\b|\blike\b|\be\.g\./i;
// The roles a form field has in Chromium's tree.
const FIELD_ROLES = new Set(['textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'switch', 'listbox', 'spinbutton', 'slider',
  'TextField', 'ComboBoxSelect', 'PopUpButton']);

/**
 * The input purpose a field's name asks for, or `null`.
 *
 * @param {string} name The field's accessible name.
 * @returns {{purpose: string, tokens: string[]}|null} The purpose.
 */
export function purposeOf(name) {
  const found = FIELD_PURPOSES.find(item => item.pattern.test(String(name ?? '')));

  return found ? { purpose: found.purpose, tokens: found.tokens } : null;
}

/**
 * The field name of an `autocomplete` value: its last token, after any section, shipping or billing, and contact
 * type (`section-a work email` is `email`). `null` for none, `off` and `on`.
 *
 * @param {string|null} value The attribute.
 * @returns {string|null} The field name.
 */
export function autocompleteField(value) {
  const tokens = String(value ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const last = tokens.at(-1) ?? null;

  return last === null || last === 'off' || last === 'on' ? null : last;
}

/**
 * Whether a field is the form's spam trap: a field the page tells people to leave empty, or one taken out of the tab
 * order and of sight.
 *
 * @param {{name: string, label: string, tabindex: string|null, visible: boolean}} field The field.
 * @returns {boolean} The verdict.
 */
export function isTrap(field) {
  return /leave (this|it) (field )?empty|do not fill/i.test(`${field.name} ${field.label ?? ''}`)
    || (field.tabindex !== null && Number(field.tabindex) < 0 && !field.visible);
}

/**
 * The findings of a form's fields at rest (1.3.1, 1.3.5, 3.3.2).
 *
 * @param {Array<{role: string, name: string, label: string, visibleLabel: boolean, placeholder: string|null,
 *   required: boolean, autocomplete: string|null, tabindex: string|null, visible: boolean, ariaHidden: boolean,
 *   shape: string}>} fields The form's fields, in document order: the name and the required state as the
 *   accessibility tree gives them, the label's text, and whether a label is drawn.
 * @returns {object[]} The findings.
 */
export function fieldFindings(fields) {
  const findings = [];
  const seen = new Set();
  const once = (finding) => {
    const key = `${finding.kind}|${finding.selector}`;

    if (!seen.has(key)) {
      seen.add(key);
      findings.push(finding);
    }
  };
  const real = [];

  for (const field of fields) {
    const selector = `${field.shape} "${String(field.name || field.label || '').slice(0, 60)}"`;

    if (isTrap(field)) {
      if (!field.ariaHidden && field.role !== '' && field.role !== 'none') {
        once({ kind: 'trap-field-exposed', criteria: ['1.3.1'], severity: 'advisory', selector,
          measured: { name: field.name, role: field.role },
          reason: 'A screen reader reads out the spam trap a sighted visitor never sees; a person checks that its name tells them to leave it alone' });
      }
      continue;
    }
    real.push(field);
    if (!field.name.trim()) {
      once({ kind: 'field-unlabeled', criteria: ['3.3.2', '4.1.2'], severity: 'serious', selector,
        measured: { role: field.role, placeholder: field.placeholder ?? '' },
        reason: 'The field has no name, so a screen reader says what it is but not what it asks for' });
    } else if (!field.visibleLabel) {
      once({ kind: 'label-not-visible', criteria: ['3.3.2'], severity: 'moderate', selector,
        measured: { name: field.name, placeholder: field.placeholder ?? '' },
        reason: `The field's name is not drawn as a label${field.placeholder ? ' (its placeholder disappears once the visitor types)' : ''}, so a sighted visitor has to guess what it asks for` });
    }
    if (REQUIRED_MARK.test(field.label ?? '') && !OPTIONAL_MARK.test(field.label ?? '') && !field.required) {
      once({ kind: 'required-not-exposed', criteria: ['1.3.1'], severity: 'moderate', selector,
        measured: { label: field.label },
        reason: 'The label marks the field required, but a screen reader is not told it is' });
    }

    const purpose = purposeOf(field.name);

    if (purpose && FIELD_ROLES.has(field.role) && !CHOICE_ROLES.has(field.role)) {
      const token = autocompleteField(field.autocomplete);

      if (!purpose.tokens.includes(token)) {
        once({ kind: token === null ? 'autocomplete-missing' : 'autocomplete-wrong', criteria: ['1.3.5'], severity: 'serious', selector,
          measured: { purpose: purpose.purpose, autocomplete: field.autocomplete ?? '', expected: purpose.tokens.join(' ') },
          reason: `The field asks for the visitor's ${purpose.purpose} without autocomplete="${purpose.tokens[0]}", so a browser cannot fill it in and an assistive tool cannot mark it` });
      }
    }
  }

  const required = real.filter(field => field.required);
  const optional = real.filter(field => !field.required && !CHOICE_ROLES.has(field.role));
  // The label's text runs its parts together ("Your messageOptional"); the accessible name keeps them apart.
  const marked = (field, mark) => mark.test(field.label ?? '') || mark.test(field.name ?? '');
  const marksRequired = required.length > 0 && required.every(field => marked(field, REQUIRED_MARK));
  const marksOptional = optional.length > 0 && optional.every(field => marked(field, OPTIONAL_MARK));

  if (required.length > 0 && optional.length > 0 && !marksRequired && !marksOptional) {
    findings.push({ kind: 'required-not-indicated', criteria: ['3.3.2'], severity: 'moderate', selector: 'form',
      measured: { required: required.length, optional: optional.length },
      reason: 'The form has required and optional fields and its labels tell them apart in neither way' });
  }

  return findings;
}

/**
 * The findings of a submit with every field empty (3.3.1, 4.1.3).
 *
 * @param {object} result What the submit did.
 * @param {Array<{shape: string, name: string, required: boolean, invalid: boolean, description: string, nearby: string,
 *   trap?: boolean}>} result.fields The fields after the submit: the invalid state and the description as the tree gives
 *   them, and the text that appeared next to the field.
 * @param {boolean} result.sent Whether the form posted (the guard answered or aborted its write).
 * @param {{announced: string[], focusedInvalid: boolean, focusedMessage: boolean}} result.told What a screen reader
 *   was told: the live regions' new text, and whether the focus moved onto an invalid field or a message.
 * @returns {object[]} The findings.
 */
export function errorFindings({ fields, sent, told }) {
  const findings = [];
  const required = fields.filter(field => field.required && !field.trap);

  if (sent && required.length > 0) {
    findings.push({ kind: 'submitted-with-errors', criteria: ['3.3.1'], severity: 'serious', step: 'submit empty',
      measured: { required: required.length },
      reason: 'The form posted with its required fields empty, so the visitor learns of the errors, if at all, from the server' });
  }

  let flagged = 0;

  for (const field of required) {
    const selector = `${field.shape} "${String(field.name).slice(0, 60)}"`;
    const text = field.description.trim() || field.nearby.trim();

    if (!field.invalid && !text) {
      findings.push({ kind: 'error-not-identified', criteria: ['3.3.1'], severity: 'serious', selector, step: 'submit empty',
        measured: { invalid: false },
        reason: 'The required field was left empty and the form neither marks it nor says so' });
      continue;
    }
    flagged += 1;
    if (!text) {
      findings.push({ kind: 'error-without-text', criteria: ['3.3.1'], severity: 'serious', selector, step: 'submit empty',
        measured: { invalid: field.invalid },
        reason: 'The field is marked invalid, but no text says what is wrong' });
    } else if (!field.description.trim()) {
      findings.push({ kind: 'error-not-tied', criteria: ['3.3.1', '1.3.1'], severity: 'moderate', selector, step: 'submit empty',
        measured: { message: field.nearby.trim().slice(0, 120) },
        reason: 'The error is drawn next to the field but not tied to it, so a screen reader on the field does not read it' });
    }
  }
  if (flagged > 0 && told.announced.length === 0 && !told.focusedInvalid && !told.focusedMessage) {
    findings.push({ kind: 'errors-not-announced', criteria: ['4.1.3'], severity: 'serious', step: 'submit empty',
      measured: { errors: flagged },
      reason: 'The form showed its errors without a live region speaking and without moving the focus, so a screen reader user hears nothing' });
  }

  return findings;
}

/**
 * The findings of a submit with a malformed email address (3.3.1, 3.3.3).
 *
 * @param {object} result What the submit did.
 * @param {{shape: string, name: string, invalid: boolean, description: string, nearby: string}|null} result.field The
 *   email field after the submit, or `null` when the form has none.
 * @param {boolean} result.sent Whether the form posted.
 * @returns {object[]} The findings.
 */
export function formatFindings({ field, sent }) {
  if (!field) {
    return [];
  }

  const selector = `${field.shape} "${String(field.name).slice(0, 60)}"`;
  const message = (field.description.trim() || field.nearby.trim());

  if (sent || (!field.invalid && !message)) {
    return [{ kind: 'format-error-not-identified', criteria: ['3.3.1'], severity: 'serious', selector, step: 'submit a malformed email address',
      measured: { sent, invalid: field.invalid },
      reason: 'An email address with no @ was taken as valid' }];
  }
  if (message && !FORMAT_HINT.test(message)) {
    return [{ kind: 'error-without-suggestion', criteria: ['3.3.3'], severity: 'moderate', selector, step: 'submit a malformed email address',
      measured: { message: message.slice(0, 120) },
      reason: 'The error for a malformed address does not say what a valid one looks like, so it does not say how to correct it' }];
  }

  return [];
}

/**
 * The finding of a success the visitor is not told about (4.1.3), when the form was sent.
 *
 * @param {{reached: boolean, announced: string[], focusedMessage: boolean}} result What the submit did: whether the
 *   success showed, what the live regions said, and whether the focus moved onto the message.
 * @returns {object[]} The findings.
 */
export function successFindings({ reached, announced, focusedMessage }) {
  if (!reached || announced.length > 0 || focusedMessage) {
    return [];
  }

  return [{ kind: 'success-not-announced', criteria: ['4.1.3'], severity: 'serious', step: 'submit filled in',
    measured: { announced: 0 },
    reason: 'The form showed its thank-you without a live region speaking and without moving the focus, so a screen reader user does not learn it was sent' }];
}

/**
 * The finding of an entry the form dropped when the visitor switched its tab (3.3.7, advisory: whether the tabs are
 * one process is a person's call).
 *
 * @param {{kept: boolean|null, from: string, to: string}} result What the switch did: whether the typed entry stayed
 *   (`null` when the form has no field both tabs share).
 * @returns {object[]} The findings.
 */
export function redundantEntryFindings({ kept, from, to }) {
  if (kept !== false) {
    return [];
  }

  return [{ kind: 'entry-not-kept', criteria: ['3.3.7'], severity: 'advisory', step: `type an email address on "${from}", switch to "${to}"`,
    measured: { kept },
    reason: 'Switching the form\'s tab cleared what the visitor typed, so they type it again' }];
}

/**
 * Whether a role is a form field's.
 *
 * @param {string} role The role from the accessibility tree.
 * @returns {boolean} The verdict.
 */
export function isFieldRole(role) {
  return FIELD_ROLES.has(role);
}
