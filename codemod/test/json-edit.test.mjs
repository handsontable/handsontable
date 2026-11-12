import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jsonAdapter from '../src/adapters/json.mjs';
import { JsonDocument, memberPosition, scanJson } from '../src/lib/json-edit.mjs';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

/**
 * Open a document the way the adapter does.
 *
 * @param {string} text File text.
 * @returns {JsonDocument} The document.
 */
function open(text) {
  return new JsonDocument(text, JSON.parse(text));
}

describe('scanJson', () => {
  it('finds the offsets of members, strings with escapes, and nested values', () => {
    const text = '{ "a\\"b": "x\\\\", "c": [1, {"d": 2}], "e": { "f": null } }';
    const root = scanJson(text);

    assert.deepEqual(root.members.map(member => member.key), ['a"b', 'c', 'e']);
    assert.equal(text.slice(root.members[0].value.start, root.members[0].value.end), '"x\\\\"');
    assert.equal(text.slice(root.members[1].value.start, root.members[1].value.end), '[1, {"d": 2}]');
    assert.equal(root.members[2].value.members[0].key, 'f');
  });

  it('gives null for text that is not one clean value', () => {
    assert.equal(scanJson('{"a": 1} x'), null);
    assert.equal(scanJson('{"a" 1}'), null);
  });
});

describe('memberPosition', () => {
  it('keeps alphabetical order when the keys are sorted and appends otherwise', () => {
    assert.equal(memberPosition(['a', 'c'], 'b'), 1);
    assert.equal(memberPosition(['a', 'c'], 'd'), 2);
    assert.equal(memberPosition(['b', 'a'], 'c'), 2);
    assert.equal(memberPosition([], 'a'), 0);
  });
});

describe('JsonDocument.setString', () => {
  it('changes only the value and keeps every other byte', () => {
    const text = '{\n  "name": "Jos\\u00e9",\n  "homepage": "https:\\/\\/x.y",\n  "version": 1.0,\n'
      + '  "big": 12345678901234567890,\n  "exp": 1e3,\n  "dependencies": {\n    "handsontable": "^17.1.0",\n'
      + '    "other": "1"\n  }\n}\n';
    const document = open(text);

    assert.equal(document.setString('dependencies', 'handsontable', '^18.1.0'), true);
    assert.equal(document.text, text.replace('^17.1.0', '^18.1.0'));
    assert.equal(document.model.dependencies.handsontable, '^18.1.0');
  });

  it('edits the entry that JSON.parse keeps when a section key is repeated', () => {
    const text = '{"dependencies": {"handsontable": "^16.0.0"}, "dependencies": {"handsontable": "^17.1.0"}}';
    const document = open(text);

    assert.equal(document.setString('dependencies', 'handsontable', '^18.1.0'), true);
    assert.equal(document.text, '{"dependencies": {"handsontable": "^16.0.0"}, "dependencies": '
      + '{"handsontable": "^18.1.0"}}');
  });

  it('refuses a missing entry and a value that is not a string, and changes nothing', () => {
    const text = '{"dependencies": {"handsontable": 1}}';
    const document = open(text);

    assert.equal(document.setString('dependencies', 'handsontable', '^18.1.0'), false);
    assert.equal(document.setString('dependencies', 'other', '^18.1.0'), false);
    assert.equal(document.setString('devDependencies', 'handsontable', '^18.1.0'), false);
    assert.equal(document.text, text);
    assert.equal(document.model.dependencies.handsontable, 1);
  });
});

describe('JsonDocument.addMember', () => {
  it('adds one line in alphabetical order with the indentation of the section', () => {
    const text = '{\n    "dependencies": {\n        "a": "1",\n        "z": "1"\n    }\n}\n';
    const document = open(text);

    assert.equal(document.addMember('dependencies', 'hyperformula', '^3.0.0'), true);
    assert.equal(document.text,
      '{\n    "dependencies": {\n        "a": "1",\n        "hyperformula": "^3.0.0",\n        "z": "1"\n    }\n}\n');
    assert.deepEqual(Object.keys(document.model.dependencies), ['a', 'hyperformula', 'z']);
  });

  it('appends after the last member when the section is not sorted', () => {
    const text = '{\n  "dependencies": {\n    "z": "1",\n    "a": "1"\n  }\n}';
    const document = open(text);

    assert.equal(document.addMember('dependencies', 'hyperformula', '^3.0.0'), true);
    assert.equal(document.text,
      '{\n  "dependencies": {\n    "z": "1",\n    "a": "1",\n    "hyperformula": "^3.0.0"\n  }\n}');
  });

  it('keeps tabs and CRLF line endings', () => {
    const text = '{\r\n\t"dependencies": {\r\n\t\t"a": "1"\r\n\t}\r\n}\r\n';
    const document = open(text);

    assert.equal(document.addMember('dependencies', 'b', '2'), true);
    assert.equal(document.text, '{\r\n\t"dependencies": {\r\n\t\t"a": "1",\r\n\t\t"b": "2"\r\n\t}\r\n}\r\n');
  });

  it('keeps a minified one-line file on one line', () => {
    const text = '{"name":"x","dependencies":{"a":"1","c":"1"},"devDependencies":{"d":"1"}}';
    const document = open(text);

    assert.equal(document.addMember('dependencies', 'b', '2'), true);
    assert.equal(document.text, '{"name":"x","dependencies":{"a":"1","b":"2","c":"1"},"devDependencies":{"d":"1"}}');
  });

  it('fills an empty section and creates a missing one before devDependencies', () => {
    const empty = open('{\n  "dependencies": {},\n  "name": "x"\n}\n');
    const missing = open('{\n  "name": "x",\n  "devDependencies": {\n    "a": "1"\n  }\n}\n');
    const last = open('{\n  "name": "x"\n}\n');
    const tiny = open('{}');

    assert.equal(empty.addMember('dependencies', 'b', '2'), true);
    assert.equal(empty.text, '{\n  "dependencies": {\n    "b": "2"\n  },\n  "name": "x"\n}\n');
    assert.equal(missing.addMember('dependencies', 'b', '2'), true);
    assert.equal(missing.text, '{\n  "name": "x",\n  "dependencies": {\n    "b": "2"\n  },\n  "devDependencies": {\n'
      + '    "a": "1"\n  }\n}\n');
    assert.equal(last.addMember('dependencies', 'b', '2'), true);
    assert.equal(last.text, '{\n  "name": "x",\n  "dependencies": {\n    "b": "2"\n  }\n}\n');
    assert.equal(tiny.addMember('dependencies', 'b', '2'), true);
    assert.deepEqual(JSON.parse(tiny.text), { dependencies: { b: '2' } });
  });

  it('refuses when the scan and the parsed file disagree, and changes nothing', () => {
    const text = '{"dependencies": {"a": "1", "a": "2"}}';
    const document = open(text);

    assert.equal(document.addMember('dependencies', 'b', '3'), false);
    assert.equal(document.text, text);
    assert.deepEqual(document.model, { dependencies: { a: '2' } });
  });
});

describe('the dependency rules on a package.json', () => {
  /**
   * Run the 18.0.0 dependency rules over a package.json in phase 2 with the formulas fact set.
   *
   * @param {string} source File text.
   * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The result.
   */
  async function migrate(source) {
    const manifests = (await loadManifests()).filter(manifest => manifest.version === '18.0.0');
    const plan = buildPlan(manifests, ['18.0.0/dependenc*']);

    return transformFile({
      filePath: 'package.json',
      source,
      plan,
      phase: 2,
      facts: new Set(['uses-formulas', 'uses-formulas@.']),
    });
  }

  it('keeps every byte outside the edited values of a hand-formatted file', async() => {
    const source = '{\n  "name": "Jos\\u00e9",\n  "url": "https:\\/\\/x.y",\n  "ratio": 1.0,\n'
      + '  "big": 12345678901234567890,\n  "exp": 1e3,\n  "dependencies": {\n    "handsontable": "^17.1.0"\n  },\n'
      + '  "scripts": { "a": "b" }\n}\n';
    const { output, changed } = await migrate(source);

    assert.equal(changed, true);
    assert.equal(output, source.replace(
      '"handsontable": "^17.1.0"\n',
      '"handsontable": "^18.0.0",\n    "hyperformula": "^3.0.0"\n'
    ));
  });

  it('keeps a minified file minified', async() => {
    const { output } = await migrate('{"dependencies":{"handsontable":"^17.1.0"}}');

    assert.equal(output, '{"dependencies":{"handsontable":"^18.0.0","hyperformula":"^3.0.0"}}');
  });

  it('prints the file through the adapter without a parse and stringify round trip', () => {
    const source = '{"a":1.0,"dependencies":{"handsontable":"^17.1.0"}}';
    const handle = jsonAdapter.parse(source);

    assert.equal(jsonAdapter.print(handle, source), source);
  });
});
