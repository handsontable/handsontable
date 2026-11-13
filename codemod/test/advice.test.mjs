import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { shortenAdvice } from '../src/lib/todo.mjs';
import { VERSIONS_DIR, loadManifests } from '../src/manifest.mjs';

/**
 * Verbs a first sentence may start with. The first sentence of a rule's advice or message becomes the text of the
 * TODO comment, so it has to say what to do, not only that something was removed.
 */
const ACTION = new Set(['Use', 'Replace', 'Remove', 'Delete', 'Deleted', 'Move', 'Rename', 'Add', 'Check', 'Set',
  'Pass', 'Import', 'Keep', 'Update', 'Install', 'Edit', 'Draw', 'Describe', 'Return', 'Get', 'Store', 'Select',
  'Style', 'Widen', 'Call', 'Give', 'Declare', 'Narrow', 'Drop', 'Type', 'Wrap', 'Write', 'Do', 'Treat', 'Ignore',
  'Read', 'Find', 'Dispatch', 'Change', 'Load', 'Create', 'Open', 'Review', 'Test', 'Choose', 'Put', 'Run', 'Turn']);

/**
 * A first sentence that only says something was removed.
 */
const ONLY_REMOVED = /^(?:Removed|No replacement|Nothing replaces|.* (?:was|is|are|were) removed)\b.*[.]$/;

/**
 * Check the first sentence a TODO would keep from a text.
 *
 * @param {string} text The advice or message of a rule.
 * @param {boolean} [needsVerb] Whether the sentence must also start with an action verb. A message that code builds
 * ("x is set here") only has to avoid the bare statement that something was removed.
 * @returns {string|null} The problem, or `null` when the sentence tells the user what to do.
 */
function problemOf(text, needsVerb = true) {
  const first = shortenAdvice(text).replace(/^\S+: (?=[A-Z])/, '');
  const verb = /^[A-Za-z]+/.exec(first)?.[0] ?? '';
  const sentence = /^.*?[.!?](?=\s|$)/s.exec(first)?.[0] ?? first;

  if (ONLY_REMOVED.test(sentence) && !ACTION.has(/^[A-Za-z]+/.exec(sentence)?.[0] ?? '')) {
    return `only says something was removed: "${sentence}"`;
  }

  return !needsVerb || ACTION.has(verb) ? null : `does not start with an action: "${first}"`;
}

/**
 * The advice-like texts of a rule that can end up in a TODO comment, with the field each one is in. A `note` is a
 * run-wide remark, not a TODO, and a `dependency` rule edits `package.json`, which holds no comments.
 *
 * @param {object} rule A rule of a manifest.
 * @returns {Array<[string, string]>} Pairs of field and text.
 */
function todoTexts(rule) {
  if (rule.kind === 'dependency') {
    return [];
  }

  // The lead of a kept method call is built in code ("Remove x() by hand."), so a methodRemove message only explains.
  const found = [['advice', rule.advice], ['message', rule.kind === 'methodRemove' ? null : rule.message],
    ['noKeyAdvice', rule.noKeyAdvice], ['fallback.advice', rule.fallback?.advice]];

  Object.entries(rule.exports ?? {}).forEach(([name, entry]) => found.push([`exports.${name}.advice`, entry.advice]));

  return found.filter(([, text]) => typeof text === 'string' && text.trim() !== '');
}

describe('the first sentence of every TODO text', () => {
  it('tells the user what to do, for every rule that can leave a TODO', async() => {
    const manifests = await loadManifests(VERSIONS_DIR);
    const problems = [];

    for (const manifest of manifests) {
      for (const rule of manifest.rules) {
        for (const [field, text] of todoTexts(rule)) {
          const problem = problemOf(text);

          if (problem) {
            problems.push(`${rule.id} ${field} ${problem}`);
          }
        }
      }
    }

    assert.deepEqual(problems, []);
  });

  it('is an action in every TODO comment of the fixture outputs', async() => {
    const problems = [];
    const comment = /TODO\(handsontable-codemod ([^)]*)\): (.*?)(?: See https:\/\/\S+)?(?:\s*\*\/|\s*\}|$)/;

    for (const version of await readdir(VERSIONS_DIR)) {
      const root = join(VERSIONS_DIR, version, '__fixtures__');
      const names = await readdir(root).catch(() => []);

      for (const name of names) {
        for (const file of await readdir(join(root, name))) {
          if (!file.startsWith('output.')) {
            continue;
          }

          const text = await readFile(join(root, name, file), 'utf8');

          for (const line of text.split('\n')) {
            const match = comment.exec(line);
            const problem = match ? problemOf(match[2], false) : null;

            if (problem) {
              problems.push(`${version}/${name}/${file} ${match[1]} ${problem}`);
            }
          }
        }
      }
    }

    assert.deepEqual(problems, []);
  });

  it('flags a first sentence that only says something was removed', () => {
    assert.match(problemOf('Removed in 18.0 with no replacement. Use the inline type.'),
      /only says something was removed/);
    assert.match(problemOf('The correctFormat option was removed in 18.0.'), /only says something was removed/);
    assert.equal(problemOf('Use `{ row: number; col: number }` instead of SimpleCellCoords, which 18.0 removed.'),
      null);
    assert.equal(problemOf('Deleted correctFormat here. Use valueParser to normalize entered values.'), null);
  });
});
