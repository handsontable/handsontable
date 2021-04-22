---
title: Versioning policy
permalink: /next/versioning-policy
canonicalUrl: /versioning-policy
---

# {{ $frontmatter.title }}

[[toc]]

Links semver:

- https://reactjs.org/docs/faq-versioning.html#:~:text=React%20follows%20semantic%20versioning%20(semver,z%20number%20(ex%3A%2015.6.
- https://semver.org/
- https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html

Links monorepo

- https://hub.packtpub.com/why-dont-you-have-a-monorepo/
- https://blog.bitsrc.io/is-monorepo-for-you-2020-78cc1717a4f1
- https://www.squash.io/the-issue-with-monorepos/
- https://medium.com/@Jakeherringbone/you-too-can-love-the-monorepo-d95d1d6fcebe#:~:text=A%20key%20consequence%20of%20a,no%20shared%20QA%2FStaging%20environment!

## Version number incrementation

Handsontable follows the principles of SemVer [Semantic Versioning](https://semver.org/). We use a version format of X.Y.Z (Major.Minor.Patch) and we increament them when a certain type of a change occurs to the code.

1. We increment the `patch` version Z (x.y.Z) when a backwards compatible bug fixes are introduced. We define a bug fix as an internal change that fixes incorrect behavior in Handsontable, or one of the supported framework wrappers.
2. We increment the `minor` version Y (x.Y.z) when a new, backwards compatible functionality is introduced to the public API. We also do itwhen any public API functionality is marked as deprecated.
3. We increment the `major` version X (X.y.z) when any backwards incompatible changes are introduced to the public API.

## Releasing framework wrappers

Before version 8.4.0 we were releasing Handsontable vanilla, and the wrappers separately. Our motivation was to follow the SemVer rules very strictly. However, we noticed that maintaining different versions is difficult to understand by our customers so starting with version 8.4.0 we switched to the unified number. This has its upsides though: each backward-incompatible change makes us to bump the major version of the entire project. In the past we could just bump the single wrapper version, now we update the whole code base.  
