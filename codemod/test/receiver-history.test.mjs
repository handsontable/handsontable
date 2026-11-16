import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests();

/**
 * A rule that rewrites on a receiver, with the code that gives it a receiver of the right kind and of a wrong
 * kind, the call it rewrites, and a check on the printed text.
 *
 * @typedef {object} Setup
 * @property {string} name What the rule does.
 * @property {string[]} only Rule ids.
 * @property {string} [version] The manifest the rules are in. The default is 18.0.0.
 * @property {string} head Statements before the history.
 * @property {string} good An expression that is the receiver the rule needs.
 * @property {string} foreign An expression that is not.
 * @property {(receiver: string) => string} use The call the rule rewrites.
 * @property {(output: string) => boolean} rewritten Whether the output shows the rewrite.
 * @property {boolean} [typed] The rule needs a grid instance, so a `Handsontable` annotation counts.
 * @property {(label: string) => boolean} [follows] Whether the rule follows a receiver of that history at all.
 * The default is every history. A history it does not follow is expected to stay as it is.
 */

const GRID_HEAD = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\n';

const THEME_HISTORIES = new Set([
  'const',
  'let with an initializer',
  'var',
  'assigned twice with the good value',
  'var hoisted out of a block',
  'read in a closure',
  'reset to null after use',
  'reset to undefined after use',
  'reset to void 0 after use',
  'reset to null in a closure',
  'null initializer, then qualifying assignment',
  'undefined initializer, then qualifying assignment',
]);

/**
 * @type {Setup[]}
 */
const SETUPS = [
  {
    name: 'a method move on an instance',
    only: ['18.0.0/core-undo-methods'],
    head: GRID_HEAD,
    good: 'new Handsontable(el, {})',
    foreign: 'makeEditor()',
    use: receiver => `${receiver}.undo();`,
    rewritten: output => output.includes('.getPlugin(\'undoRedo\').undo()'),
    typed: true,
  },
  {
    name: 'a method removal on a plugin',
    only: ['18.0.0/resize-state-methods'],
    head: GRID_HEAD,
    good: 'hot.getPlugin(\'manualColumnResize\')',
    foreign: 'new ServerWidthStore()',
    use: receiver => `${receiver}.saveManualColumnWidths();`,
    rewritten: output => !output.includes('saveManualColumnWidths'),
  },
  {
    name: 'an option rename in the argument of a plugin call',
    only: ['18.0.0/export-column-headers'],
    head: GRID_HEAD,
    good: 'hot.getPlugin(\'exportFile\')',
    foreign: 'makeExporter()',
    use: receiver => `${receiver}.downloadFile('csv', { columnHeaders: true });`,
    rewritten: output => output.includes('colHeaders: true') && !output.includes('columnHeaders: true'),
  },
  {
    name: 'an option removal in the object of setCellMetaObject',
    only: ['18.0.0/correct-format-removed'],
    head: GRID_HEAD,
    good: 'new Handsontable(el, {})',
    foreign: 'makeEditor()',
    use: receiver => `${receiver}.setCellMetaObject(0, 0, { correctFormat: true });`,
    rewritten: output => !output.includes('correctFormat: true'),
    typed: true,
  },
  {
    name: 'a theme token rename on the result of registerTheme',
    only: ['18.0.0/theme-token-wrapper-border-radius'],
    head: 'import { registerTheme, mainTheme } from \'handsontable/themes\';\n',
    good: 'registerTheme(\'t\', mainTheme)',
    foreign: 'makeTheme()',
    use: receiver => `${receiver}.params({ tokens: { wrapperBorderRadius: 1 } });`,
    rewritten: output => !output.includes('wrapperBorderRadius'),
    // A theme variable is a declarator with an initializer, one hop. An assignment and a `this` member are not followed.
    follows: label => THEME_HISTORIES.has(label),
  },
];

const TWINS = [
  {
    name: 'a method removal on a plugin, 19.0',
    version: '19.0.0',
    only: ['19.0.0/resize-state-methods'],
    head: GRID_HEAD,
    good: 'hot.getPlugin(\'manualRowResize\')',
    foreign: 'new ServerHeightStore()',
    use: receiver => `${receiver}.loadManualRowHeights();`,
    rewritten: output => !output.includes('loadManualRowHeights'),
  },
  {
    name: 'a method removal on the formulas plugin, 19.0',
    version: '19.0.0',
    only: ['19.0.0/formulas-shortcut-methods'],
    head: GRID_HEAD,
    good: 'hot.getPlugin(\'formulas\')',
    foreign: 'makeFormulas()',
    use: receiver => `${receiver}.registerShortcuts();`,
    rewritten: output => !output.includes('registerShortcuts'),
  },
  {
    name: 'an option rename in the argument of a plugin call, 19.0',
    version: '19.0.0',
    only: ['19.0.0/export-column-headers'],
    head: GRID_HEAD,
    good: 'hot.getPlugin(\'exportFile\')',
    foreign: 'makeExporter()',
    use: receiver => `${receiver}.exportAsString('csv', { columnHeaders: true });`,
    rewritten: output => output.includes('colHeaders: true') && !output.includes('columnHeaders: true'),
  },
];

/**
 * Histories of a variable named `r`. `rewrite` ones show the receiver on every path, so the rule must act.
 * The others hold a foreign value on some path, or a value the file does not show, so it must not.
 * `V` is the good value, `F` the foreign one, and `USE(x)` the call.
 */
const VARIABLE_HISTORIES = [
  ['const', 'const r = V; USE(r);', true],
  ['let with an initializer', 'let r = V; USE(r);', true],
  ['var', 'var r = V; USE(r);', true],
  ['declared, then assigned', 'let r; r = V; USE(r);', true],
  ['assigned in both branches', 'let r; if (c) { r = V; } else { r = V; } USE(r);', true],
  ['assigned twice with the good value', 'let r = V; r = V; USE(r);', true],
  ['var hoisted out of a block', '{ var r = V; } USE(r);', true],
  ['read in a closure', 'const r = V; const f = () => { USE(r); };', true],
  ['null initializer, then qualifying assignment', 'let r = null; r = V; USE(r);', true],
  ['undefined initializer, then qualifying assignment', 'let r = undefined; if (c) { r = V; } USE(r);', true],
  ['reset to null after use', 'let r = V; USE(r); r = null;', true],
  ['reset to undefined after use', 'let r = V; USE(r); r = undefined;', true],
  ['reset to void 0 after use', 'let r = V; USE(r); r = void 0;', true],
  ['reset to null in a closure', 'let r = V; const reset = () => { r = null; }; USE(r);', true],
  ['only null', 'let r = null; USE(r);', false],
  ['null, then foreign', 'let r = null; r = F; USE(r);', false],
  ['qualifying, null, then foreign', 'let r = V; r = null; r = F; USE(r);', false],
  ['qualifying, then foreign in a branch', 'let r = V; if (c) { r = F; } USE(r);', false],
  ['foreign, then qualifying in a branch', 'let r = F; if (c) { r = V; } USE(r);', false],
  ['qualifying, then foreign', 'let r = V; r = F; USE(r);', false],
  ['foreign only', 'const r = F; USE(r);', false],
  ['declared and never set', 'let r; USE(r);', false],
  ['logical assignment of a foreign value', 'let r = V; r ||= F; USE(r);', false],
  ['nullish assignment of a foreign value', 'let r = V; r ??= F; USE(r);', false],
  ['compound assignment', 'let r = V; r += 1; USE(r);', false],
  ['update', 'let r = V; r++; USE(r);', false],
  ['array destructuring assignment', 'let r = V; [r] = list; USE(r);', false],
  ['object destructuring assignment', 'let r = V; ({ r } = bag); USE(r);', false],
  ['nested destructuring assignment', 'let r = V; ({ a: [r] } = bag); USE(r);', false],
  ['for of head', 'let r = V; for (r of list) {} USE(r);', false],
  ['for in head', 'let r = V; for (r in bag) {} USE(r);', false],
  ['for of declaration head', 'for (const r of list) { USE(r); }', false],
  ['reassigned in a closure', 'let r = V; const reset = () => { r = F; }; USE(r);', false],
  ['reassigned in a function declaration', 'let r = V; function reset() { r = F; } USE(r);', false],
  ['reassigned in a loop', 'let r = V; while (c) { r = F; } USE(r);', false],
  ['redeclared var', 'var r = V; var r = F; USE(r);', false],
  ['redeclared var in a block', 'var r = F; { var r = V; } USE(r);', false],
  ['parameter', 'function f(r) { USE(r); }', false],
  ['parameter assigned the good value', 'function f(r) { r = V; USE(r); }', false],
  ['parameter default', 'const f = (r = V) => { USE(r); };', false],
  ['catch parameter', 'try { run(); } catch (r) { USE(r); }', false],
  ['destructured declaration', 'const { r } = bag; USE(r);', false],
  ['array destructured declaration', 'const [r] = [V]; USE(r);', false],
  ['shadowed in a function', 'const r = V; function f() { const r = F; USE(r); }', false],
  ['shadowed by a parameter', 'const r = V; function f(r) { USE(r); }', false],
  ['shadowed in a method', 'const r = V; class K { m() { const r = F; USE(r); } }', false],
  ['shadowed in a namespace', 'const r = V; namespace N { var r = F; USE(r); }', false],
  ['shadowed in a static block', 'const r = V; class K { static { var r = F; USE(r); } }', false],
  ['shadowed in a block', 'const r = V; { const r = F; USE(r); }', false],
];

/**
 * Histories of a member `r` of a class. `USE(this.r)` is the call.
 */
const MEMBER_HISTORIES = [
  ['property initializer', 'class A { r = V; m() { USE(this.r); } }', true],
  ['assigned in a method', 'class A { m() { this.r = V; USE(this.r); } }', true],
  ['declared, assigned in the constructor', 'class A { r; constructor() { this.r = V; } m() { USE(this.r); } }', true],
  ['read in an arrow function', 'class A { r = V; m() { const f = () => { USE(this.r); }; } }', true],
  ['read in a callback arrow', 'class A { r = V; m() { return [1].map(() => { USE(this.r); }); } }', true],
  ['static member in a static method', 'class A { static r = V; static m() { USE(this.r); } }', true],
  ['assigned the good value twice', 'class A { r = V; m() { this.r = V; USE(this.r); } }', true],
  ['reset to null in a teardown', 'class A { r = V; m() { USE(this.r); } destroy() { this.r = null; } }', true],
  ['reset to undefined in teardown', 'class A { r = V; m() { USE(this.r); } destroy() { this.r = undefined; } }', true],
  ['null initializer, set in a method', 'class A { r = null; init() { this.r = V; } m() { USE(this.r); } }', true],
  ['only null', 'class A { r = null; m() { USE(this.r); } }', false],
  ['null, then foreign', 'class A { r = null; init() { this.r = F; } m() { USE(this.r); } }', false],
  ['assigned a foreign value in a method', 'class A { r = V; m() { this.r = F; } n() { USE(this.r); } }', false],
  ['assigned a foreign value in a branch', 'class A { r = V; m() { if (c) this.r = F; } n() { USE(this.r); } }', false],
  ['foreign initializer, qualifying assignment', 'class A { r = F; m() { this.r = V; USE(this.r); } }', false],
  ['foreign initializer only', 'class A { r = F; m() { USE(this.r); } }', false],
  ['never set', 'class A { m() { USE(this.r); } }', false],
  ['this of an object method', 'class A { r = V; o = { r: F, run() { USE(this.r); } }; }', false],
  ['this of a nested function', 'class A { r = V; m() { function cb() { USE(this.r); } } }', false],
  ['this of a function expression', 'class A { r = V; m() { const f = function() { USE(this.r); }; } }', false],
  ['this of an object getter', 'class A { r = V; m() { const o = { get x() { return USE(this.r); } }; } }', false],
  ['this of a nested class', 'class A { r = V; B = class { m() { USE(this.r); } }; }', false],
  ['static member read through an instance this', 'class A { static r = V; m() { USE(this.r); } }', false],
  ['instance member read through a static this', 'class A { r = V; static m() { USE(this.r); } }', false],
  ['destructuring assignment', 'class A { r = V; m() { [this.r] = [F]; } n() { USE(this.r); } }', false],
  ['object destructuring assignment', 'class A { r = V; m() { ({ a: this.r } = o); } n() { USE(this.r); } }', false],
  ['compound assignment', 'class A { r = V; m() { this.r += 1; } n() { USE(this.r); } }', false],
  ['logical assignment', 'class A { r = V; m() { this.r ||= F; } n() { USE(this.r); } }', false],
  ['update', 'class A { r = V; m() { this.r++; } n() { USE(this.r); } }', false],
  ['for of head', 'class A { r = V; m() { for (this.r of list) {} } n() { USE(this.r); } }', false],
  ['computed assignment', 'class A { r = V; m(k) { this[k] = F; } n() { USE(this.r); } }', false],
  ['Object.assign on this', 'class A { r = V; m() { Object.assign(this, other); } n() { USE(this.r); } }', false],
  ['accessor of the same name', 'class A { r = V; get r() { return F; } n() { USE(this.r); } }', false],
  ['method of the same name', 'class A { r = V; r() {} n() { USE(this.r); } }', false],
  ['untyped parameter property', 'class A { constructor(public r) {} m() { USE(this.r); } }', false],
  ['computed class property', 'class A { r = V; [k] = 1; m() { USE(this.r); } }', false],
];

/**
 * Histories that need a grid instance, so a type annotation says it.
 */
const TYPED_HISTORIES = [
  ['annotated variable', 'let r: Handsontable; USE(r);', true],
  ['annotated parameter', 'function f(r: Handsontable) { USE(r); }', true],
  ['annotated property', 'class A { r: Handsontable; m() { USE(this.r); } }', true],
  ['annotated parameter property', 'class A { constructor(private r: Handsontable) {} m() { USE(this.r); } }', true],
  ['parameter of another type', 'function f(r: Editor) { USE(r); }', false],
];

/**
 * Run a history through a setup.
 *
 * @param {Setup} setup The rule.
 * @param {string} template The history.
 * @returns {Promise<{rewrote: boolean, output: string}>} Whether a `changed` entry exists and the check passes.
 */
async function rewriteOf(setup, template) {
  const receiver = template.includes('this.r') ? 'this.r' : 'r';
  const body = template.replace(/USE\((?:this\.)?r\)/g, () => setup.use(receiver).replace(/;$/, ''))
    .replace(/\bV\b/g, setup.good).replace(/\bF\b/g, setup.foreign);
  const source = `${setup.head}${body}\n`;
  const plan = buildPlan(manifests.filter(manifest => manifest.version === (setup.version ?? '18.0.0')), setup.only);
  const { output, entries } = await transformFile({ filePath: 'a.ts', source, plan, options: { markers: false } });

  return { rewrote: entries.some(entry => entry.severity === 'changed') && setup.rewritten(output), output, source };
}

describe('a receiver counts only when every value it can hold qualifies', () => {
  for (const setup of [...SETUPS, ...TWINS]) {
    describe(setup.name, () => {
      const histories = [...VARIABLE_HISTORIES, ...MEMBER_HISTORIES, ...(setup.typed ? TYPED_HISTORIES : [])];

      for (const [label, template, expected] of histories) {
        // Typed histories speak of a grid instance, so a plugin or theme receiver never takes them.
        const rewrites = expected && (setup.follows?.(label) ?? true);

        it(`${rewrites ? 'rewrites' : 'never rewrites'}: ${label}`, async() => {
          const { rewrote, output } = await rewriteOf(setup, template);

          assert.equal(rewrote, rewrites, output);
        });
      }
    });
  }
});
