import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Headings of a Markdown text that start with `# ` or `## `, outside fenced code blocks.
 *
 * @param {string} text The Markdown text.
 * @returns {Array<{level: number, title: string, line: number}>} The headings in document order.
 */
function headingsOf(text) {
  const found = [];
  let fence = null;

  text.split('\n').forEach((line, index) => {
    const opening = /^\s*(`{3,}|~{3,})/.exec(line);

    if (opening) {
      if (fence === null) {
        fence = opening[1][0];
      } else if (opening[1][0] === fence) {
        fence = null;
      }

      return;
    }

    if (fence !== null) {
      return;
    }

    const heading = /^(#{1,2}) (.+?)\s*$/.exec(line);

    if (heading) {
      found.push({ level: heading[1].length, title: heading[2], line: index + 1 });
    }
  });

  return found;
}

/**
 * The problems of a document that was spliced into itself: a title that stands twice, or a `## ` heading that repeats.
 *
 * @param {string} text The Markdown text.
 * @returns {string[]} One sentence per repeated heading, empty for a sound document.
 */
function repeatedHeadings(text) {
  const seen = new Map();
  const problems = [];

  for (const { level, title, line } of headingsOf(text)) {
    const key = `${level}:${title}`;

    if (seen.has(key)) {
      problems.push(`"${'#'.repeat(level)} ${title}" stands on line ${seen.get(key)} and on line ${line}`);
    } else {
      seen.set(key, line);
    }
  }

  return problems;
}

/**
 * How many times the text of the first title occurs anywhere, also in the middle of a line. A splice that cuts a
 * sentence leaves the second title behind other text, where no line starts with `# `.
 *
 * @param {string} text The Markdown text.
 * @returns {number} The number of occurrences.
 */
function titleTextCount(text) {
  const [first] = headingsOf(text);

  return first ? text.split(`# ${first.title}`).length - 1 : 0;
}

describe('the Markdown files of the package', () => {
  for (const name of ['AGENTS.md', 'README.md']) {
    it(`${name} has one title and no repeated section heading`, async() => {
      const text = await readFile(join(PACKAGE_ROOT, name), 'utf8');
      const titles = headingsOf(text).filter(heading => heading.level === 1);

      assert.equal(titles.length, 1, `${name} has ${titles.length} titles`);
      assert.equal(titleTextCount(text), 1, `${name} holds its title text more than once`);
      assert.deepEqual(repeatedHeadings(text), []);
    });
  }

  it('does not count a heading inside a code block', () => {
    const text = ['# Title', '', '## Part', '', '```md', '## Part', '```', ''].join('\n');

    assert.deepEqual(repeatedHeadings(text), []);
  });

  it('finds a title that was spliced into the middle of a line', () => {
    const text = ['# Title', '', 'A sentence that is cut# Title', '', '## Part', ''].join('\n');

    assert.equal(headingsOf(text).filter(heading => heading.level === 1).length, 1);
    assert.equal(titleTextCount(text), 2);
  });

  it('finds a document that restarts from its title', () => {
    const body = ['# Title', '', '## Commands', 'text', '', '## Layout', 'text', ''].join('\n');
    const spliced = `${body}${body}`;

    assert.equal(headingsOf(spliced).filter(heading => heading.level === 1).length, 2);
    assert.equal(repeatedHeadings(spliced).length, 3);
  });
});
