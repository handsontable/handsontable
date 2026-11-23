/**
 * The two license keys the "Powered by Handsontable DataGrid" demo can build its grid with, chosen by
 * `?key=`. They are the public test fixture keys of `tests/fixtures/demo/license-branding.html` (the
 * `trial` and `sponsored-attribution-bar` entries there), copied verbatim because this demo cannot import from
 * `tests/`. Both are judged at a pinned clock: the visual spec fixes the time before it loads the page,
 * because the trial ran to 2026-09-26 and the attribution-bar key starts its renewal notice in 2027.
 *
 * - `trial`: a running trial (usage_until 2026-09-26, flag `trial`). It shows the bar and the corner badge.
 * - `attribution-bar`: a sponsored key with the `attribution-bar` flag (usage_until 2027-11-04). It shows the bar alone.
 */
export const LICENSE_KEYS = {
  // eslint-disable-next-line max-len
  trial: 'This is a Handsontable license key for Test Fixture, issued on 2026-08-12 for the "Fixture Project" project. It includes 1 license: > 1. Trial license under Handsontable Evaluation License Agreement 4.0 of 2026-03-02, for Handsontable on the Enterprise package, for internal use, valid until 2026-09-26 (UTC). Not licensed for production use. To purchase a license, contact sales@handsontable.com. [eyJwcm9kdWN0cyI6eyJoYW5kc29udGFibGUiOnsiY2FwYWJpbGl0aWVzIjpbImNvcmUiXSwidXNhZ2VfdW50aWwiOiIyMDI2LTA5LTI2Iiwibm90aWNlIjo0NSwiZ3JhY2UiOjE1LCJmbGFncyI6WyJ0cmlhbCJdfX0sInYiOjIsInByb3NlIjoiMzg3MzYxOTE5Yzc1YTQ0NTA4NGZmNmM1MmYwMmM0ZDJjNmMyMTVhYzc2YjFkMGRiYTZiMDkzODFmMDkwNjg1YSJ973a630de3fb4f97dd3d82647b57149489e48114b83ac7d5ca92d370a0be18246eecfedca9c2671de91a39840c8c2b6964b5756bf3fc2b7adbe0718167ea55b50]',
  // eslint-disable-next-line max-len
  'attribution-bar': 'This is a Handsontable license key for Test Fixture, issued on 2026-11-04 for the "Fixture Project" project. It includes 1 license: > 1. Sponsored license under Handsontable Subscription License Agreement 2.0 of 2022-05-21, for Handsontable, for internal use, valid until 2027-11-04 (UTC). Issued free of charge for non-commercial use. Use after that date is not permitted. To renew, contact sales@handsontable.com. The grid must display the "Powered by Handsontable DataGrid" bar. [eyJwcm9kdWN0cyI6eyJoYW5kc29udGFibGUiOnsiY2FwYWJpbGl0aWVzIjpbImNvcmUiXSwidXNhZ2VfdW50aWwiOiIyMDI3LTExLTA0Iiwibm90aWNlIjo2MCwiZ3JhY2UiOjkwLCJmbGFncyI6WyJhdHRyaWJ1dGlvbi1iYXIiXX19LCJ2IjoyLCJwcm9zZSI6IjgyYzU1ZGVlNjAxOTllYTdjMjE5OWYyYzYzNjY4ZTlkY2U1YWQ2YjM0NjQxMGU3OGZmYzM3Y2U0NWE5MzcxMGIifQ99d10a32bd349c604ad7c60c5ff83462865f830c72d14aa3fc5b68d93be1a16979feb380af60994954d244ac06fb59d29d8247d430116f710bcdd867bfcf2429]',
};
