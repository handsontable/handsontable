/**
 * Search and level filtering for the configuration-option levels matrix.
 *
 * The table itself is generated into the page by
 * `handsontable/scripts/generate-option-levels.mjs`, so it renders and stays indexable
 * without JavaScript. This script only enhances it: it hides rows that do not match the
 * search text or the selected levels, and mirrors the state in the URL so a filtered
 * view can be linked to.
 *
 * URL parameters: `?q=<search>&level=<grid|columns|cells|cell>` (`level` may repeat).
 */

const LEVELS = ['grid', 'columns', 'cells', 'cell'] as const;

type Level = (typeof LEVELS)[number];

interface Row {
  element: HTMLTableRowElement;
  name: string;
  levels: Set<string>;
}

/**
 * Reads every generated row out of the rendered table.
 *
 * @param root The container the generator wraps the table in.
 * @returns One record per option row.
 */
function collectRows(root: HTMLElement): Row[] {
  return Array.from(root.querySelectorAll<HTMLTableRowElement>('tbody tr')).flatMap((tr) => {
    const marker = tr.querySelector<HTMLElement>('[data-option]');

    if (!marker) return [];

    return [{
      element: tr,
      name: (marker.dataset.option ?? '').toLowerCase(),
      levels: new Set((marker.dataset.levels ?? '').split(/\s+/).filter(Boolean)),
    }];
  });
}

function mount(): void {
  const root = document.querySelector<HTMLElement>('[data-option-levels]');
  const controls = document.querySelector<HTMLElement>('[data-option-levels-controls]');

  if (!root || !controls) return;

  const search = controls.querySelector<HTMLInputElement>('[data-option-levels-search]');
  const status = controls.querySelector<HTMLElement>('[data-option-levels-status]');
  const boxes = new Map<Level, HTMLInputElement>();

  LEVELS.forEach((level) => {
    const box = controls.querySelector<HTMLInputElement>(`[data-option-levels-filter="${level}"]`);

    if (box) boxes.set(level, box);
  });

  const rows = collectRows(root);

  if (!rows.length) return;

  const URL_SYNC_DELAY = 200;
  let urlSyncTimer = 0;

  // Seed from the URL so a shared link opens on the same view.
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') ?? '';

  if (search) search.value = initialQuery;
  params.getAll('level').forEach((level) => {
    const box = boxes.get(level as Level);

    if (box) box.checked = true;
  });

  /**
   * Applies the current search text and level filters to the table.
   */
  function apply(): void {
    const query = (search?.value ?? '').trim().toLowerCase();
    const active = LEVELS.filter(level => boxes.get(level)?.checked);
    let visible = 0;

    rows.forEach((row) => {
      // A row must match the text and carry every selected level.
      const matchesText = query === '' || row.name.includes(query);
      const matchesLevels = active.every(level => row.levels.has(level));
      const show = matchesText && matchesLevels;

      row.element.hidden = !show;
      if (show) visible += 1;
    });

    if (status) {
      const filtered = query !== '' || active.length > 0;

      status.textContent = filtered
        ? `Showing ${visible} of ${rows.length} options.`
        : `${rows.length} options.`;
    }

    const next = new URLSearchParams(window.location.search);

    next.delete('q');
    next.delete('level');
    if (query) next.set('q', query);
    active.forEach(level => next.append('level', level));

    const qs = next.toString();
    // Keep the fragment. Rebuilding the URL from the path alone drops it, and because
    // this runs on mount too, that cancelled the browser's jump to a section link.
    const { pathname, hash } = window.location;
    const url = `${pathname}${qs ? `?${qs}` : ''}${hash}`;

    // Don't touch history when nothing changed - on mount there is usually nothing to write.
    if (url === `${pathname}${window.location.search}${hash}`) {
      return;
    }

    // Rows filter on every keystroke, but the URL sync is debounced: Safari ignores
    // `replaceState` after about 100 calls per 30 seconds, and typing an option name
    // crosses that on its own.
    window.clearTimeout(urlSyncTimer);
    urlSyncTimer = window.setTimeout(() => window.history.replaceState(null, '', url), URL_SYNC_DELAY);
  }

  search?.addEventListener('input', apply);
  boxes.forEach(box => box.addEventListener('change', apply));
  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}

// Keeps this file a module, so `mount` does not collide with the other bootstrap scripts.
export {};
