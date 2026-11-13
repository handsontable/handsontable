import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  autocompleteField,
  errorFindings,
  fieldFindings,
  formatFindings,
  isTrap,
  purposeOf,
  redundantEntryFindings,
  successFindings,
} from '../site-forms.mjs';

const kinds = findings => findings.map(item => item.kind);
const field = (overrides = {}) => ({
  role: 'textbox', name: 'Email address', label: 'Email address', visibleLabel: true, placeholder: null, required: true,
  autocomplete: 'email', tabindex: null, visible: true, ariaHidden: false, shape: 'input', ...overrides,
});

test('1.3.5: a field is matched with its purpose by name, and an autocomplete value by its last token', () => {
  assert.equal(purposeOf('Work email')?.purpose, 'email');
  assert.equal(purposeOf('First Name')?.purpose, 'given name');
  assert.equal(purposeOf('Last NameOptional')?.purpose, 'family name');
  assert.equal(purposeOf('Company name')?.purpose, 'organization');
  assert.equal(purposeOf('Tell us more about your project (optional)'), null, 'a question about the project is no input purpose');
  assert.equal(autocompleteField('section-a work email'), 'email');
  assert.equal(autocompleteField('off'), null);
  assert.equal(autocompleteField(null), null);
});

test('1.3.5: the organization is the whole name, so a question about the company asks for no organization', () => {
  // The names production's forms carry (the contact tabs and the trial form), each with a mark at most.
  for (const name of ['Company name', 'Company Name', 'COMPANY NAME', 'Company', 'Your company', 'Organisation name',
    'Company nameOptional', 'Company name *', 'Company name (optional)']) {
    assert.equal(purposeOf(name)?.purpose, 'organization', name);
  }
  assert.equal(purposeOf('Company size'), null, 'a size is no input purpose');
  assert.equal(purposeOf('Company website')?.purpose, 'website', 'the company\'s address is a URL');
  assert.equal(purposeOf('Position in the company')?.purpose, 'job title', 'a position is the visitor\'s job title');
  assert.deepEqual(kinds(fieldFindings([field({ role: 'combobox', shape: 'select', name: 'Company size', label: 'Company size',
    autocomplete: null })])), [], 'a select of company sizes needs no autocomplete token');
});

test('1.3.5: a full name is the whole name too, so a question that starts with "Name" asks for none', () => {
  for (const name of ['Name', 'Your name', 'Full name', 'Full Name*', 'NameOptional']) {
    assert.equal(purposeOf(name)?.purpose, 'name', name);
  }
  assert.equal(purposeOf('Name of your project'), null, 'a project\'s name is not the visitor\'s');
  assert.deepEqual(kinds(fieldFindings([field({ name: 'Name of your project', label: 'Name of your project', autocomplete: null })])), [],
    'a field naming the project needs no autocomplete token');
});

test('1.3.5: a personal field without its token, or with another one', () => {
  assert.deepEqual(kinds(fieldFindings([field()])), [], 'production\'s email field carries autocomplete="email"');
  assert.deepEqual(kinds(fieldFindings([field({ autocomplete: null })])), ['autocomplete-missing']);
  assert.deepEqual(kinds(fieldFindings([field({ name: 'First Name', label: 'First Name', autocomplete: 'name' })])), ['autocomplete-wrong']);
  assert.deepEqual(kinds(fieldFindings([field({ role: 'checkbox', name: 'Email me updates', autocomplete: null })])), [],
    'a checkbox asks for no input purpose');
});

test('3.3.2: a field with no name, a name not drawn, and required fields told apart in neither way', () => {
  assert.deepEqual(kinds(fieldFindings([field({ name: '', label: '', visibleLabel: false })])), ['field-unlabeled']);
  assert.deepEqual(kinds(fieldFindings([field({ label: '', visibleLabel: false, placeholder: 'john@company.com' })])), ['label-not-visible'],
    'the footer newsletter\'s shape: an aria-label and a placeholder');
  assert.deepEqual(kinds(fieldFindings([
    field({ name: 'First Name', label: 'First Name', autocomplete: 'given-name', required: true }),
    field({ role: 'textbox', name: 'Notes', label: 'Notes', autocomplete: null, required: false }),
  ])), ['required-not-indicated']);
  assert.deepEqual(kinds(fieldFindings([
    field({ name: 'First Name', label: 'First Name', autocomplete: 'given-name', required: true }),
    field({ role: 'textbox', name: 'Notes', label: 'Notes Optional', autocomplete: null, required: false }),
  ])), [], 'marking the optional fields is one way');
  assert.deepEqual(kinds(fieldFindings([
    field({ name: 'First Name', label: 'First Name *', autocomplete: 'given-name', required: true }),
    field({ role: 'textbox', name: 'Notes', label: 'Notes', autocomplete: null, required: false }),
  ])), [], 'marking the required ones is the other');
  assert.deepEqual(kinds(fieldFindings([field(), field({ role: 'checkbox', name: 'I agree', label: 'I agree', autocomplete: null })])), [],
    'a form whose fields are all required needs no marker');
  assert.deepEqual(kinds(fieldFindings([
    field({ name: 'First Name', label: 'First Name', autocomplete: 'given-name', required: true }),
    field({ role: 'textbox', name: 'Your message Optional', label: 'Your messageOptional', autocomplete: null, required: false }),
    field({ role: 'checkbox', name: 'DataGrid', label: 'DataGrid', autocomplete: null, required: false }),
    field({ role: 'checkbox', name: 'I agree to receive email', label: 'I agree to receive email', autocomplete: null, required: false }),
  ])), [], 'the contact form\'s shape: a checkbox left unticked is a choice, not an entry, so it carries no "Optional"');
  assert.deepEqual(kinds(fieldFindings([
    field({ label: '', visibleLabel: false, placeholder: 'john@company.com' }),
    field({ role: 'checkbox', name: 'I agree', label: 'I agree', autocomplete: null, required: false }),
  ])), ['label-not-visible'], 'the newsletter\'s shape: one entry and a choice tell nothing apart');
  assert.deepEqual(kinds(fieldFindings([
    field({ name: 'First Name', label: 'First Name', autocomplete: 'given-name', required: true }),
    field({ role: 'checkbox', name: 'I accept the terms', label: 'I accept the terms', autocomplete: null, required: true }),
    field({ role: 'textbox', name: 'Notes', label: 'Notes', autocomplete: null, required: false }),
  ])), ['required-not-indicated'], 'a required checkbox still counts among the required fields');
});

test('1.3.1: a field marked required in its label and not exposed as required; a spam trap read out', () => {
  assert.deepEqual(kinds(fieldFindings([field({ label: 'Email address *', required: false })])), ['required-not-exposed']);

  const trap = field({ name: 'Leave this field empty', label: 'Leave this field empty', tabindex: '-1', autocomplete: 'off', required: false });

  assert.equal(isTrap(trap), true);
  assert.deepEqual(fieldFindings([trap]).map(item => [item.kind, item.severity]), [['trap-field-exposed', 'advisory']],
    'a trap is judged as a trap only, never as a field with no autocomplete');
  assert.deepEqual(kinds(fieldFindings([{ ...trap, ariaHidden: true }])), []);
});

test('3.3.1 and 4.1.3: a submit with every field empty', () => {
  const after = (overrides = {}) => ({ shape: 'input', name: 'Email address', required: true, invalid: true, description: 'Enter your email address.', nearby: '', ...overrides });
  const told = { announced: [], focusedInvalid: true, focusedMessage: false };

  assert.deepEqual(kinds(errorFindings({ fields: [after()], sent: false, told })), [], 'flagged, tied, and the focus moved onto it');
  assert.deepEqual(kinds(errorFindings({ fields: [after({ invalid: false, description: '' })], sent: false, told })), ['error-not-identified']);
  assert.deepEqual(kinds(errorFindings({ fields: [after({ description: '' })], sent: false, told })), ['error-without-text']);
  assert.deepEqual(kinds(errorFindings({ fields: [after({ description: '', nearby: 'Required' })], sent: false, told })), ['error-not-tied']);
  assert.deepEqual(kinds(errorFindings({ fields: [after()], sent: false, told: { announced: [], focusedInvalid: false, focusedMessage: false } })),
    ['errors-not-announced']);
  assert.deepEqual(kinds(errorFindings({ fields: [after()], sent: false, told: { announced: ['Please fix 1 error'], focusedInvalid: false, focusedMessage: false } })),
    [], 'a live region that speaks tells the visitor');
  assert.deepEqual(kinds(errorFindings({ fields: [after()], sent: true, told })), ['submitted-with-errors']);
  assert.deepEqual(kinds(errorFindings({ fields: [after({ required: false, invalid: false, description: '' })], sent: false, told })), [],
    'an optional field left empty is no error');
});

test('3.3.1 and 3.3.3: a malformed email address', () => {
  const email = (overrides = {}) => ({ shape: 'input', name: 'Email', invalid: true, description: 'Enter an address like name@company.com.', nearby: '', ...overrides });

  assert.deepEqual(kinds(formatFindings({ field: email(), sent: false })), []);
  assert.deepEqual(kinds(formatFindings({ field: email({ description: 'This field is required.' }), sent: false })),
    ['error-without-suggestion']);
  assert.deepEqual(kinds(formatFindings({ field: email({ description: 'Invalid entry.' }), sent: false })),
    ['error-without-suggestion'], 'an error that differs from the empty one can still say nothing of the format');
  assert.deepEqual(kinds(formatFindings({ field: email({ description: 'Enter a valid email address' }), sent: false })),
    [], 'the support call\'s shape: the one message for both asks for a valid address, which is the correction');
  assert.deepEqual(kinds(formatFindings({ field: email({ invalid: false, description: '' }), sent: false })), ['format-error-not-identified']);
  assert.deepEqual(kinds(formatFindings({ field: email(), sent: true })), ['format-error-not-identified'],
    'a form that posted took the address as valid, whatever it drew');
  assert.deepEqual(formatFindings({ field: null, sent: false }), []);
});

test('4.1.3: a success; 3.3.7: an entry kept across the form\'s tabs', () => {
  assert.deepEqual(kinds(successFindings({ reached: true, announced: [], focusedMessage: false })), ['success-not-announced']);
  assert.deepEqual(kinds(successFindings({ reached: true, announced: ['Thanks'], focusedMessage: false })), []);
  assert.deepEqual(kinds(successFindings({ reached: false, announced: [], focusedMessage: false })), [],
    'a success the run never reached is a problem of the target, not a finding');
  assert.deepEqual(redundantEntryFindings({ kept: false, from: 'Sales', to: 'Support' }).map(item => [item.kind, item.severity]),
    [['entry-not-kept', 'advisory']]);
  assert.deepEqual(redundantEntryFindings({ kept: true, from: 'Sales', to: 'Support' }), []);
  assert.deepEqual(redundantEntryFindings({ kept: null, from: 'Sales', to: 'Support' }), []);
});
