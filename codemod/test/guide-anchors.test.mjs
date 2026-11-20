import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadManifests } from '../src/manifest.mjs';
import { anchorListOf, headingTextOf, slugOf } from './helpers/guide-anchors.mjs';

const DIR = fileURLToPath(new URL('./helpers/site-anchors/', import.meta.url));
const fixtures = await Promise.all((await readdir(DIR)).filter(name => name.endsWith('.json')).sort()
  .map(async name => JSON.parse(await readFile(join(DIR, name), 'utf8'))));

describe('slugOf() gives the ids the built docs site gave', () => {
  it('has a fixture for every migration guide of the package', async() => {
    const pages = (await loadManifests()).map(manifest => manifest.guide.source.split('/').pop()
      .replace('.md', '').replace('migrating-', 'migration-'));

    assert.deepEqual(fixtures.map(item => item.page).sort(), [...pages].sort());
  });

  for (const fixture of fixtures) {
    it(`${fixture.page}: every heading, ${fixture.headings.length} of them`, () => {
      const markdown = fixture.headings.map(heading => `${'#'.repeat(heading.level)} ${heading.markdown}`).join('\n');
      const ids = anchorListOf(markdown);

      assert.equal(ids.length, fixture.headings.length);
      fixture.headings.forEach((heading, index) => {
        assert.equal(ids[index], heading.id, `"${heading.markdown}"`);
      });
    });
  }

  it('covers headings with inline tags, a double hyphen, a code span with a tag, and a repeated title', () => {
    const markdowns = fixtures.flatMap(item => item.headings.map(heading => heading.markdown));

    assert.ok(markdowns.some(text => /<kbd>/.test(text)), 'no heading with a tag');
    assert.ok(markdowns.some(text => /\w -- \w/.test(text)), 'no heading with a double hyphen');
    assert.ok(markdowns.some(text => /`[^`]*<[^`]*`/.test(text)), 'no code span with a tag');
    assert.ok(fixtures.some(item => item.headings.some(heading => /-\d+$/.test(heading.id))), 'no repeated title');
  });
});

describe('headingTextOf() and slugOf()', () => {
  it('drops a tag and keeps its text, outside a code span only', () => {
    assert.equal(headingTextOf('<kbd>**Cmd**</kbd> click'), '**Cmd** click');
    assert.equal(headingTextOf('Icons are `<i>` elements'), 'Icons are <i> elements');
  });

  it('turns a double hyphen into nothing a slug keeps, outside a code span only', () => {
    assert.equal(slugOf('A -- b'), 'a--b');
    assert.equal(slugOf('A `--b` c'), 'a---b-c');
    assert.equal(slugOf('How-to guide'), 'how-to-guide');
  });

  it('keeps a long anchor with a slash between two tags', () => {
    assert.equal(slugOf('<kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click on a selected cell'),
      'cmdctrl--click-on-a-selected-cell');
  });
});

describe('the anchors of the manifests are ids of the built site', () => {
  it('every rule and every notAutomated section of every manifest names a heading id of its guide', async(context) => {
    for (const manifest of await loadManifests()) {
      const page = manifest.guide.source.split('/').pop().replace('.md', '').replace('migrating-', 'migration-');
      const fixture = fixtures.find(item => item.page === page);
      const ids = new Set(fixture.headings.map(heading => heading.id));
      const missing = [
        ...manifest.rules.map(rule => ({ id: rule.id, guide: rule.guide })),
        ...(manifest.notAutomated ?? []).map(item => ({
          id: `notAutomated ${item.guide ?? item.title}`,
          guide: item.guide,
        })),
      ].filter(section => section.guide && !ids.has(section.guide));

      // The guide of a draft is edited by other people, and the fixture is a snapshot of it: a missing anchor is a
      // diagnostic there, as in manifest.test.mjs, and fails for a released guide.
      if (manifest.status === 'draft') {
        missing.forEach(({ id, guide }) => context.diagnostic(`draft ${manifest.version}: ${id} anchor "${guide}"`));
      } else {
        assert.deepEqual(missing, [], `${manifest.version}: anchors that are not ids of the site`);
      }
    }
  });

  it('the two rows of the 19.0 draft that name a key with tags in the heading use the id of the site', async() => {
    const draft = (await loadManifests()).find(manifest => manifest.version === '19.0.0');
    const anchors = (draft.notAutomated ?? []).map(item => item.guide);

    assert.ok(anchors.includes('cmdctrl--click-on-a-selected-cell-moves-the-highlight'));
    assert.ok(anchors.includes('cmdctrl--arrow-keys-on-a-row-header-expand-and-collapse-row-groups'));
    assert.equal(anchors.filter(anchor => /kbd/.test(anchor ?? '')).length, 0, 'a tag name leaked into an anchor');
  });
});
