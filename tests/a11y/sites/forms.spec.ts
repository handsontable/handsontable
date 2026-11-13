import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test';
import { SITE_CHECKS, siteCheckId, siteOf } from '../../lib/a11y-site-checks.mjs';
import {
  errorFindings,
  fieldFindings,
  formatFindings,
  isTrap,
  redundantEntryFindings,
  successFindings,
} from '../../lib/site-forms.mjs';
import { openAxSession } from '../checks/walker';
import { attachEvidence, readEnvironment, type EvidenceFinding } from '../evidence';
import { WEBSITE_PAGES } from '../website/pages.mjs';
import { BOOKING, SUBMISSIONS, VISITOR, fillForm, hydrated, openWebsitePage, pickTime, settleWebsite } from '../website/website-site';
import { declareSiteTarget } from './harness';
import { siteDefinition, type SitePage } from './sites';

/**
 * The forms of the website (`website-forms`): 1.3.1, 1.3.5, 3.3.1, 3.3.2, 3.3.3, 3.3.7 and 4.1.3, on each lead form,
 * the support call's details and the footer newsletter, at the desktop width. The verdicts are `lib/site-forms.mjs`.
 *
 * - **At rest:** every field as the accessibility tree gives it (role, name, description, required), with its label's
 *   text, whether a label is drawn, and its `autocomplete`.
 * - **Submitted empty, from the keyboard** (the submit button focused, Enter): which fields the form flags and with
 *   what text, whether that text is tied to the field, and whether a screen reader is told (a live region speaks, or
 *   the focus moves onto an invalid field or a message). The live regions are watched from before the page loads.
 * - **Submitted with an email address that has no @:** whether the form takes it, and whether its error says more
 *   than the one for an empty field.
 * - **Submitted filled in** (the forms whose `success` is set): whether the thank-you is spoken or focused.
 * - **The contact form's tabs:** whether an email address typed on one tab is still there on the other (advisory).
 *
 * **No write leaves the runner.** The guard answers a HubSpot submit and a booking on the page and aborts every other
 * write (`a11y/website/website-site.ts`, `guardSite()`), and the test asserts that only the filled-in submit was
 * answered, once; a form that posted earlier is a finding (`submitted-with-errors`). The page's clock is installed so
 * the filled-in submit can pass the spam guard's minimum (`fillForm()`).
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe".
 */

const SITE = siteDefinition(siteOf(process.env.HOT_A11Y_SITE));
const CHECK = siteCheckId(SITE.id, 'forms');
const CRITERIA: string[] = SITE_CHECKS[CHECK]?.criteria ?? [];
const THEME = 'light';
const THANKS = /^(Thank you — our team will get back to you shortly\.|Thanks for filling out the form\.)$/;
// What a live region is: the markup a screen reader speaks the changes of.
const LIVE = '[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"], output';
const FIELDS = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea, '
  + '[role="combobox"]:not(input):not(select), [role="textbox"]:not(input):not(textarea)';
const MALFORMED_EMAIL = 'ada.example.com';

/**
 * The tab or the radio button an address must open selected, read from the website's page list
 * (`a11y/website/pages.mjs`), the one place an address's selection is written. `openWebsitePage()` asserts it, so an
 * address that stops selecting its tab fails the test, rather than measuring the default tab's form under this one's
 * id. An address with a query or a hash that the list gives no selection is a tooling error.
 *
 * @param path The address.
 * @returns The role and the name, or `undefined` for an address that selects nothing.
 */
function selectedOf(path: string): readonly string[] | undefined {
  const listed = WEBSITE_PAGES.find(item => item.route === path && (item as { selected?: readonly string[] }).selected);
  const selected = (listed as { selected?: readonly string[] } | undefined)?.selected;

  if (!selected && /[?#]/.test(path)) {
    throw new Error(`${path}: an address with a query or a hash names the tab it selects in a11y/website/pages.mjs`);
  }

  return selected;
}

interface FormTarget extends SitePage {
  /**
   * Where the form is: the lead form in the page's main content, the newsletter in the footer, or the support call's
   * details, shown once a time is picked.
   */
  form: 'main' | 'footer' | 'booker';
  submit: RegExp;
  /**
   * The thank-you a filled-in submit shows; `null` for a form this run never sends (the contact form's other tabs post
   * through the same component as its first).
   */
  success: RegExp | null;
  /**
   * The tab the form opens on and the one the visitor switches to (3.3.7).
   */
  tabs?: [string, string];
}

const FORMS: FormTarget[] = [
  { id: 'contact-sales', path: '/contact/', state: 'none', surface: 'the contact form, Sales tab', form: 'main', submit: /^Submit$/,
    success: THANKS, tabs: ['Sales', 'Support'] },
  { id: 'contact-support', path: '/contact/#support', state: 'none', surface: 'the contact form, Support tab', form: 'main', submit: /^Submit$/,
    success: null },
  { id: 'contact-general', path: '/contact/#general', state: 'none', surface: 'the contact form, General tab', form: 'main', submit: /^Submit$/,
    success: null },
  { id: 'evaluation', path: '/evaluation/', state: 'none', surface: 'the trial license form', form: 'main', submit: /^(Submit|Get your license key)$/,
    success: THANKS },
  { id: 'support-call', path: '/support-call/', state: 'none', surface: 'the support call\'s details, a time picked', form: 'booker',
    submit: /^Book the call$/, success: /^You’re booked\.$/ },
  { id: 'newsletter', path: '/', state: 'none', surface: 'the footer newsletter', form: 'footer', submit: /^Subscribe$/,
    success: /^You’re on the list — thank you\.$/ },
];

interface FieldRead {
  index: number;
  role: string;
  name: string;
  description: string;
  required: boolean;
  invalid: boolean;
  label: string;
  visibleLabel: boolean;
  placeholder: string | null;
  autocomplete: string | null;
  tabindex: string | null;
  visible: boolean;
  ariaHidden: boolean;
  shape: string;
  type: string;
  wrapperText: string[];
  trap?: boolean;
  nearby?: string;
}

test.describe(CHECK, () => {
  for (const entry of SITE.id === 'website' ? FORMS : []) {
    test(entry.id, async({ page }, testInfo) => {
      const target = declareSiteTarget(testInfo, entry, THEME, SITE);
      const startedAt = Date.now();
      const pageErrors: string[] = [];
      const findings: EvidenceFinding[] = [];
      const problems: string[] = [];
      const criteria = new Set<string>();
      const detail: Record<string, unknown> = {};

      await watchLiveRegions(page);

      const { guard, requests } = await openWebsitePage(page, { route: entry.path, state: 'none', selected: selectedOf(entry.path) }, {
        viewport: 'desktop', baseUrl: SITE.baseUrl, pageErrors, clock: true,
        answers: { submissions: entry.success !== null && entry.form !== 'booker', booking: entry.success !== null && entry.form === 'booker' },
      });
      const environment = await readEnvironment(page);
      const cdp = await openAxSession(page);
      const sent = () => [...guard.answered, ...guard.refused].filter(write => SUBMISSIONS.test(write.split(' ')[1] ?? '')
        || BOOKING.test(new URL(write.split(' ')[1] ?? '/', SITE.baseUrl).pathname)).length;

      if (entry.form === 'booker') {
        await pickTime(page);
      }

      const form = await markForm(page, entry);

      // 3.3.7, on a fresh form: an email address typed on one tab, the tab switched, the address read back.
      if (entry.tabs) {
        const kept = await keptAcrossTabs(page, entry.tabs);

        findings.push(...redundantEntryFindings({ kept, from: entry.tabs[0], to: entry.tabs[1] }) as EvidenceFinding[]);
        detail.tabs = { from: entry.tabs[0], to: entry.tabs[1], kept };
        if (kept !== null) {
          criteria.add('3.3.7');
        }
      }

      // At rest: 1.3.1, 1.3.5, 3.3.2.
      const atRest = await readFields(page, cdp);

      findings.push(...fieldFindings(atRest) as EvidenceFinding[]);
      ['1.3.1', '1.3.5', '3.3.2'].forEach(id => criteria.add(id));
      detail.fields = atRest;

      // Submitted empty: 3.3.1, 4.1.3.
      const sentBefore = sent();
      const empty = await submit(page, form, entry, requests);
      const emptyFields = await readFields(page, cdp, atRest);
      const emptyTold = await told(page, entry);
      const postedEmpty = sent() > sentBefore;

      findings.push(...errorFindings({ fields: emptyFields, sent: postedEmpty, told: emptyTold }) as EvidenceFinding[]);
      ['3.3.1', '4.1.3'].forEach(id => criteria.add(id));
      detail.empty = { fields: emptyFields.map(({ wrapperText, ...field }) => field), told: emptyTold, sent: postedEmpty, pressed: empty };

      const email = emptyFields.find(field => field.type === 'email' || /e-?mail/i.test(field.name));

      // A malformed email address: 3.3.1, 3.3.3.
      if (email && !postedEmpty) {
        const sentBeforeFormat = sent();

        await page.locator(`[data-a11y-field="${email.index}"]`).fill(MALFORMED_EMAIL);
        await submit(page, form, entry, requests);

        const after = (await readFields(page, cdp, atRest)).find(field => field.index === email.index) ?? null;
        const postedMalformed = sent() > sentBeforeFormat;

        findings.push(...formatFindings({ field: after, sent: postedMalformed }) as EvidenceFinding[]);
        criteria.add('3.3.3');
        detail.malformed = { field: after && { ...after, wrapperText: undefined }, sent: postedMalformed };
      }

      // Filled in and sent, the write answered on the page: 4.1.3.
      if (entry.success && sent() === 0) {
        const answeredBefore = guard.answered.length;

        await fillForm(page, form);
        await clearAnnouncements(page);
        await pressSubmit(page, form, entry);
        await expect(page.getByText(entry.success).first(), `the ${entry.id} form showed its thank-you`).toBeVisible({ timeout: 30_000 });
        await settleWebsite(page, requests);

        const success = await told(page, entry);

        findings.push(...successFindings({ reached: true, ...success }) as EvidenceFinding[]);
        detail.success = success;
        // The positive control of the guard: the filled-in submit was caught on the page, once, and never sent.
        expect(guard.answered.length - answeredBefore, `the ${entry.id} form's submit was answered on the page once: ${guard.answered.join(', ')}`).toBe(1);
      } else if (entry.success) {
        problems.push('the form posted before it was filled in, so the thank-you was not measured');
      }
      detail.guard = { answered: guard.answered, refused: guard.refused, blocked: [...guard.blocked].sort() };

      await attachEvidence(testInfo, {
        target, startedAt, environment, pageErrors, findings, problems, detail,
        criteria: CRITERIA.filter(id => criteria.has(id)),
      });
    });
  }
});

/**
 * Records, from before the page loads, every change a screen reader would speak: the new text of each live region
 * (`LIVE`), with whether the region was in the page before that change (a region added together with its text is
 * spoken by most readers only when it is an alert).
 *
 * @param page The page.
 */
async function watchLiveRegions(page: Page): Promise<void> {
  await page.addInitScript((selector) => {
    const state = window as unknown as { __a11yLive: Array<{ region: Element; text: string; inserted: boolean }> };
    const known = new WeakSet<Element>();
    const remember = () => document.querySelectorAll(selector).forEach(region => known.add(region));

    state.__a11yLive = [];
    new MutationObserver((mutations) => {
      const touched = new Set<Element>();

      for (const mutation of mutations) {
        const node = mutation.target.nodeType === Node.ELEMENT_NODE ? mutation.target as Element : mutation.target.parentElement;
        const region = node?.closest(selector);

        if (region) {
          touched.add(region);
        }
        for (const added of mutation.addedNodes) {
          if (added instanceof Element) {
            if (added.matches(selector)) {
              touched.add(added);
            }
            added.querySelectorAll(selector).forEach(inner => touched.add(inner));
          }
        }
      }
      for (const region of touched) {
        state.__a11yLive.push({ region, text: (region.textContent ?? '').replace(/\s+/g, ' ').trim(), inserted: !known.has(region) });
      }
      remember();
    }).observe(document, { subtree: true, childList: true, characterData: true });
  }, LIVE);
}

/**
 * Forgets what the live regions said so far.
 *
 * @param page The page.
 */
async function clearAnnouncements(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __a11yLive: unknown[] }).__a11yLive.length = 0;
  });
}

/**
 * Marks the form under test (`data-a11y-form`) and each of its fields (`data-a11y-field`), in document order.
 *
 * @param page The page.
 * @param entry The form.
 * @returns The form.
 */
async function markForm(page: Page, entry: FormTarget): Promise<Locator> {
  if (entry.form === 'booker') {
    await expect(page.getByLabel('Work email'), 'the support call\'s details showed').toBeVisible();
  } else {
    await hydrated(page, `${entry.form} form input`);
  }
  await page.evaluate(([where, fields]) => {
    const form = where === 'booker'
      ? (document.querySelector('input[type="email"]:not(footer input)')?.closest('form, section, [role="form"]') ?? null)
      : document.querySelector(`${where} form`);

    if (!form) {
      throw new Error(`no ${where} form on ${location.pathname}`);
    }
    document.querySelectorAll('[data-a11y-form]').forEach(item => item.removeAttribute('data-a11y-form'));
    form.setAttribute('data-a11y-form', '');
    form.querySelectorAll(fields).forEach((field, index) => field.setAttribute('data-a11y-field', String(index)));
  }, [entry.form, FIELDS] as const);

  return page.locator('[data-a11y-form]');
}

/**
 * Reads every marked field: its role, name, description and states from the accessibility tree, and from the DOM its
 * label, whether a label is drawn, its placeholder, `autocomplete`, `tabindex`, visibility and shape, and the text
 * around it (the part of the form that holds this field and no other). With `before`, `nearby` is the text that
 * appeared around the field since.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param before The fields read at rest.
 * @returns The fields.
 */
async function readFields(page: Page, cdp: CDPSession, before?: FieldRead[]): Promise<FieldRead[]> {
  const dom = await page.evaluate(() => {
    const form = document.querySelector('[data-a11y-form]')!;
    const fields = [...form.querySelectorAll('[data-a11y-field]')] as HTMLInputElement[];
    const visibleText = (element: Element | null) => Boolean(element && element.checkVisibility({ visibilityProperty: true, opacityProperty: true })
      && (element as HTMLElement).innerText?.trim());
    const stem = (name: string) => name.replace(/^_([A-Za-z][\w-]*?)_[a-z0-9]{5}_\d+$/, '$1');

    return fields.map((field) => {
      const labels = [...(field.labels ?? [])];
      const labelledBy = (field.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean)
        .map(id => document.getElementById(id)).filter((item): item is HTMLElement => item !== null);
      let wrapper: Element = field;

      while (wrapper.parentElement && wrapper.parentElement !== form && wrapper.parentElement.querySelectorAll('[data-a11y-field]').length === 1) {
        wrapper = wrapper.parentElement;
      }

      const labelText = [...labels, ...labelledBy].map(item => item.textContent ?? '').join(' ');
      const own = [...field.classList].map(stem).find(name => !/^astro-|:|-(?=[a-z]*\d)[a-z0-9]{5,}$/.test(name));

      return {
        index: Number(field.getAttribute('data-a11y-field')),
        label: labelText.replace(/\s+/g, ' ').trim(),
        visibleLabel: [...labels, ...labelledBy].some(visibleText),
        placeholder: field.getAttribute('placeholder'),
        autocomplete: field.getAttribute('autocomplete'),
        tabindex: field.getAttribute('tabindex'),
        visible: field.checkVisibility({ visibilityProperty: true, opacityProperty: true })
          || labels.some(label => label.checkVisibility({ visibilityProperty: true, opacityProperty: true })),
        ariaHidden: Boolean(field.closest('[aria-hidden="true"], [inert]')),
        shape: `${field.tagName.toLowerCase()}${own ? `.${own}` : ''}${field.getAttribute('role') ? `[role="${field.getAttribute('role')}"]` : ''}`,
        type: field.type ?? '',
        wrapperText: ((wrapper as HTMLElement).innerText ?? '').split('\n').map(line => line.trim()).filter(Boolean),
        domInvalid: field.getAttribute('aria-invalid') === 'true',
        errorMessage: (field.getAttribute('aria-errormessage') ?? '').split(/\s+/).filter(Boolean)
          .map(id => document.getElementById(id)?.textContent?.trim() ?? '').join(' '),
      };
    });
  });
  const reads: FieldRead[] = [];

  for (const field of dom) {
    const ax = await axOf(cdp, `[data-a11y-field="${field.index}"]`);
    const previous = before?.find(item => item.index === field.index);
    const lines = previous ? field.wrapperText.filter(line => !previous.wrapperText.includes(line) && line !== field.label) : [];
    const read: FieldRead = {
      index: field.index, role: ax.role, name: ax.name,
      // A reader speaks an error message tied with `aria-errormessage` while the field is invalid, besides its
      // description.
      description: [ax.description, ax.invalid || field.domInvalid ? field.errorMessage : ''].filter(Boolean).join(' ').trim(),
      required: ax.required, invalid: ax.invalid || field.domInvalid, label: field.label, visibleLabel: field.visibleLabel,
      placeholder: field.placeholder, autocomplete: field.autocomplete, tabindex: field.tabindex, visible: field.visible,
      ariaHidden: field.ariaHidden, shape: field.shape, type: field.type, wrapperText: field.wrapperText,
      nearby: lines.join(' '),
    };

    read.trap = isTrap(read);
    reads.push(read);
  }

  return reads;
}

/**
 * The role, name, description and the required and invalid states Chromium's accessibility tree gives an element.
 *
 * @param cdp The accessibility session.
 * @param selector The element.
 * @returns What the tree gives it.
 */
async function axOf(cdp: CDPSession, selector: string) {
  const { result } = await cdp.send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(selector)})`, objectGroup: 'a11y-forms' });

  try {
    if (!result.objectId) {
      return { role: '', name: '', description: '', required: false, invalid: false };
    }

    const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId });
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false });
    const own = nodes.find(item => item.backendDOMNodeId === node.backendNodeId) ?? nodes[0];
    const property = (name: string) => own?.properties?.find(item => item.name === name)?.value?.value;

    return {
      role: String(own?.role?.value ?? ''),
      name: String(own?.name?.value ?? ''),
      description: String(own?.description?.value ?? ''),
      required: property('required') === true,
      invalid: !['false', undefined, false].includes(property('invalid') as string | boolean | undefined),
    };
  } finally {
    await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'a11y-forms' });
  }
}

/**
 * Presses the form's submit button from the keyboard: the button focused, then Enter.
 *
 * @param page The page.
 * @param form The form.
 * @param entry The form's target.
 */
async function pressSubmit(page: Page, form: Locator, entry: FormTarget): Promise<void> {
  const inForm = form.getByRole('button', { name: entry.submit });
  const button = (await inForm.count()) > 0 ? inForm.first() : page.getByRole('button', { name: entry.submit }).first();

  await button.focus();
  await page.keyboard.press('Enter');
}

/**
 * Submits the form as it stands and waits for the page to settle.
 *
 * @param page The page.
 * @param form The form.
 * @param entry The form's target.
 * @param requests The page's request watch.
 * @returns Where the focus went.
 */
async function submit(page: Page, form: Locator, entry: FormTarget, requests: Parameters<typeof settleWebsite>[1]): Promise<string> {
  await clearAnnouncements(page);
  await pressSubmit(page, form, entry);
  await settleWebsite(page, requests);

  return page.evaluate(() => {
    const element = document.activeElement;

    return element ? `${element.tagName.toLowerCase()}${element.getAttribute('data-a11y-field') ? `[field ${element.getAttribute('data-a11y-field')}]` : ''}` : 'none';
  });
}

/**
 * What a screen reader was told since the last submit: the text the live regions related to the form spoke (a region
 * that holds the form, sits inside it, or holds no form at all; a region added with its text counts only as an alert),
 * and whether the focus moved onto an invalid field or onto a message.
 *
 * @param page The page.
 * @param entry The form's target.
 * @returns What was told.
 */
async function told(page: Page, entry: FormTarget): Promise<{ announced: string[]; focusedInvalid: boolean; focusedMessage: boolean }> {
  return page.evaluate(([submitSource]) => {
    const form = document.querySelector('[data-a11y-form]');
    const records = (window as unknown as { __a11yLive: Array<{ region: Element; text: string; inserted: boolean }> }).__a11yLive;
    const last = new Map<Element, string>();

    for (const record of records) {
      const role = record.region.getAttribute('role');
      const assertive = record.region.getAttribute('aria-live') === 'assertive';
      const related = !form || record.region.contains(form) || form.contains(record.region)
        || (!record.region.closest('form') && !record.region.querySelector('form'));

      if (record.text && related && (!record.inserted || role === 'alert' || assertive)) {
        last.set(record.region, record.text.slice(0, 200));
      }
    }

    const active = document.activeElement as HTMLElement | null;
    const submitPattern = new RegExp(submitSource);
    const isField = Boolean(active?.matches('input, select, textarea, [role="combobox"], [role="textbox"]'));
    const isSubmit = Boolean(active && active.matches('button, [type="submit"]') && submitPattern.test((active.innerText ?? '').trim()));

    return {
      announced: [...last.values()],
      focusedInvalid: Boolean(active && isField && (active.getAttribute('aria-invalid') === 'true' || active.matches(':invalid'))),
      focusedMessage: Boolean(active && active !== document.body && active !== document.documentElement && !isField && !isSubmit
        && active.innerText?.trim()),
    };
  }, [entry.submit.source] as const);
}

/**
 * Types an email address on the form's first tab, switches to the other from the keyboard, and reads the address
 * back; then switches back and clears it, so the form is at rest again. `null` when the other tab has no email field.
 *
 * @param page The page.
 * @param tabs The tab the form opens on and the other one.
 * @returns Whether the address stayed.
 */
async function keptAcrossTabs(page: Page, [from, to]: [string, string]): Promise<boolean | null> {
  const emailOf = () => page.locator('[data-a11y-form]').getByRole('textbox', { name: /e-?mail/i }).first();

  await emailOf().fill(VISITOR.email);
  await page.getByRole('radio', { name: to }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio', { name: to, checked: true }), `the "${to}" tab selected`).toBeVisible();
  await hydrated(page, 'main form input');
  await page.evaluate(() => document.querySelector('main form')?.setAttribute('data-a11y-form', ''));

  const field = emailOf();
  const kept = (await field.count()) === 0 ? null : (await field.inputValue()) === VISITOR.email;

  await page.getByRole('radio', { name: from }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio', { name: from, checked: true }), `the "${from}" tab selected again`).toBeVisible();
  await hydrated(page, 'main form input');
  await page.evaluate(() => {
    document.querySelectorAll('[data-a11y-form]').forEach(item => item.removeAttribute('data-a11y-form'));
    document.querySelector('main form')?.setAttribute('data-a11y-form', '');
  });
  await emailOf().fill('');
  await page.evaluate((fields) => {
    const marked = document.querySelector('[data-a11y-form]')!;

    marked.querySelectorAll(fields).forEach((element, index) => element.setAttribute('data-a11y-field', String(index)));
  }, FIELDS);

  return kept;
}
