/**
 * The HTML report of the axe scan: the pure half.
 *
 * `tests/reporters/a11y.ts` calls `renderHtmlReport()` with the verdict of
 * `compareViolations()` (`lib/a11y-baseline.mjs`), every scan the run completed and
 * the run's details, and writes the result to `test-results/a11y/a11y-report.html`.
 * CI uploads that one file unzipped, so it opens in the browser from the run page,
 * and the pull request comment and the check run link to it.
 *
 * It is built to locate each element a finding is on: the fixture URL to open and
 * the steps to the scanned state, then for every element its selector, its full DOM
 * path, its box on the page and its markup, and a screenshot with the elements
 * outlined and numbered. It is one self-contained file (inline styles, screenshots as
 * data URIs, no request to anything), dark by default with a light toggle, and it
 * reads without JavaScript: the script only adds the toggle, copy buttons and a
 * filter. Every value from axe, the fixtures or the baseline goes through
 * `escapeHtml()`, and only a plain https URL or the local fixture server is linked.
 * It is an accessibility report, so it is accessible itself: headings in order,
 * header cells, every status an icon and a word as well as a color.
 */
import { entryKey, findingsByRule, headline, isSafeLink, selectorText, verdictCounts } from './a11y-baseline.mjs';
import { fixtureUrl, stateSteps } from '../a11y/pages.mjs';

const THEMES = ['main', 'horizon', 'classic'];
// The fixture server's default address (`tests/playwright.config.ts`); `HOT_TEST_PORT` moves it.
export const FIXTURE_SERVER = 'http://localhost:8123';
// Status: a color from the reserved status palette, always beside an icon and a word.
const STATUS = {
  new: { label: 'New', icon: '✖', note: 'Not in the baseline: fix it, or baseline it under an issue' },
  grown: { label: 'Grown', icon: '▲', note: 'More nodes than recorded: fix the new ones, or raise the count' },
  improved: { label: 'Improved', icon: '▼', note: 'Fewer nodes than recorded: lower the count' },
  stale: { label: 'Fixed', icon: '✔', note: 'No longer reproduces: delete the entry' },
  known: { label: 'Known', icon: '○', note: 'In the baseline, unchanged' },
};
// The heatmap's bins: count 0 has no fill, 1 to 6 step up one sequential blue ramp.
const BINS = 6;
const DATA_IMAGE = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;
// How many elements a card lists before the rest fold away.
const ELEMENTS_SHOWN = 8;

/**
 * Escapes text for HTML content and attribute values.
 *
 * @param {unknown} value The value.
 * @returns {string} The escaped text.
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);
}

/**
 * A link when the URL is a plain https URL, the escaped text otherwise.
 *
 * @param {string} text The link text (raw).
 * @param {unknown} url The URL.
 * @returns {string} HTML.
 */
function link(text, url) {
  return isSafeLink(url) ? `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>` : escapeHtml(text);
}

/**
 * A link to a page's fixture on the local fixture server, at the theme it was scanned on.
 *
 * @param {object|undefined} page The page entry.
 * @param {string} theme The theme.
 * @param {string} [text] The link text (raw); the page id by default.
 * @returns {string} HTML.
 */
function fixtureLink(page, theme, text) {
  if (!page) {
    return escapeHtml(text ?? '');
  }

  return `<a href="${escapeHtml(`${FIXTURE_SERVER}${fixtureUrl(page, theme)}`)}">${escapeHtml(text ?? page.id)}</a>`;
}

/**
 * A status chip: icon, word and color together.
 *
 * @param {keyof STATUS} status The status.
 * @returns {string} HTML.
 */
function chip(status) {
  return `<span class="chip s-${status}"><span aria-hidden="true">${STATUS[status].icon}</span> ${STATUS[status].label}</span>`;
}

/**
 * The heatmap bin of a count.
 *
 * @param {number} count The count.
 * @param {number} max The largest count on the map.
 * @returns {number} 0 for none, 1 to BINS otherwise.
 */
export function heatBin(count, max) {
  return count <= 0 || max <= 0 ? 0 : Math.min(BINS, Math.max(1, Math.ceil((BINS * count) / max)));
}

/**
 * Where an element sits, in words.
 *
 * @param {{x: number, y: number, width: number, height: number}|null|undefined} box The box.
 * @returns {string} HTML.
 */
function boxText(box) {
  return box
    ? `x ${box.x}, y ${box.y} · ${box.width} × ${box.height} px`
    : '<span class="muted">no box: hidden or not rendered</span>';
}

/**
 * A comparator that orders findings the way the page list does, then by theme, rule and target.
 *
 * @param {object[]} pages The page list.
 * @returns {Function} The comparator.
 */
function byPageOrder(pages) {
  const order = new Map(pages.map((page, index) => [page.id, index]));

  return (a, b) => (order.get(a.page) ?? 999) - (order.get(b.page) ?? 999) || THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme)
    || a.rule.localeCompare(b.rule) || a.target.localeCompare(b.target);
}

/**
 * Renders the report.
 *
 * @param {object} model What to render.
 * @param {object} model.verdict What `compareViolations()` returned.
 * @param {object[]} model.scans The completed scans: `page`, `theme`, `fixture`, `surface`, `state`,
 * `counts`, `incomplete`, `durationMs`, and `screenshot` (a data URI or null) with `marks`.
 * @param {object[]} model.pages The page list (`a11y/pages.mjs`).
 * @param {object} model.run The run: `generatedAt`, `engines`, `commit`, `prUrl`, `runUrl`,
 * `docsUrl`, `notes`, `problems`.
 * @returns {string} The HTML document.
 */
export function renderHtmlReport({ verdict, scans, pages, run }) {
  const counts = verdictCounts(verdict);
  const context = {
    verdict,
    scans,
    pages,
    run,
    scanOf: new Map(scans.map(scan => [`${scan.page}|${scan.theme}`, scan])),
    pageOf: new Map(pages.map(page => [page.id, page])),
    issueTitle: new Map(verdict.issues.map(issue => [issue.id, issue.title])),
  };

  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>Accessibility report</title>
<style>${STYLES}</style>
</head>
<body>
<a class="skip" href="#action">Skip to the findings that need action</a>
<main>
${renderHeader(context, counts)}
${renderTiles(verdict, counts, scans)}
${renderProblems(run)}
<nav aria-label="Sections" class="toc">
  <a href="#action">Needs action</a><a href="#overview">Overview</a><a href="#issues">Known issues</a><a href="#scans">Scans</a><a href="#about">How to use this</a>
</nav>
${renderAction(context, counts)}
${renderOverview(context)}
${renderIssues(context)}
${renderScans(context)}
${renderAbout(run, verdict.mode)}
</main>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

/**
 * The page header: title, run details, the theme toggle and the headline.
 *
 * @param {object} context The render context.
 * @param {object} counts The verdict's counts.
 * @returns {string} HTML.
 */
function renderHeader({ verdict, run }, counts) {
  const tone = counts.action === 0 ? 'ok' : (verdict.mode === 'block' ? 'fail' : 'warn');
  const icon = { ok: '✔', warn: '⚠', fail: '✖' }[tone];
  const details = [
    `<span class="mode">${verdict.mode === 'block' ? 'Block mode: a finding that needs action fails the job' : 'Warn mode: findings never fail the job'}</span>`,
    run.commit ? `commit <code>${escapeHtml(String(run.commit).slice(0, 10))}</code>` : '',
    run.prUrl ? link('pull request', run.prUrl) : '',
    run.runUrl ? link('workflow run', run.runUrl) : '',
    run.engines?.length ? `axe-core ${escapeHtml(run.engines.join(', '))}` : '',
    run.generatedAt ? `generated <time datetime="${escapeHtml(run.generatedAt)}">${escapeHtml(run.generatedAt.replace('T', ' ').slice(0, 16))} UTC</time>` : '',
  ].filter(Boolean);

  return `<header>
  <div class="title-row"><h1>Accessibility report</h1><button type="button" class="theme-toggle" hidden aria-pressed="false">Light theme</button></div>
  <p class="meta">${details.join(' <span aria-hidden="true">·</span> ')}</p>
  <p class="headline t-${tone}"><span aria-hidden="true">${icon}</span> ${escapeHtml(headline(verdict))}</p>
</header>`;
}

/**
 * The stat tiles: the four sets that need action, then what is known.
 *
 * @param {object} verdict The verdict.
 * @param {object} counts The verdict's counts.
 * @param {object[]} scans The scans.
 * @returns {string} HTML.
 */
function renderTiles(verdict, counts, scans) {
  const tile = (status, value) => `<li class="tile s-${status}${value === 0 ? ' zero' : ''}">
    <span class="tile-label"><span aria-hidden="true">${STATUS[status].icon}</span> ${STATUS[status].label}</span>
    <span class="tile-value">${value}</span>
    <span class="tile-note">${STATUS[status].note}</span>
  </li>`;
  const plain = (label, value, note) => `<li class="tile plain">
    <span class="tile-label">${label}</span><span class="tile-value">${value}</span><span class="tile-note">${note}</span>
  </li>`;

  return `<section aria-labelledby="tiles-title">
  <h2 id="tiles-title" class="visually-hidden">Counts</h2>
  <ul class="tiles">
    ${tile('new', counts.new)}${tile('grown', counts.grown)}${tile('improved', counts.improved)}${tile('stale', counts.stale)}
    ${plain('Known', counts.matched, 'Baselined findings that reproduced unchanged')}
    ${plain('Known issues', verdict.issues.length, 'Problems in the catalog, each with its findings')}
    ${plain('Scans', scans.length, `${new Set(scans.map(scan => scan.page)).size} pages on ${new Set(scans.map(scan => scan.theme)).size} themes`)}
  </ul>
</section>`;
}

/**
 * The tooling problems and notes, when there are any.
 *
 * @param {object} run The run.
 * @returns {string} HTML.
 */
function renderProblems(run) {
  const items = [
    ...(run.problems ?? []).map(text => `<li><strong>Tooling problem:</strong> ${escapeHtml(text)}</li>`),
    ...(run.notes ?? []).map(text => `<li><strong>Note:</strong> ${escapeHtml(text)}</li>`),
  ];

  return items.length === 0 ? '' : `<section class="problems" aria-label="Tooling problems and notes"><ul>${items.join('')}</ul></section>`;
}

/**
 * The findings that need action: a card per new and grown finding, tables for improved and stale.
 *
 * @param {object} context The render context.
 * @param {object} counts The verdict's counts.
 * @returns {string} HTML.
 */
function renderAction(context, counts) {
  const { verdict } = context;

  if (counts.action === 0) {
    return `<section id="action" aria-labelledby="action-title">
  <h2 id="action-title">Needs action</h2>
  <p class="empty"><span aria-hidden="true">✔</span> Nothing: every finding is in the baseline with its recorded node count, and every baseline entry reproduced.</p>
</section>`;
  }

  return `<section id="action" aria-labelledby="action-title">
  <h2 id="action-title">Needs action</h2>
  ${verdict.newViolations.map(item => renderCard(context, item, 'new')).join('\n')}
  ${verdict.grown.map(item => renderCard(context, item, 'grown')).join('\n')}
  ${renderEntryTable(context, verdict.improved, 'improved', 'Improved: lower the recorded count')}
  ${renderEntryTable(context, verdict.stale, 'stale', 'Fixed: delete the entry')}
</section>`;
}

/**
 * A card for a new or grown finding, built to locate its elements: where to open, how to reach the
 * state, then every element with its selector, DOM path, box and markup, and the screenshot.
 *
 * @param {object} context The render context.
 * @param {object} item The finding.
 * @param {'new'|'grown'} status The set it is in.
 * @returns {string} HTML.
 */
function renderCard({ scanOf, pageOf, issueTitle }, item, status) {
  const scan = scanOf.get(`${item.page}|${item.theme}`);
  const page = pageOf.get(item.page);
  const mark = scan?.marks?.find(candidate => candidate.rule === item.rule && candidate.target === item.target);
  const issue = item.issue ?? item.suggestedIssue;
  const id = `card-${cardId(item)}`;

  return `<article class="card s-${status}" aria-labelledby="${escapeHtml(id)}">
  <h3 id="${escapeHtml(id)}">${chip(status)} <code>${escapeHtml(item.rule)}</code> on <code>${escapeHtml(item.target)}</code>${mark ? ` <span class="mark-ref">mark ${mark.n}</span>` : ''}</h3>
  <p class="help">${link(item.help ?? item.rule, item.helpUrl)} <span class="muted">· ${escapeHtml(item.impact ?? 'unknown')} impact${item.wcag?.length ? ` · WCAG ${item.wcag.map(escapeHtml).join(', ')}` : ''}</span></p>
  <dl class="locate">
    <div><dt>Open</dt><dd>${fixtureLink(page, item.theme, `${item.page} on ${item.theme}`)} <code class="sel">${escapeHtml(page ? fixtureUrl(page, item.theme) : '')}</code></dd></div>
    <div><dt>Then</dt><dd>${escapeHtml(page ? stateSteps(page) : '')}</dd></div>
    <div><dt>Elements</dt><dd>${status === 'grown' ? `${item.nodes}, ${item.nodes - item.baselineNodes} more than the ${item.baselineNodes} recorded` : item.nodes}${scan?.surface ? ` <span class="muted">in ${escapeHtml(scan.surface)}</span>` : ''}</dd></div>
    <div><dt>Known issue</dt><dd>${issue ? `${escapeHtml(issueTitle.get(issue) ?? issue)} <code>${escapeHtml(issue)}</code>${status === 'new' ? ' <span class="muted">(same rule and element on other pages)</span>' : ''}` : '<span class="muted">none: a new one, or fix it</span>'}</dd></div>
  </dl>
  ${renderElements(item.details ?? [], mark)}
  ${scan?.screenshot && mark ? renderFigure(scan, `${scan.page} on ${scan.theme}, mark ${mark.n} outlined`, [mark.n]) : ''}
  <p class="remedy-label">Remedy</p>
  <pre class="remedy">${escapeHtml(item.remedy)}</pre>
</article>`;
}

/**
 * The elements of a finding: selector, box, and the DOM path, markup and axe's reason on demand.
 *
 * @param {object[]} details The node details.
 * @param {object} [mark] The screenshot mark the elements carry.
 * @returns {string} HTML.
 */
function renderElements(details, mark) {
  const row = (detail, index) => `<li class="element">
    <div class="element-head">${mark ? `<span class="num s-${mark.status}" title="Mark ${mark.n} on the screenshot">${mark.n}</span>` : ''}
      <code class="sel">${escapeHtml(selectorText(detail.selector))}</code>
      <span class="box">${boxText(detail.box)}</span></div>
    <details><summary>DOM path, markup and why <span class="visually-hidden">(element ${index + 1})</span></summary>
      ${detail.ancestry ? `<p class="small muted">DOM path</p><pre class="path">${escapeHtml(selectorText(detail.ancestry))}</pre>` : ''}
      <p class="small muted">Markup</p><pre>${escapeHtml(detail.html)}</pre>
      ${detail.failureSummary ? `<p class="small muted">Why</p><pre class="why">${escapeHtml(detail.failureSummary)}</pre>` : ''}
    </details>
  </li>`;
  const shown = details.slice(0, ELEMENTS_SHOWN).map(row).join('');
  const rest = details.slice(ELEMENTS_SHOWN);

  return `<ol class="elements">${shown}</ol>${rest.length ? `<details class="more"><summary>${rest.length} more element${rest.length === 1 ? '' : 's'}</summary><ol class="elements" start="${ELEMENTS_SHOWN + 1}">${rest.map((detail, index) => row(detail, ELEMENTS_SHOWN + index)).join('')}</ol></details>` : ''}`;
}

/**
 * A stable id for a finding's card.
 *
 * @param {object} item The finding.
 * @returns {string} The id.
 */
function cardId(item) {
  return entryKey(item).replace(/[^A-Za-z0-9_-]+/g, '-');
}

/**
 * A screenshot with its legend; the marks in `highlight` are listed first and in bold.
 *
 * @param {object} scan The scan.
 * @param {string} caption The caption (raw).
 * @param {number[]} [highlight] The marks the context is about.
 * @returns {string} HTML.
 */
function renderFigure(scan, caption, highlight = []) {
  if (!DATA_IMAGE.test(scan.screenshot ?? '')) {
    return '';
  }

  const marks = [...(scan.marks ?? [])].sort((a, b) => Number(highlight.includes(b.n)) - Number(highlight.includes(a.n)) || a.n - b.n);
  const legend = marks.map(mark => `<li class="${highlight.includes(mark.n) ? 'on' : ''}"><span class="num s-${mark.status}">${mark.n}</span>
    ${STATUS[mark.status].label}: <code>${escapeHtml(mark.rule)}</code> on <code>${escapeHtml(mark.target)}</code>, ${mark.nodes} element${mark.nodes === 1 ? '' : 's'}</li>`).join('');

  return `<figure class="shot">
  <div class="shot-frame"><img src="${scan.screenshot}" alt="Screenshot of ${escapeHtml(caption)}. The numbered outlines are the marks listed below." loading="lazy"></div>
  <figcaption>${escapeHtml(caption)}${scan.clip ? ` <span class="muted">(the area from x ${scan.clip.x}, y ${scan.clip.y})</span>` : ''}<ul class="legend">${legend}</ul></figcaption>
</figure>`;
}

/**
 * A table of improved or stale entries, each with where to open it.
 *
 * @param {object} context The render context.
 * @param {object[]} items The entries.
 * @param {'improved'|'stale'} status The set.
 * @param {string} title The table's caption.
 * @returns {string} HTML.
 */
function renderEntryTable({ issueTitle, pages, pageOf }, items, status, title) {
  if (items.length === 0) {
    return '';
  }

  const rows = [...items].sort(byPageOrder(pages)).map(item => `<tr data-search>
    <td>${fixtureLink(pageOf.get(item.page), item.theme, item.page)}</td><td>${escapeHtml(item.theme)}</td><td><code>${escapeHtml(item.rule)}</code></td>
    <td><code>${escapeHtml(item.target)}</code>${item.details?.[0] ? `<br><code class="sel small">${escapeHtml(selectorText(item.details[0].selector))}</code>` : ''}</td>
    <td class="num-cell">${status === 'improved' ? `${item.nodes} <span class="muted">of ${item.baselineNodes}</span>` : item.nodes}</td>
    <td>${escapeHtml(issueTitle.get(item.issue) ?? item.issue)}</td>
  </tr>`).join('');

  return `<div class="table-wrap"><table>
  <caption>${chip(status)} ${escapeHtml(title)}</caption>
  <thead><tr><th scope="col">Page</th><th scope="col">Theme</th><th scope="col">Rule</th><th scope="col">Element</th><th scope="col">Nodes</th><th scope="col">Issue</th></tr></thead>
  <tbody>${rows}</tbody>
</table></div>`;
}

/**
 * The overview: findings by rule as bars, and pages by theme as a heatmap table.
 *
 * @param {object} context The render context.
 * @returns {string} HTML.
 */
function renderOverview({ verdict, scans, pages, pageOf }) {
  const found = [...verdict.newViolations, ...verdict.grown, ...verdict.matched, ...verdict.improved];
  const rules = findingsByRule(verdict).map(row => [row.rule, row]);
  const maxRule = Math.max(1, ...rules.map(([, row]) => row.findings));
  const bars = rules.map(([rule, row]) => `<li title="${escapeHtml(`${rule}: ${row.findings} findings on ${row.nodes} elements (${row.impact ?? 'unknown'} impact)`)}">
    <span class="bar-label"><code>${escapeHtml(rule)}</code></span>
    <span class="bar-track"><span class="bar" style="width:${((100 * row.findings) / maxRule).toFixed(1)}%"></span></span>
    <span class="bar-value">${row.findings} <span class="muted">· ${row.nodes} el.</span></span>
  </li>`).join('');

  return `<section id="overview" aria-labelledby="overview-title">
  <h2 id="overview-title">Overview</h2>
  <div class="overview-grid">
    <div>
      <h3>Findings by rule</h3>
      <p class="muted small">One finding is a rule on one kind of element, on one page and theme.</p>
      ${rules.length ? `<ul class="bars" aria-label="Findings by rule">${bars}</ul>` : '<p class="empty">No findings.</p>'}
    </div>
    <div>
      <h3>Findings by page and theme</h3>
      <p class="muted small">Darker is more findings. <span class="flag" aria-hidden="true">!</span> marks a cell with a finding that needs action. A page links to its fixture.</p>
      ${renderHeatmap(found, verdict, scans, pages, pageOf)}
    </div>
  </div>
</section>`;
}

/**
 * The page × theme heatmap, as a table whose cells carry the counts and link to the fixture.
 *
 * @param {object[]} found The findings this run reproduced.
 * @param {object} verdict The verdict.
 * @param {object[]} scans The scans.
 * @param {object[]} pages The page list.
 * @param {Map<string, object>} pageOf The pages by id.
 * @returns {string} HTML.
 */
function renderHeatmap(found, verdict, scans, pages, pageOf) {
  const count = new Map();
  const action = new Set([...verdict.newViolations, ...verdict.grown, ...verdict.improved, ...verdict.stale]
    .map(item => `${item.page}|${item.theme}`));
  const scanned = new Set(scans.map(scan => `${scan.page}|${scan.theme}`));

  for (const item of found) {
    count.set(`${item.page}|${item.theme}`, (count.get(`${item.page}|${item.theme}`) ?? 0) + 1);
  }

  const max = Math.max(0, ...count.values());
  const ids = pages.map(page => page.id).filter(id => THEMES.some(theme => scanned.has(`${id}|${theme}`)));
  const cell = (id, theme) => {
    const key = `${id}|${theme}`;

    if (!scanned.has(key)) {
      return '<td class="heat na">not scanned</td>';
    }

    const value = count.get(key) ?? 0;
    const flag = action.has(key) ? ' <span class="flag" title="Needs action">!</span><span class="visually-hidden"> (needs action)</span>' : '';

    return `<td class="heat h${heatBin(value, max)}">${fixtureLink(pageOf.get(id), theme, String(value))}${flag}</td>`;
  };
  const totals = THEMES.map(theme => ids.reduce((sum, id) => sum + (count.get(`${id}|${theme}`) ?? 0), 0));

  return `<div class="table-wrap"><table class="heatmap">
  <thead><tr><th scope="col">Page</th>${THEMES.map(theme => `<th scope="col">${theme}</th>`).join('')}</tr></thead>
  <tbody>${ids.map(id => `<tr data-search><th scope="row"><a href="#scan-${escapeHtml(id)}">${escapeHtml(id)}</a></th>${THEMES.map(theme => cell(id, theme)).join('')}</tr>`).join('')}</tbody>
  <tfoot><tr><th scope="row">Total</th>${totals.map(total => `<td class="num-cell">${total}</td>`).join('')}</tr></tfoot>
</table></div>`;
}

/**
 * The known issues: one collapsible block each, pictured on one scan, with every location.
 *
 * @param {object} context The render context.
 * @returns {string} HTML.
 */
function renderIssues({ verdict, scans, pages, pageOf }) {
  const all = [...verdict.matched, ...verdict.grown, ...verdict.improved, ...verdict.stale, ...verdict.unverified];
  const statusOf = item => (verdict.grown.includes(item) ? 'grown' : verdict.improved.includes(item) ? 'improved'
    : verdict.stale.includes(item) ? 'stale' : verdict.unverified.includes(item) ? null : 'known');
  const blocks = verdict.issues.map((issue) => {
    const items = all.filter(item => item.issue === issue.id).sort(byPageOrder(pages));
    const newHere = verdict.newViolations.filter(item => item.suggestedIssue === issue.id);
    const wcag = [...new Set(items.flatMap(item => item.wcag ?? []))].sort();
    const rules = [...new Set(items.map(item => item.rule))].sort();
    const pictured = scans.find(scan => scan.screenshot && (scan.marks ?? []).some(mark => mark.issue === issue.id && mark.status === 'known'));
    const marksHere = pictured ? pictured.marks.filter(mark => mark.issue === issue.id).map(mark => mark.n) : [];
    const pagesHere = new Set(items.map(item => item.page)).size;
    const rows = items.map((item) => {
      const status = statusOf(item);
      const first = item.details?.[0];

      return `<tr data-search><td>${fixtureLink(pageOf.get(item.page), item.theme, item.page)}</td><td>${escapeHtml(item.theme)}</td>`
        + `<td><code>${escapeHtml(item.rule)}</code></td><td><code>${escapeHtml(item.target)}</code>`
        + `${first ? `<br><code class="sel small">${escapeHtml(selectorText(first.selector))}</code>` : ''}</td>`
        + `<td class="num-cell">${item.nodes}</td><td>${status ? chip(status) : 'not scanned'}</td></tr>`;
    }).join('');
    const tally = [
      `${issue.counts.matched + issue.counts.grown + issue.counts.improved} findings on ${pagesHere} page${pagesHere === 1 ? '' : 's'}`,
      issue.counts.grown ? `${issue.counts.grown} grown` : '',
      issue.counts.improved ? `${issue.counts.improved} improved` : '',
      issue.counts.stale ? `${issue.counts.stale} fixed` : '',
      newHere.length ? `${newHere.length} new elsewhere` : '',
    ].filter(Boolean).join(' · ');

    return `<details class="issue" id="issue-${escapeHtml(issue.id)}">
  <summary><span class="issue-title">${escapeHtml(issue.title)}</span> <code>${escapeHtml(issue.id)}</code> <span class="muted">${escapeHtml(tally)}</span></summary>
  <dl class="facts">
    <div><dt>Tracker</dt><dd>${issue.tracker ? escapeHtml(issue.tracker) : '<span class="muted">none yet</span>'}</dd></div>
    <div><dt>WCAG</dt><dd>${wcag.length ? wcag.map(escapeHtml).join(', ') : '–'}</dd></div>
    <div><dt>Rules</dt><dd>${rules.map(rule => `<code>${escapeHtml(rule)}</code>`).join(', ') || '–'}</dd></div>
  </dl>
  ${pictured ? renderFigure(pictured, `${pictured.page} on ${pictured.theme}, where this issue is pictured`, marksHere) : ''}
  <details class="where"><summary>Where it shows: ${items.length} finding${items.length === 1 ? '' : 's'}</summary>
  <div class="table-wrap"><table>
    <caption class="visually-hidden">Where ${escapeHtml(issue.id)} shows</caption>
    <thead><tr><th scope="col">Page</th><th scope="col">Theme</th><th scope="col">Rule</th><th scope="col">Element and first selector</th><th scope="col">Nodes</th><th scope="col">Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
  </details>
</details>`;
  }).join('\n');

  return `<section id="issues" aria-labelledby="issues-title">
  <h2 id="issues-title">Known issues</h2>
  <p class="muted small">The catalog in <code>tests/a11y/axe-baseline.json</code>. An issue leaves the catalog with its last finding.</p>
  ${blocks || '<p class="empty">No known issues.</p>'}
</section>`;
}

/**
 * Every scan the run completed, with its fixture and steps.
 *
 * @param {object} context The render context.
 * @returns {string} HTML.
 */
function renderScans({ scans, pages, pageOf }) {
  const order = new Map(pages.map((page, index) => [page.id, index]));
  const sorted = [...scans].sort((a, b) => (order.get(a.page) ?? 999) - (order.get(b.page) ?? 999) || THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme));
  const anchored = new Set();
  const rows = sorted.map((scan) => {
    const anchor = anchored.has(scan.page) ? '' : ` id="scan-${escapeHtml(scan.page)}"`;
    const page = pageOf.get(scan.page);

    anchored.add(scan.page);

    return `<tr data-search${anchor}><th scope="row">${fixtureLink(page, scan.theme, scan.page)}</th><td>${escapeHtml(scan.theme)}</td>`
      + `<td>${escapeHtml(scan.surface)}</td><td class="small">${escapeHtml(page ? stateSteps(page) : '')}</td>`
      + `<td class="num-cell">${scan.counts?.violations ?? 0}</td><td class="num-cell">${scan.counts?.incomplete ?? 0}</td>`
      + `<td class="num-cell">${((scan.durationMs ?? 0) / 1000).toFixed(1)} s</td></tr>`;
  }).join('');
  const review = new Map();

  for (const scan of scans) {
    for (const item of scan.incomplete ?? []) {
      const row = review.get(item.id) ?? { scans: 0, nodes: 0 };

      row.scans += 1;
      row.nodes += item.nodes;
      review.set(item.id, row);
    }
  }

  return `<section id="scans" aria-labelledby="scans-title">
  <h2 id="scans-title">Scans</h2>
  <div class="table-wrap"><table>
    <caption>Every page and theme the run scanned. Violations count axe rules, not elements.</caption>
    <thead><tr><th scope="col">Page</th><th scope="col">Theme</th><th scope="col">Surface</th><th scope="col">Steps after loading</th><th scope="col">Violations</th><th scope="col">Needs review</th><th scope="col">Time</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
  ${review.size ? `<div class="table-wrap"><table>
    <caption>Checks axe could not decide (needs review). They are never findings; the raw scans list the nodes.</caption>
    <thead><tr><th scope="col">Rule</th><th scope="col">Scans</th><th scope="col">Nodes</th></tr></thead>
    <tbody>${[...review].sort((a, b) => b[1].nodes - a[1].nodes).map(([rule, row]) => `<tr data-search><td><code>${escapeHtml(rule)}</code></td><td class="num-cell">${row.scans}</td><td class="num-cell">${row.nodes}</td></tr>`).join('')}</tbody>
  </table></div>` : ''}
</section>`;
}

/**
 * How to locate a finding and how the scan works, in a few lines.
 *
 * @param {object} run The run.
 * @param {string} mode The mode.
 * @returns {string} HTML.
 */
function renderAbout(run, mode) {
  return `<section id="about" aria-labelledby="about-title">
  <h2 id="about-title">How to use this</h2>
  <ul>
    <li><strong>To find an element:</strong> start the fixture server (<code>npm --prefix tests run test:a11y</code> starts it, or <code>node tests/support/static-server.mjs</code> from the repository root after building), open the fixture link, follow the steps, then paste the selector into the browser's developer tools: <code>document.querySelector('…')</code>. The DOM path is the full route from <code>html</code> when the short selector matches more than one element. The fixture links assume the default port, 8123.</li>
    <li>A finding is a rule on one kind of element on one page and theme, with the number of elements that carry it. The baseline, <code>tests/a11y/axe-baseline.json</code>, records the known ones, each under a known issue.</li>
    <li>${mode === 'block' ? 'Block mode: a new, grown, improved or fixed finding fails the job until the code or the baseline changes.' : 'Warn mode: findings are reported here, on the pull request and as annotations, and never fail the job. Blocking comes later.'}</li>
    <li>For an agent: <code>a11y-findings.json</code> in the <code>a11y-axe-results</code> artifact has the same findings, concise and machine-readable.</li>
    <li>${run.docsUrl ? link('The full policy: tests/AGENTS.md, "A11y: the axe scan and its baseline"', run.docsUrl) : 'The full policy: <code>tests/AGENTS.md</code>, "A11y: the axe scan and its baseline".'}</li>
  </ul>
</section>`;
}

const SCRIPT = `
(function () {
  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  }
  try { if (localStorage.getItem('a11y-report-theme') === 'light') apply('light'); } catch (e) {}
  toggle.hidden = false;
  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(next);
    try { localStorage.setItem('a11y-report-theme', next); } catch (e) {}
  });
  if (navigator.clipboard) {
    document.querySelectorAll('code.sel').forEach(function (code) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy ' + code.textContent);
      button.addEventListener('click', function () {
        navigator.clipboard.writeText(code.textContent).then(function () { button.textContent = 'Copied'; });
      });
      code.insertAdjacentElement('afterend', button);
    });
  }
  var rows = document.querySelectorAll('tr[data-search]');
  if (!rows.length) return;
  var box = document.createElement('div');
  box.className = 'filter';
  var label = document.createElement('label');
  label.htmlFor = 'filter';
  label.textContent = 'Filter the tables';
  var input = document.createElement('input');
  input.id = 'filter';
  input.type = 'search';
  input.placeholder = 'page, theme, rule, element';
  box.append(label, ' ', input);
  var toc = document.querySelector('.toc');
  toc.parentNode.insertBefore(box, toc.nextSibling);
  input.addEventListener('input', function () {
    var needle = input.value.trim().toLowerCase();
    rows.forEach(function (row) {
      row.hidden = needle !== '' && row.textContent.toLowerCase().indexOf(needle) === -1;
    });
    if (needle) document.querySelectorAll('details.issue, details.where').forEach(function (block) { block.open = true; });
  });
})();
`;

const STYLES = `
:root, :root[data-theme="dark"] {
  color-scheme: dark;
  --page: #0d0d0d; --surface: #1a1a19; --raised: #222220; --ink: #f0efec; --ink-2: #c3c2b7; --muted: #a3a29b;
  --grid: #2c2c2a; --axis: #45453f; --ring: rgba(255,255,255,0.10); --accent: #3987e5; --link: #86b6ef; --code-bg: #262624;
  --new: #e05252; --grown: #ec835a; --grown-strong: #ec835a; --good: #0ca30c; --known: #898781;
  --h1: #0d366b; --h2: #184f95; --h3: #256abf; --h4: #3987e5; --h5: #6da7ec; --h6: #9ec5f4;
  --h-ink-low: #f0efec; --h-ink-high: #0b0b0b;
}
:root[data-theme="light"] {
  color-scheme: light;
  --page: #f9f9f7; --surface: #fcfcfb; --raised: #ffffff; --ink: #0b0b0b; --ink-2: #52514e; --muted: #6b6a66;
  --grid: #e1e0d9; --axis: #c3c2b7; --ring: rgba(11,11,11,0.10); --accent: #2a78d6; --link: #1c5cab; --code-bg: #f0efec;
  --new: #d03b3b; --grown: #ec835a; --grown-strong: #b85a2f; --good: #0ca30c; --known: #898781;
  --h1: #cde2fb; --h2: #9ec5f4; --h3: #6da7ec; --h4: #3987e5; --h5: #256abf; --h6: #184f95;
  --h-ink-low: #0b0b0b; --h-ink-high: #ffffff;
}
* { box-sizing: border-box; }
html { background: var(--page); }
body { margin: 0; background: var(--page); color: var(--ink); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 1180px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 28px; line-height: 1.2; margin: 0; }
h2 { font-size: 21px; margin: 40px 0 12px; padding-top: 8px; border-top: 1px solid var(--grid); }
h3 { font-size: 16px; margin: 0 0 8px; }
a { color: var(--link); }
a:focus-visible, summary:focus-visible, input:focus-visible, button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.88em; }
code { background: var(--code-bg); padding: 1px 4px; border-radius: 4px; overflow-wrap: anywhere; }
pre { background: var(--code-bg); padding: 10px 12px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; overflow-wrap: anywhere; margin: 6px 0; }
button { font: inherit; color: var(--ink); background: var(--raised); border: 1px solid var(--axis); border-radius: 6px; padding: 2px 10px; cursor: pointer; }
.muted { color: var(--muted); }
.small { font-size: 13px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.skip { position: absolute; left: 16px; top: -40px; background: var(--surface); padding: 8px 12px; z-index: 1; }
.skip:focus { top: 8px; }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.meta { color: var(--ink-2); margin: 0 0 12px; font-size: 14px; }
.mode { font-weight: 600; }
.headline { font-size: 18px; font-weight: 600; margin: 0; padding: 12px 16px; border-radius: 8px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--ring); border-left: 6px solid var(--known); }
.t-ok { border-left-color: var(--good); } .t-warn { border-left-color: var(--grown); } .t-fail { border-left-color: var(--new); }
.tiles { list-style: none; padding: 0; margin: 16px 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.tile { background: var(--surface); box-shadow: inset 0 0 0 1px var(--ring); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; border-top: 4px solid var(--known); }
.tile.plain, .tile.zero { border-top-color: var(--axis); }
.tile.s-new:not(.zero) { border-top-color: var(--new); } .tile.s-grown:not(.zero) { border-top-color: var(--grown); }
.tile.s-improved:not(.zero), .tile.s-stale:not(.zero) { border-top-color: var(--good); }
.tile-label { font-size: 13px; font-weight: 600; color: var(--ink-2); }
.tile-value { font-size: 30px; font-weight: 700; line-height: 1.15; }
.tile-note { font-size: 12px; color: var(--muted); }
.problems { margin-top: 16px; background: var(--surface); border-left: 6px solid var(--new); padding: 4px 16px; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--ring); }
.toc { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 20px 0 0; font-size: 14px; }
.filter { margin: 12px 0 0; font-size: 14px; }
.filter input { font: inherit; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--axis); background: var(--surface); color: var(--ink); min-width: 260px; max-width: 100%; }
.empty { background: var(--surface); padding: 12px 16px; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--ring); }
.chip { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; padding: 1px 8px; border-radius: 10px; border: 1.5px solid var(--known); color: var(--ink); background: var(--surface); white-space: nowrap; vertical-align: middle; }
.chip.s-new { border-color: var(--new); } .chip.s-new > span { color: var(--new); }
.chip.s-grown { border-color: var(--grown-strong); } .chip.s-grown > span { color: var(--grown-strong); }
.chip.s-improved, .chip.s-stale { border-color: var(--good); } .chip.s-improved > span, .chip.s-stale > span { color: var(--good); }
.card { background: var(--surface); box-shadow: inset 0 0 0 1px var(--ring); border-radius: 8px; padding: 14px 16px; margin: 0 0 14px; border-left: 6px solid var(--known); }
.card.s-new { border-left-color: var(--new); } .card.s-grown { border-left-color: var(--grown); }
.card h3 { line-height: 1.6; }
.mark-ref { font-size: 12px; color: var(--muted); font-weight: 400; }
.help { margin: 0 0 10px; }
.locate { display: grid; grid-template-columns: max-content 1fr; gap: 4px 14px; margin: 0 0 10px; }
.locate > div { display: contents; }
.locate dt { color: var(--muted); font-size: 13px; padding-top: 1px; }
.locate dd { margin: 0; }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px 16px; margin: 0 0 8px; }
.facts dt { font-size: 12px; color: var(--muted); }
.facts dd { margin: 0; }
.elements { list-style: none; padding: 0; margin: 8px 0; }
.element { border-top: 1px solid var(--grid); padding: 6px 0; }
.element-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
.element-head .box { font-size: 13px; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.element details summary, details.more summary { cursor: pointer; font-size: 13px; color: var(--ink-2); margin-top: 4px; }
.copy { font-size: 12px; padding: 0 8px; }
.why, .path { border-left: 3px solid var(--axis); }
.remedy-label { font-size: 12px; color: var(--muted); margin: 10px 0 0; }
.remedy { margin-top: 2px; }
.shot { margin: 12px 0; }
.shot-frame { max-height: 620px; overflow: auto; border-radius: 6px; box-shadow: 0 0 0 1px var(--axis); background: #fff; }
.shot img { display: block; max-width: 100%; height: auto; }
.shot figcaption { font-size: 13px; color: var(--ink-2); margin-top: 6px; }
.legend { list-style: none; padding: 0; margin: 6px 0 0; }
.legend li { margin: 2px 0; }
.legend li.on { font-weight: 600; color: var(--ink); }
/* Fixed in both themes: white numbers need 4.5:1, so these are the steps the screenshot marks use too. */
.num { display: inline-block; min-width: 20px; padding: 0 5px; border-radius: 10px; color: #fff; font-weight: 700; font-size: 12px; text-align: center; background: #6b6a66; }
.num.s-new { background: #d03b3b; } .num.s-grown { background: #b85a2f; } .num.s-known { background: #1c5cab; }
.overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; }
.bars { list-style: none; padding: 0; margin: 0; }
.bars li { display: grid; grid-template-columns: minmax(120px, 210px) 1fr auto; align-items: center; gap: 10px; padding: 4px 0; border-bottom: 1px solid var(--grid); font-size: 13px; }
.bar-label code { background: none; padding: 0; }
.bar-track { height: 12px; }
.bar { display: block; height: 12px; background: var(--accent); border-radius: 0 4px 4px 0; min-width: 2px; }
.bar-value { font-variant-numeric: tabular-nums; white-space: nowrap; }
.table-wrap { overflow-x: auto; margin: 10px 0; }
table { border-collapse: collapse; width: 100%; background: var(--surface); font-size: 13px; box-shadow: inset 0 0 0 1px var(--ring); border-radius: 6px; }
caption { text-align: left; font-weight: 600; padding: 6px 0; color: var(--ink); caption-side: top; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--grid); vertical-align: top; }
thead th { font-size: 12px; color: var(--ink-2); font-weight: 600; border-bottom: 1px solid var(--axis); }
.num-cell { text-align: right; font-variant-numeric: tabular-nums; }
.heatmap td.heat { text-align: center; font-variant-numeric: tabular-nums; font-weight: 600; min-width: 80px; border-left: 2px solid var(--surface); }
.heatmap td.heat a { color: inherit; }
.heat.h0 { color: var(--muted); font-weight: 400; }
.heat.h1 { background: var(--h1); color: var(--h-ink-low); } .heat.h2 { background: var(--h2); color: var(--h-ink-low); }
.heat.h3 { background: var(--h3); color: var(--h-ink-low); } .heat.h4 { background: var(--h4); color: var(--h-ink-low); }
.heat.h5 { background: var(--h5); color: var(--h-ink-high); } .heat.h6 { background: var(--h6); color: var(--h-ink-high); }
.heat.na { color: var(--muted); font-weight: 400; font-size: 12px; }
.flag { display: inline-block; width: 16px; height: 16px; line-height: 16px; margin-left: 4px; border-radius: 50%; background: #d03b3b; color: #fff; font-size: 11px; font-weight: 700; text-align: center; }
details.issue { background: var(--surface); box-shadow: inset 0 0 0 1px var(--ring); border-radius: 8px; padding: 10px 14px; margin: 0 0 10px; }
details.issue > summary { cursor: pointer; line-height: 1.6; }
.issue-title { font-weight: 600; }
details.issue[open] > summary { margin-bottom: 8px; }
details.where > summary { cursor: pointer; margin: 8px 0; font-weight: 600; font-size: 14px; }
@media (max-width: 560px) { .locate { grid-template-columns: 1fr; } .locate dt { padding-top: 6px; } }
@media (forced-colors: active) {
  .chip, .tile, .card, .headline, .num, .flag { forced-color-adjust: auto; border: 1px solid CanvasText; }
  .bar { background: CanvasText; }
}
@media print {
  .skip, .toc, .filter, .theme-toggle, .copy { display: none; }
  details.issue { break-inside: avoid; }
}
`;
