/**
 * Rehype plugin that transforms migration guide content to use Starlight's
 * built-in Steps and FileTree components.
 *
 * Steps: Numbered h2 headings ("1. Title" or "Step N: Title") are grouped
 * into `<ol class="sl-steps" role="list"><li>…</li></ol>`, producing the
 * same DOM that the `<Steps>` Astro component generates. Nested h3 steps
 * inside a parent step are wrapped in a nested `<ol class="sl-steps">`.
 *
 * Step lists: a how-to guide writes its steps as a plain markdown ordered
 * list under a `## Steps` heading (the template in `docs/AGENTS.md`), which
 * is a list rather than a run of headings and so never matched the wrapper
 * above. That list gets the same `sl-steps` markup applied in place.
 *
 * FileTree: `<div class="dom-tree">` elements are converted to
 * `<starlight-file-tree>` custom elements so the real Starlight FileTree
 * CSS applies.
 */
import { visit } from 'unist-util-visit';

/** Matches "1. Title" or "Step 1: Title" prefixes. */
const STEP_RE = /^(?:\d+\.\s+|Step\s+\d+[.:]\s*)/;

/** Heading that introduces a how-to guide's ordered step list. */
const STEPS_HEADING_TEXT = 'Steps';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Concatenated plain-text content of a HAST node. */
function textContent(node) {
  if (node.type === 'text') return node.value;
  if (node.children) return node.children.map(textContent).join('');
  return '';
}

/** Strip the step prefix from the first text node of a heading. */
function stripStepPrefix(node) {
  for (const child of node.children ?? []) {
    if (child.type === 'text') {
      child.value = child.value.replace(STEP_RE, '');
      return true;
    }
    if (stripStepPrefix(child)) return true;
  }
  return false;
}

/** True when `node` is an element with the given tag name. */
function isTag(node, tag) {
  return node.type === 'element' && node.tagName === tag;
}

/** True when the node is a step heading (matches STEP_RE). */
function isStepHeading(node, tag) {
  return isTag(node, tag) && STEP_RE.test(textContent(node));
}

/** Heading levels for hierarchy comparison. */
const HEADING_LEVEL = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };

/** True when `node` is a heading with a higher level (lower number) than `stepTag`. */
function isHigherLevelHeading(node, stepTag) {
  if (node.type !== 'element') return false;
  const nodeLevel = HEADING_LEVEL[node.tagName];
  return nodeLevel !== undefined && nodeLevel < HEADING_LEVEL[stepTag];
}

// ---------------------------------------------------------------------------
// Steps transformation
// ---------------------------------------------------------------------------

/**
 * Walk `children`, group consecutive step headings (and their content)
 * into `<ol class="sl-steps" role="list"><li>…</li></ol>`.
 *
 * @param {Array} children  – flat array of HAST nodes
 * @param {string} stepTag  – heading tag to detect steps ('h2' or 'h3')
 * @param {string|null} nestedTag – heading tag for nested steps, or null
 * @returns {Array} transformed children array
 */
function wrapSteps(children, stepTag, nestedTag) {
  const result = [];
  let stepLis = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];

    if (isStepHeading(node, stepTag)) {
      // --- This heading starts (or continues) a step group ---
      stripStepPrefix(node);

      // Collect heading + all content until the next heading of the same level.
      const liChildren = [node];
      i++;
      while (i < children.length && !isTag(children[i], stepTag) && !isHigherLevelHeading(children[i], stepTag)) {
        liChildren.push(children[i]);
        i++;
      }

      // Recursively handle nested steps inside this step's content.
      // Chain: h2 → h3 → h4 (three levels of nesting).
      // First pass: look for step headings at the nested level (e.g., h3).
      // Second pass: also look one level deeper (e.g., h4) to catch step
      // headings that sit among non-step headings at the nested level.
      const nextNested = nestedTag === 'h3' ? 'h4' : null;
      let processed = nestedTag ? wrapSteps(liChildren, nestedTag, nextNested) : liChildren;

      if (nextNested) {
        processed = wrapSteps(processed, nextNested, null);
      }

      stepLis.push({
        type: 'element',
        tagName: 'li',
        properties: {},
        children: processed,
      });
    } else {
      // --- Not a step heading: flush any accumulated steps, pass through. ---
      if (stepLis.length > 0) {
        result.push(makeStepsOl(stepLis));
        stepLis = [];
      }
      result.push(node);
      i++;
    }
  }

  // Flush remaining steps at the end.
  if (stepLis.length > 0) {
    result.push(makeStepsOl(stepLis));
  }

  return result;
}

/** Create `<ol class="sl-steps" role="list">` wrapping the given `<li>` nodes. */
function makeStepsOl(lis) {
  return {
    type: 'element',
    tagName: 'ol',
    properties: { className: ['sl-steps'], role: 'list' },
    children: lis,
  };
}

// ---------------------------------------------------------------------------
// Step list marking (a how-to guide's `## Steps` ordered list)
// ---------------------------------------------------------------------------

/** Class list of a HAST element, always as an array. */
function classNamesOf(node) {
  const value = node.properties?.className;

  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);

  return [];
}

/** The next element sibling after `index`, skipping whitespace-only text. */
function nextElementSibling(children, index) {
  for (let i = index + 1; i < children.length; i++) {
    const node = children[i];

    if (node.type === 'text' && node.value.trim() === '') continue;
    if (node.type === 'element') return node;

    return null;
  }

  return null;
}

/**
 * Applies the `sl-steps` markup to the ordered list that follows a `## Steps`
 * heading, so a how-to guide's numbered list renders like the step lists the
 * heading-based wrapper produces.
 *
 * Runs before `wrapSteps()`, which rewrites the children arrays this reads.
 *
 * @param {object} tree - HAST root
 */
function markStepsListAfterHeading(tree) {
  visit(tree, 'element', (node, index, parent) => {
    if (!parent || index === null || index === undefined) return;
    if (node.tagName !== 'h2') return;
    if (textContent(node).trim() !== STEPS_HEADING_TEXT) return;

    const list = nextElementSibling(parent.children, index);

    if (!list || list.tagName !== 'ol') return;

    const classNames = classNamesOf(list);

    if (classNames.includes('sl-steps')) return;

    list.properties = {
      ...list.properties,
      className: [...classNames, 'sl-steps'],
      // `list-style: none` strips list semantics in Safari/VoiceOver, so the
      // role has to be restated - the same workaround Starlight's own
      // component uses.
      role: 'list',
    };

    // The bullets are drawn by a CSS counter, so an `<ol start="3">` would
    // still count from 1. Starlight's own rehype-steps.ts hands the offset to
    // the stylesheet through `--sl-steps-start`, which `page.css` reads; do
    // the same, and keep any style the list already carries.
    const start = list.properties.start;

    if (typeof start === 'number') {
      const styles = [`--sl-steps-start: ${start - 1}`];

      if (list.properties.style) styles.push(String(list.properties.style));

      list.properties.style = styles.join(';');
    }
  });
}

// ---------------------------------------------------------------------------
// FileTree transformation
// ---------------------------------------------------------------------------

/**
 * Convert `<div class="dom-tree …">` → `<starlight-file-tree>`.
 *
 * Raw HTML blocks in markdown are stored as `{ type: 'raw', value: '…' }`
 * in the HAST tree (not parsed into element nodes). We handle both
 * representations for robustness.
 */
function transformDomTrees(tree) {
  visit(tree, (node) => {
    // Handle raw HTML nodes (common in markdown HTML blocks).
    if (node.type === 'raw' && typeof node.value === 'string' && node.value.includes('dom-tree')) {
      node.value = node.value
        .replace(
          /^<div class="dom-tree[^"]*">/,
          '<starlight-file-tree class="not-content" data-pagefind-ignore>'
        )
        .replace(/<\/div>\s*$/, '</starlight-file-tree>');
    }
    // Handle proper HAST element nodes (in case rehype-raw is active).
    if (
      node.type === 'element' &&
      node.tagName === 'div' &&
      (node.properties?.className || []).includes('dom-tree')
    ) {
      node.tagName = 'starlight-file-tree';
      node.properties.className = ['not-content'];
      node.properties.dataPagefindIgnore = '';
    }
  });
}

// ---------------------------------------------------------------------------
// Plugin entry point
// ---------------------------------------------------------------------------

export function rehypeMigrationSteps() {
  return (tree) => {
    // 1. Convert DOM tree divs to actual starlight-file-tree elements.
    transformDomTrees(tree);

    // 2. Give a how-to guide's `## Steps` ordered list the same markup.
    //    Before wrapSteps(), which rewrites the children arrays it reads.
    markStepsListAfterHeading(tree);

    // 3. Wrap step headings in <ol class="sl-steps"> structure.
    //    h2 steps nest h3, h3 steps nest h4.
    tree.children = wrapSteps(tree.children, 'h2', 'h3');

    // 4. Catch orphaned h3 step headings (e.g. "Step 1: …" not inside an h2 step).
    tree.children = wrapSteps(tree.children, 'h3', 'h4');

    // 5. Catch orphaned h4 step headings (e.g. "Step 1. …" under a non-step h3).
    tree.children = wrapSteps(tree.children, 'h4', null);
  };
}
