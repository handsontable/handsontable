/**
 * The compile floor: which browsers the emitted bundles must run on. Consumed as `env.targets` by
 * every rspack/swc config in `handsontable/.config/`, as `targets` by `babel.config.js`, as the
 * lightningcss targets for the CSS builds, and as `settings.browsers` for `eslint-plugin-compat`.
 *
 * These are pinned integers on purpose. A moving query (`last 2 versions`, `baseline widely
 * available`, `baseline 2024`) would make builds non-reproducible and would silently drop support on
 * any rebuild. Raising them is a support drop: major-release boundary, team sign-off.
 *
 * The numbers below are the **Baseline 2024** target, resolved once with `browserslist('baseline
 * 2024')` and then pinned. Re-resolve that query if you need to move the floor to another Baseline
 * year; do not put the query itself in this file.
 *
 * The floor has to clear the CSS the themes actually ship. `light-dark()` is the tallest feature we
 * use (Chrome 123, Firefox 120, Safari 17.5) and CSS nesting is next (Chrome 120, Firefox 117,
 * Safari 17.2). `handsontable/test/__tests__/esTarget.unit.js` asserts that every floor here stays
 * at or above those, so the theme stylesheets cannot outrun the browsers we compile for.
 *
 * NOTE: this is not the same number as the "two latest versions" statement in the supported-browsers
 * guide. That statement is about which browsers we *test* on, and it is a lower bound on freshness —
 * whatever is current must work. It does not cap how far back this floor may reach, and the floor
 * here is deliberately many majors below it.
 */
exports.BROWSERS_LIST = [
  'Chrome >= 130',
  'Edge >= 130',
  'Firefox >= 132',
  'Safari >= 18.2',
];

/**
 * The API floor: the ES-year bucket that every browser in `BROWSERS_LIST` fully supports. Pinned as
 * `lib` in `handsontable/tsconfig.json`, which makes calling a built-in above the floor a *type*
 * error — `eslint-plugin-compat` cannot resolve prototype methods on non-literal receivers, which is
 * how `toSorted` and `Array#at` shipped in 18.0.0.
 *
 * Re-derive this whenever `BROWSERS_LIST` moves: it is the newest ES year whose features are all at
 * or below every floor above, per `core-js-compat`'s `data.json`. At the Baseline 2024 floor that is
 * ES2024 — its tallest entries are `ArrayBuffer#transfer` (Firefox 122) and `Array.fromAsync`
 * (Chrome 121, Safari 18.0). ES2025 is out of reach: `RegExp.escape` needs Chrome 136.
 *
 * `handsontable/scripts/swc-transpile.mjs` deliberately does not follow this constant; it hardcodes
 * `es2021` so the npm ESM/CJS artifact keeps class fields lowered for Angular's Zone.js. It must
 * never emit *newer* than `ES_TARGET`, which `handsontable/test/__tests__/esTarget.unit.js` asserts.
 */
exports.ES_TARGET = 'es2024';
