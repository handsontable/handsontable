/**
 * The compile floor: which browsers the emitted bundles must run on. Consumed as `env.targets` by
 * every rspack/swc config in `handsontable/.config/`, as `targets` by `babel.config.js`, as the
 * lightningcss targets for the CSS builds, and as `settings.browsers` for `eslint-plugin-compat`.
 *
 * These are pinned integers on purpose. A moving query (`last 2 versions`, `baseline widely
 * available`) would make builds non-reproducible and would silently drop support on any rebuild.
 * Raising them is a support drop: major-release boundary, team sign-off.
 *
 * NOTE: this is not the same number as the "two latest versions" statement in the supported-browsers
 * guide. That statement is about which browsers we *test* on; this is the floor we *compile* for.
 */
exports.BROWSERS_LIST = [
  'Chrome >= 110',
  'Firefox >= 110',
  'Safari >= 14.1',
];

/**
 * The API floor: the ES-year bucket that every browser in `BROWSERS_LIST` fully supports. Pinned as
 * `lib` in `handsontable/tsconfig.json`, which makes calling a built-in above the floor a *type*
 * error — `eslint-plugin-compat` cannot resolve prototype methods on non-literal receivers, which is
 * how `toSorted` and `Array#at` shipped in 18.0.0.
 *
 * Re-derive this whenever `BROWSERS_LIST` moves: it is the newest ES year whose features are all at
 * or below every floor above, per `core-js-compat`'s `data.json`. At Safari 14.1 that is ES2021 —
 * ES2022 would require Safari 15.4 (`Array#at`, `Object.hasOwn`) and Safari 15.0 (`Error` `cause`).
 *
 * `handsontable/scripts/swc-transpile.mjs` deliberately does not follow this constant; it hardcodes
 * `es2021` so the npm ESM/CJS artifact keeps class fields lowered for Angular's Zone.js. It must
 * never emit *newer* than `ES_TARGET`, which `handsontable/test/__tests__/esTarget.unit.js` asserts.
 */
exports.ES_TARGET = 'es2021';
