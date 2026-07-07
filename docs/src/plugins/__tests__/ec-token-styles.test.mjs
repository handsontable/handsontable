import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EC_TOKEN_STYLE_CLASSES,
  internEcTokenStyles,
  buildEcTokenClassesCss,
} from '../ec-token-styles.mjs';

const cssPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../styles/ec-token-classes.css'
);

test('ec-token-classes.css is in sync with EC_TOKEN_STYLE_CLASSES', () => {
  assert.equal(
    readFileSync(cssPath, 'utf8'),
    buildEcTokenClassesCss(),
    'src/styles/ec-token-classes.css is stale — regenerate it with the command documented in src/plugins/ec-token-styles.mjs'
  );
});

test('every class has exactly one set of declarations', () => {
  const declarationsByClass = new Map();

  for (const [styleValue, className] of EC_TOKEN_STYLE_CLASSES) {
    const normalized = styleValue.toLowerCase();
    const existing = declarationsByClass.get(className);

    if (existing !== undefined) {
      assert.equal(
        normalized,
        existing,
        `class ${className} maps to conflicting declarations`
      );
    }

    declarationsByClass.set(className, normalized);
  }
});

test('known token styles are replaced with classes', () => {
  const html = '<span style="--0:#F97583;--1:#BF3441">const</span>';

  assert.equal(
    internEcTokenStyles(html),
    '<span class="hot-tk-2">const</span>'
  );
});

test('lowercase hex variant shares the class of its uppercase twin', () => {
  const html = '<span style="--0:#e1e4e8;--1:#24292e">x</span>';

  assert.equal(internEcTokenStyles(html), '<span class="hot-tk-0">x</span>');
});

test('unknown token styles stay inline and are reported once per value', () => {
  const html =
    '<span style="--0:#FFFFFF;--1:#000000">a</span>' +
    '<span style="--0:#FFFFFF;--1:#000000">b</span>';
  const reported = [];

  const result = internEcTokenStyles(html, (styleValue) => reported.push(styleValue));

  assert.equal(result, html);
  assert.deepEqual(reported, ['--0:#FFFFFF;--1:#000000']);
});

test('non-token style attributes are left untouched', () => {
  const html =
    '<div style="width:100%; height: 500px;"></div>' +
    '<span class="frame" style="--0:#F97583;--1:#BF3441">kept</span>';

  assert.equal(internEcTokenStyles(html), html);
});
