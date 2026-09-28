import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const sidebarPath = fileURLToPath(new URL('../PageSidebar.astro', import.meta.url));
const sidebarSource = readFileSync(sidebarPath, 'utf8');

const PAGE_URL = 'https://handsontable.com/docs/angular-data-grid/row-parent-child/';
const PLUGIN_DEFAULT_PROMPT = 'Read {url}. I want to ask questions about it.';

// The statements that turn starlight-page-actions' optional `prompt` config into
// the query string of every "Open in ..." link. `prompt` has no default in the
// plugin's config object, so an unguarded template literal stringifies
// `undefined` into the link and every AI vendor opens with "undefined <url>".
// `as <Type>` assertions are stripped so the block stays runnable as plain JS —
// without it `new Function` throws a SyntaxError and the assertions below would
// go red for the wrong reason.
const promptBlock = sidebarSource
  .slice(
    sidebarSource.indexOf('const promptTemplate ='),
    sidebarSource.indexOf('interface ActionLink')
  )
  .replace(/ as [A-Za-z_$][\w$]*/g, '');

/**
 * Runs the component's prompt-building statements against a stubbed config value.
 *
 * @param {string|undefined} userPrompt The `prompt` value from the plugin config.
 * @returns {{prompt: string, encodedPrompt: string}} The built prompt and its encoded form.
 */
function buildPrompt(userPrompt) {
  // eslint-disable-next-line no-new-func
  const run = new Function(
    'userPrompt',
    'currentUrl',
    'Astro',
    `${promptBlock}\nreturn { prompt, encodedPrompt };`
  );

  return run(userPrompt, PAGE_URL, {
    locals: { t: () => PLUGIN_DEFAULT_PROMPT },
  });
}

test('an unconfigured prompt falls back to the plugin default, never "undefined"', () => {
  const { prompt, encodedPrompt } = buildPrompt(undefined);

  assert.doesNotMatch(prompt, /undefined/);
  assert.doesNotMatch(encodedPrompt, /undefined/);
  assert.equal(prompt, `Read ${PAGE_URL}. I want to ask questions about it.`);
});

test('a configured prompt has its {url} placeholder replaced with the page URL', () => {
  const { prompt } = buildPrompt('Summarize {url} for me.');

  assert.equal(prompt, `Summarize ${PAGE_URL} for me.`);
});

test('a configured prompt without {url} gets the page URL appended', () => {
  const { prompt } = buildPrompt('Summarize this page.');

  assert.equal(prompt, `Summarize this page. ${PAGE_URL}`);
});

test('both "Open in ..." links send the encoded prompt', () => {
  assert.match(sidebarSource, /https:\/\/chatgpt\.com\/\?q=\$\{encodedPrompt\}/);
  assert.match(sidebarSource, /https:\/\/claude\.ai\/new\?q=\$\{encodedPrompt\}/);
});
