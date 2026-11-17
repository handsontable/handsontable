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
 * @property {string} [otherPlugin] For a rule on a plugin: an expression that is another plugin of the same grid, which
 * is a plugin but not the one the rule needs.
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
    otherPlugin: 'hot.getPlugin(\'contextMenu\')',
    foreign: 'new ServerWidthStore()',
    use: receiver => `${receiver}.saveManualColumnWidths();`,
    rewritten: output => !output.includes('saveManualColumnWidths'),
  },
  {
    name: 'an option rename in the argument of a plugin call',
    only: ['18.0.0/export-column-headers'],
    head: GRID_HEAD,
    good: 'hot.getPlugin(\'exportFile\')',
    otherPlugin: 'hot.getPlugin(\'contextMenu\')',
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
    otherPlugin: 'hot.getPlugin(\'contextMenu\')',
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
    otherPlugin: 'hot.getPlugin(\'contextMenu\')',
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
    otherPlugin: 'hot.getPlugin(\'contextMenu\')',
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
  ['reset to a block-scoped undefined that holds a foreign value',
    'let r = V; { const undefined = F; r = undefined; } USE(r);', false],
  ['reset to an undefined that is a parameter', 'let r = V; function f(undefined) { r = undefined; } USE(r);', false],
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
  ['outside write of the good value', 'class A { r = V; m() { USE(this.r); } } const a = new A(); a.r = V;', true],
  ['null declared in an object literal elsewhere',
    'class A { r = null; init() { this.r = V; } m() { USE(this.r); } } const data = { r: null };', true],
  ['null declared in a field of another class',
    'class A { r = V; m() { USE(this.r); } } class C { r = null; r2 = undefined; }', true],
  ['outside write of null', 'class A { r = V; m() { USE(this.r); } } const a = new A(); a.r = null;', true],
  ['outside write of a foreign value', 'class A { r = V; m() { USE(this.r); } } const a = new A(); a.r = F;', false],
  ['outside write through a string key', 'class A { r = V; m() { USE(this.r); } } const a = new A(); a[\'r\'] = F;',
    false],
  ['outside write in a closure', 'class A { r = V; m() { USE(this.r); } } const set = a => { a.r = F; };', false],
  ['outside compound write', 'class A { r = V; m() { USE(this.r); } } const a = new A(); a.r += 1;', false],
  ['outside destructuring write', 'class A { r = V; m() { USE(this.r); } } const a = new A(); ({ r: a.r } = bag);',
    false],
  ['Object.assign of the good value', 'class A { r = V; m() { USE(this.r); } } Object.assign(new A(), { r: V });',
    true],
  ['Object.assign of a foreign value', 'class A { r = V; m() { USE(this.r); } } Object.assign(new A(), { r: F });',
    false],
  ['object literal key of a foreign value', 'class A { r = V; m() { USE(this.r); } } const o = { r: F };', false],
  ['object literal method of the name', 'class A { r = V; m() { USE(this.r); } } const o = { r() {} };', false],
  ['copy of the same member', 'class A { r = V; m() { USE(this.r); } } const o = { r: new A().r };', true],
  ['defineProperty of the name', 'class A { r = V; m() { USE(this.r); } } Object.defineProperty(a, \'r\', {});',
    false],
  ['field of another class', 'class A { r = V; m() { USE(this.r); } } class C { r = F; }', false],
  ['getter of another class', 'class A { r = V; m() { USE(this.r); } } class C { get r() { return F; } }', false],
  ['subclass that sets a foreign value',
    'class A { r = V; m() { USE(this.r); } } class B extends A { constructor() { super(); this.r = F; } }', false],
  ['subclass that sets the good value',
    'class A { r = V; m() { USE(this.r); } } class B extends A { constructor() { super(); this.r = V; } }', true],
  ['class with a base the file does not show, member set in the class',
    'class A extends Base { r = V; m() { USE(this.r); } }', true],
  ['class with a base the file does not show, member never set in the class',
    'class A extends Base { m() { USE(this.r); } }', false],
];

/**
 * Histories for a rule that needs one plugin, with a second plugin of the same grid (`P`) in the name. Both values are
 * plugins, but a name that can hold either is no receiver for the rule: every value must be the plugin it needs.
 */
const PLUGIN_HISTORIES = [
  ['the plugin, then another plugin in a branch', 'let r = V; if (c) { r = P; } USE(r);', false],
  ['another plugin, then the plugin', 'let r = P; r = V; USE(r);', false],
  ['the plugin, then another plugin in a closure', 'let r = V; const swap = () => { r = P; }; USE(r);', false],
  ['another plugin only', 'const r = P; USE(r);', false],
  ['the plugin on both paths', 'let r = V; if (c) { r = V; } USE(r);', true],
  ['a member set from the plugin and another plugin', 'class A { r = V; m() { this.r = P; } n() { USE(this.r); } }',
    false],
  ['a member set from another plugin only', 'class A { r = P; m() { USE(this.r); } }', false],
  ['a member set from the plugin on both paths', 'class A { r = V; m() { this.r = V; } n() { USE(this.r); } }', true],
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
 * Run a plan over the output of a first run twice more, and check that neither run changes the text: a spot that was
 * rewritten or reported stays as it is, with its marker.
 *
 * @param {object} plan The plan.
 * @param {string} output The text of the first run.
 * @param {object} options The options of the run.
 * @returns {Promise<void>}
 */
async function assertStable(plan, output, options) {
  const second = await transformFile({ filePath: 'a.ts', source: output, plan, options });
  const third = await transformFile({ filePath: 'a.ts', source: second.output, plan, options });

  assert.equal(second.output, output, 'run 2 changed the file');
  assert.equal(third.output, second.output, 'run 3 changed the file');
}

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
    .replace(/\bV\b/g, setup.good).replace(/\bF\b/g, setup.foreign)
    .replace(/\bP\b/g, setup.otherPlugin ?? 'P');
  const source = `${setup.head}${body}\n`;
  const plan = buildPlan(manifests.filter(manifest => manifest.version === (setup.version ?? '18.0.0')), setup.only);
  const options = { markers: true };
  const { output, entries } = await transformFile({ filePath: 'a.ts', source, plan, options });

  await assertStable(plan, output, options);

  return { rewrote: entries.some(entry => entry.severity === 'changed') && setup.rewritten(output), output, source };
}

describe('a receiver counts only when every value it can hold qualifies', () => {
  for (const setup of [...SETUPS, ...TWINS]) {
    describe(setup.name, () => {
      const histories = [...VARIABLE_HISTORIES, ...MEMBER_HISTORIES, ...(setup.typed ? TYPED_HISTORIES : []),
        ...(setup.otherPlugin ? PLUGIN_HISTORIES : [])];

      assert.equal(histories.length > 40, true, 'the histories of a setup were not collected');

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

/**
 * Run rules of the 18.0.0 manifest over a source text, with markers, and check that two more runs change nothing.
 *
 * @param {string[]} only Rule ids.
 * @param {string} source The source text.
 * @returns {Promise<{output: string, entries: object[]}>} The printed text and the report entries.
 */
async function runRules(only, source) {
  const plan = buildPlan(manifests.filter(manifest => manifest.version === '18.0.0'), only);
  const options = { markers: true };
  const first = await transformFile({ filePath: 'a.ts', source, plan, options });

  await assertStable(plan, first.output, options);

  return first;
}

/**
 * The three outcomes of one rule over one source: it rewrote, it reported only, or it said nothing.
 *
 * @param {string[]} only Rule ids.
 * @param {string} source The source text.
 * @returns {Promise<'rewrote'|'reported'|'silent'>} The outcome.
 */
async function outcomeOf(only, source) {
  const { entries } = await runRules(only, source);

  if (entries.some(entry => entry.severity === 'changed')) {
    return 'rewrote';
  }

  return entries.some(entry => entry.severity === 'manual') ? 'reported' : 'silent';
}

describe('.hotInstance counts as the grid only when the file defines no member of that name', () => {
  const only = ['18.0.0/core-undo-methods'];
  const head = 'import Handsontable from \'handsontable\';\n';
  const SHAPES = [
    ['a ref holder', 'const ref = useRef(null); ref.current.hotInstance.undo();', 'rewrote'],
    ['a Vue ref holder', 'const hotRef = ref(null); hotRef.value.hotInstance.undo();', 'rewrote'],
    ['a member of this, the Angular wrapper', 'class A { go() { this.hotTable.hotInstance.undo(); } }', 'rewrote'],
    ['a Vue refs member', 'class A { go() { this.$refs.hot.hotInstance.undo(); } }', 'rewrote'],
    ['a variable set from it', 'const inst = ref.current.hotInstance; inst.undo();', 'rewrote'],
    ['a write of a grid', 'holder.hotInstance = new Handsontable(el, {}); holder.hotInstance.undo();', 'rewrote'],
    ['a write of null', 'state.hotInstance = null; ref.current.hotInstance.undo();', 'rewrote'],
    ['a copy of it into a member',
      'class A { go() { this.hotInstance = this.$refs.hot.hotInstance; this.hotInstance.undo(); } }', 'rewrote'],
    ['a field typed as the grid', 'class A { hotInstance: Handsontable; go() { this.hotInstance.undo(); } }',
      'rewrote'],
    ['a write of an object', 'state.hotInstance = { undo() {} }; state.hotInstance.undo();', 'reported'],
    ['an object literal that declares it as null',
      'const state = { hotInstance: null }; ref.current.hotInstance.undo();', 'rewrote'],
    ['an object literal that declares it as undefined',
      'const state = { hotInstance: undefined }; ref.current.hotInstance.undo();', 'rewrote'],
    ['a Vue data function that declares null, set from the refs in a method',
      'export default { data() { return { hotInstance: null }; }, methods: { init() { '
      + 'this.hotInstance = this.$refs.hot.hotInstance; }, go() { this.hotInstance.undo(); } } };', 'rewrote'],
    ['a class field of null, set from a wrapper in a method',
      'class A { hotInstance = null; init() { this.hotInstance = this.hotTable.hotInstance; } '
      + 'go() { this.hotInstance.undo(); } }', 'rewrote'],
    ['a class field with no value, set from the grid',
      'class A { hotInstance; init() { this.hotInstance = new Handsontable(el, {}); } '
      + 'go() { this.hotInstance.undo(); } }', 'rewrote'],
    ['React useRef(null) and ref.current.hotInstance',
      'const A = () => { const ref = useRef(null); return () => ref.current.hotInstance.undo(); };', 'rewrote'],
    ['Angular @ViewChild and this.hotTable.hotInstance',
      'class A { @ViewChild(HotTableComponent, { static: false }) hotTable; go() { '
      + 'this.hotTable.hotInstance.undo(); } }', 'rewrote'],
    ['a Vue data function with a mock set later',
      'export default { data() { return { hotInstance: null }; }, methods: { init() { '
      + 'this.hotInstance = createMock(); }, go() { this.hotInstance.undo(); } } };', 'reported'],
    ['a declaration of null beside a write of an object',
      'const state = { hotInstance: null }; state.hotInstance = { undo() {} }; state.hotInstance.undo();', 'reported'],
    ['an object literal that declares it and a write of an object',
      'const state = { hotInstance: null }; state.hotInstance = { undo() {} }; state.hotInstance.undo();', 'reported'],
    ['an object literal that holds a call', 'const state = { hotInstance: makeEditor() }; state.hotInstance.undo();',
      'reported'],
    ['a write of a call', 'state.hotInstance = makeEditor(); state.hotInstance.undo();', 'reported'],
    ['a class field of another value', 'class A { hotInstance = makeEditor(); go() { this.hotInstance.undo(); } }',
      'reported'],
    ['a class field set to a call', 'class A { hotInstance = makeEditor(); go() { this.hotInstance.undo(); } }',
      'reported'],
    ['a method of that name', 'const api = { hotInstance() {} }; ref.current.hotInstance.undo();', 'reported'],
    ['a defineProperty', 'Object.defineProperty(state, \'hotInstance\', { value: 1 }); ref.current.hotInstance.undo();',
      'reported'],
  ];

  for (const [label, body, expected] of SHAPES) {
    it(`${expected}: ${label}`, async() => {
      assert.equal(await outcomeOf(only, `${head}${body}\n`), expected);
    });
  }
});

describe('a getPlugin() host counts as the grid only when the file shows an instance', () => {
  const head = 'import Handsontable from \'handsontable\';\nconst hot = new Handsontable(el, {});\n';
  const REMOVE = ['18.0.0/resize-state-methods'];
  const RENAME = ['18.0.0/export-column-headers'];
  const SHAPES = [
    ['an instance', 'hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths();', REMOVE, 'rewrote'],
    ['an instance, held in a variable',
      'const p = hot.getPlugin(\'manualColumnResize\'); p.saveManualColumnWidths();', REMOVE, 'rewrote'],
    // A parameter named `hot` is not shown to be a grid, as for `hot.undo()`: it is reported, not rewritten.
    ['a parameter named like a grid',
      'function f(hot2, grid) { grid.getPlugin(\'manualColumnResize\').saveManualColumnWidths(); }', REMOVE,
      'reported'],
    ['a this member named like a grid, in a class of an imported base',
      'class P extends Base { go() { this.hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths(); } }', REMOVE,
      'reported'],
    ['a this member that the class sets from the grid',
      'class P { constructor() { this.hot = new Handsontable(el, {}); } '
      + 'go() { this.hot.getPlugin(\'manualColumnResize\').saveManualColumnWidths(); } }', REMOVE, 'rewrote'],
    ['a wrapper holder',
      'ref.current.hotInstance.getPlugin(\'manualColumnResize\').saveManualColumnWidths();', REMOVE, 'rewrote'],
    ['a parameter that is not named like a grid',
      'function f(thing) { thing.getPlugin(\'manualColumnResize\').saveManualColumnWidths(); }', REMOVE, 'reported'],
    ['the result of a call', 'makeGrid().getPlugin(\'manualColumnResize\').saveManualColumnWidths();', REMOVE,
      'reported'],
    ['a global', 'store.getPlugin(\'manualColumnResize\').saveManualColumnWidths();', REMOVE, 'reported'],
    ['a variable set from a call on a global',
      'const p = store.getPlugin(\'manualColumnResize\'); p.saveManualColumnWidths();', REMOVE, 'reported'],
    ['a local object',
      'const fake = { getPlugin() { return {}; } }; fake.getPlugin(\'manualColumnResize\').saveManualColumnWidths();',
      REMOVE, 'silent'],
    ['a local object named like a grid',
      'const grid = { getPlugin() { return {}; } }; grid.getPlugin(\'manualColumnResize\').saveManualColumnWidths();',
      REMOVE, 'silent'],
    ['a local object, held in a variable',
      'const fake = { getPlugin() { return {}; } }; const p = fake.getPlugin(\'manualColumnResize\'); '
      + 'p.saveManualColumnWidths();', REMOVE, 'silent'],
    ['an instance of a local class',
      'class Fake { getPlugin() { return {}; } } new Fake().getPlugin(\'manualColumnResize\')'
      + '.saveManualColumnWidths();', REMOVE, 'reported'],
    ['a local class instance in a variable',
      'class Fake { getPlugin() { return {}; } } const fake = new Fake(); '
      + 'fake.getPlugin(\'manualColumnResize\').saveManualColumnWidths();', REMOVE, 'silent'],
    ['an import', 'import api from \'./api\'; api.getPlugin(\'manualColumnResize\').saveManualColumnWidths();', REMOVE,
      'silent'],
    ['a function', 'function make() {} make.getPlugin(\'manualColumnResize\').saveManualColumnWidths();', REMOVE,
      'silent'],
    ['a plugin of another key', 'hot.getPlugin(\'filters\').saveManualColumnWidths();', REMOVE, 'silent'],
    ['an instance, in the argument of a call',
      'hot.getPlugin(\'exportFile\').downloadFile(\'csv\', { columnHeaders: true });', RENAME, 'rewrote'],
    ['a local object, in the argument of a call',
      'const fake = { getPlugin() { return {}; } }; fake.getPlugin(\'exportFile\').downloadFile(\'csv\', '
      + '{ columnHeaders: true });', RENAME, 'silent'],
    ['a global, in the argument of a call',
      'thing.getPlugin(\'exportFile\').downloadFile(\'csv\', { columnHeaders: true });', RENAME, 'reported'],
    ['a parameter named like a grid, in the argument of a call',
      'function f(hot2, table) { table.getPlugin(\'exportFile\').downloadFile(\'csv\', { columnHeaders: true }); }',
      RENAME, 'reported'],
  ];

  for (const [label, body, only, expected] of SHAPES) {
    it(`${expected}: ${label}`, async() => {
      assert.equal(await outcomeOf(only, `${head}${body}\n`), expected);
    });
  }

  it('leaves the arguments of a call on a local object as they are', async() => {
    const source = `${head}const fake = { getPlugin() { return {}; } };\n`
      + 'fake.getPlugin(\'exportFile\').downloadFile(\'csv\', { columnHeaders: true });\n';
    const { output } = await runRules(RENAME, source);

    assert.equal(output, source);
  });

  it('does not loop on a name that is set from a call on itself', async() => {
    const source = `${head}let p = hot.getPlugin('exportFile'); p = p.getPlugin('x'); p.downloadFile('csv', {});\n`;

    assert.equal(await outcomeOf(RENAME, source), 'silent');
  });
});
