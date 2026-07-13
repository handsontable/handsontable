import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const codeCssPath = fileURLToPath(new URL('../../styles/components/code.css', import.meta.url));
const codeCssSource = readFileSync(codeCssPath, 'utf8');

function extractRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rulePattern = new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]+)\\}`);
  const match = codeCssSource.match(rulePattern);

  assert.ok(match?.groups?.body, `Expected ${selector} rule to exist`);

  return match.groups.body;
}

test('light theme gives the code-block copy button a distinct resting surface', () => {
  const lightCopyButtonRule = extractRule(":root[data-theme='light'] .expressive-code .copy button");

  assert.match(lightCopyButtonRule, /background-color:\s*var\(--sl-color-gray-5\);/);
  assert.match(lightCopyButtonRule, /border-color:\s*var\(--sl-color-gray-4\);/);
});

test('light theme gives the code-block copy button a distinct hover surface', () => {
  const lightCopyButtonHoverRule = extractRule(":root[data-theme='light'] .expressive-code .copy button:hover");

  assert.match(lightCopyButtonHoverRule, /background-color:\s*var\(--sl-color-gray-6\);/);
  assert.match(lightCopyButtonHoverRule, /border-color:\s*var\(--sl-color-gray-3\);/);
});

test('copied code-block copy button stays visible after pointer leaves', () => {
  const copiedRule = extractRule('.expressive-code .copy button.copied');

  assert.match(copiedRule, /opacity:\s*1;/);
});
