import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const codeCss = readFileSync(join(__dirname, '../../styles/components/code.css'), 'utf8');
const expressiveCodeBlock = codeCss.slice(
  codeCss.indexOf('.expressive-code {'),
  codeCss.indexOf('\n}\n\n.expressive-code figure.frame')
);

test('Expressive Code uses the current inline padding variable to avoid false scrollbars', () => {
  assert.match(
    expressiveCodeBlock,
    /--ec-codePaddingInline:\s*(?:0\.85|1)rem;/,
    'code blocks must reduce Expressive Code inline padding with --ec-codePaddingInline'
  );
});

test('Expressive Code padding override does not use the obsolete shorthand variable', () => {
  assert.doesNotMatch(
    expressiveCodeBlock,
    /--ec-codePadInl:/,
    '--ec-codePadInl is not used by the installed Expressive Code version'
  );
});
