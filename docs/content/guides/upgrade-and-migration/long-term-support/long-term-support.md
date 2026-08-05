---
type: explanation
title: Long Term Support (LTS)
metaTitle: Long Term Support (LTS) - JavaScript Data Grid | Handsontable
description: LTS (Long-Term Support) versions are Handsontable releases that are maintained for an extended period. 
permalink: /long-term-support
canonicalUrl: /long-term-support
react:
  metaTitle: Long Term Support (LTS) - React Data Grid | Handsontable
angular:
  metaTitle: Long Term Support (LTS) - Angular Data Grid | Handsontable
vue:
  metaTitle: Long Term Support (LTS) - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
menuTag: updated
---
LTS (Long-Term Support) versions are Handsontable release lines that are maintained and supported for an extended period. 

[[toc]]

## Release Types

Handsontable has two types of release lines: **Current** and **Long-Term Support (LTS)**. The project adopts an even-numbered LTS pattern to provide predictable, stable releases for enterprise and production environments.

Both **Current** and **LTS** releases are production-ready. **Current** releases should be used in production by those who value new features and all bug fixes over stability. **LTS** releases should be used in production by those who value stability over new features and minor bug fixes. The LTS schedule is designed to provide a reliable platform for applications that need extended maintenance windows and predictable upgrade cycles.

## Release Schedule

Major releases occur once every 6 months. Even-numbered releases (`16.0.0`, `18.0.0`, `20.0.0`, `22.0.0`) become **Long-Term Support releases**, while odd-numbered releases (`17.0.0`, `19.0.0`, `21.0.0`) are **Current-only releases**.

Each LTS release line begins as the **Current** release for the first 6 months to allow for stabilization. After 6 months, when the next major version ships, it transitions to **Active LTS** status. This ensures thoroughly tested code enters long-term support, providing enterprise users with maximum stability.

::: note

Dates below are offered as general guidance and are subject to change.

:::

<span class="img-light">

![LTS release schedule](/img/lts-light.svg)

</span>

<span class="img-dark">

![LTS release schedule](/img/lts-dark.svg)

</span>

## Support Phases

Every major release progresses through distinct support phases:

*   **Current** - The latest version under active development, receiving all new features, bug fixes, and improvements. Both LTS and Current-only releases start here for 6 months.
*   **Active LTS** - Available only for even-numbered releases. During this 10-month phase, releases receive critical bug fixes, including [regressions](#critical-bugs-and-regressions), and security updates. No new features are added to maintain stability.
*   **Maintenance LTS** - The final 14-month phase for LTS releases, where only security fixes are applied. This provides a transition period for migration to newer LTS versions.
*   **End-of-Life** - No further updates, security patches, or support. Users should migrate to a supported version before this phase.

Current-only (odd-numbered) releases skip the LTS phases entirely, moving directly from Current to End-of-Life after 6 months. These releases allow the community to preview and test upcoming features before they stabilize in the next LTS release.

## Choosing a Release

*   For **mission-critical production deployments**, use the latest Active LTS version. These releases offer the best balance of stability, performance, and security with guaranteed long-term support. Enterprise environments with strict change management requirements particularly benefit from the predictable maintenance windows and extended support lifecycle.
*   For **agile production deployments**, either Current or Active LTS versions work well. The Current release provides access to the latest features and improvements, at the cost of frequent updates and changes that occasionally require your team to adapt your configuration.
*   For **new projects** starting development, consider the release timeline. If your production deployment is months away, starting with the Current release allows you to familiarize yourself with upcoming features that will stabilize in the next LTS.

### Version Lifecycle

Each LTS release receives approximately **30 months of total support**:
*   6 months as Current release
*   10 months as Active LTS (critical fixes and security updates)
*   14 months as Maintenance LTS (security fixes only)

This extended support window ensures at least 12 months of overlap between consecutive LTS versions, providing ample time for testing and migration. Organizations can plan upgrades on a predictable 2-year cycle, moving from one LTS to the next.

## Migration Strategy

The LTS model is designed to minimize disruption while ensuring applications stay secure and supported. When planning migrations:
*   **From LTS to LTS** - Recommended path for production systems (e.g., v16 → v18 → v20). Each jump represents approximately one year of development, with breaking changes clearly documented in migration guides.
*   **From Current to LTS** - If using an odd-numbered Current release, plan migration to the next even-numbered LTS release before the 6-month Current phase ends.
*   **Security patches** during the Maintenance phase are designed to be drop-in replacements with minimal risk. However, thorough testing in staging environments remains essential before production deployment.

## Backport Policy

Backporting involves taking specific fixes from newer versions and retrofitting (cherry-picking) them to LTS releases, ensuring production systems receive critical updates without the disruption of major upgrades. Our backport policy prioritizes stability while addressing essential security and reliability concerns.

The backport process is selective and risk-aware. Not all fixes from newer versions are suitable for backporting - only those that meet strict criteria for importance and stability. This approach ensures LTS releases remain stable and predictable while still receiving necessary updates.

### Backport Decision Matrix

The following matrix defines which types of fixes are backported to each support phase:

| Issue Type | Current | Active LTS | Maintenance LTS |
| ---| ---| --- | --- |
| Security vulnerability | ✅  | ✅  | ✅  |
| Critical bug, including regressions | ✅ | ✅ | - |
| Major/Minor bug | ✅ | - | - |
| Performance | ✅ | - | - |
| Feature | ✅ | - | - |

*   **Security vulnerabilities** receive immediate attention across all supported versions, including those in Maintenance LTS. These fixes are prioritized and released as quickly as possible to protect production deployments.
*   **Critical bugs** that significantly impact functionality are backported to Active LTS releases in the next patch version. These fixes undergo thorough testing to ensure they don't introduce new issues. Most critical bugs reported against an LTS line are regressions - see [Critical Bugs and Regressions](#critical-bugs-and-regressions).
*   **Major and minor bugs, and performance improvements**, are not backported to Active LTS as a rule. A fix is considered by exception only when it carries low risk and high importance. The evaluation considers the fix complexity, potential for regression, and number of affected users.
*   **New features** are never backported to LTS releases. This policy maintains the stability promise of LTS versions - you can confidently apply updates knowing they contain only fixes, not functionality changes that might require application modifications.

### Critical Bugs and Regressions

The term that decides a backport is **critical bug**, not "regression". A critical bug is a defect in a supported version that breaks a documented feature, corrupts data, or blocks a core workflow with no reasonable workaround. Severity is judged by the impact on your application, not by how the defect appeared.

A **regression** describes how a critical bug reached you: something that worked before, and stopped working. Regressions are the most common source of critical bugs in an LTS line, and they are the clearest breach of the LTS stability promise. They are still assessed against the same severity bar. A regression that changes only a cosmetic detail remains a major or minor bug, and it is not backported.

#### Two Classes of Regression

Both classes qualify as critical bugs in Active LTS, and they carry different urgency:

| Regression class | What changed | Example | Urgency in Active LTS |
| --- | --- | --- | --- |
| **Version regression** | Handsontable's own code, between two releases of the same LTS line | Column sorting works in `16.0` and `16.1`, and breaks in `16.2` | Standard. Fixed in the next scheduled patch release of the LTS line. |
| **Environment regression** | The runtime around Handsontable: a browser, framework, or operating system update | The grid renders correctly in Chrome 150, and breaks in Chrome 151 | Elevated. Prioritized above other critical bugs, and released in a patch of the LTS line as soon as the fix passes testing. |

An environment regression outranks a version regression because nothing in your application changed. Running unchanged on the [supported browsers](@/guides/technical-specification/supported-browsers/supported-browsers.md) for the entire support window is the core guarantee of an LTS line, and you cannot pin a browser version the way you pin a package version. A version regression, by contrast, only reaches you when you choose to install a newer patch, so you can stay on the last working patch until the fix ships.

#### What Does Not Count as a Regression

*   **Behavior that never worked in the LTS line.** A defect present since the first release of the line is a bug, not a regression. It reaches Active LTS only when it is critical.
*   **Intentional changes.** Behavior changed on purpose in a new major version is covered by the [versioning policy](@/guides/upgrade-and-migration/versioning-policy/versioning-policy.md) and the migration guides.
*   **Removals announced in advance** under the [deprecation policy](@/guides/upgrade-and-migration/deprecation-policy/deprecation-policy.md).
*   **Breakage on an unsupported browser**, or on a browser version older than the two latest, which fall outside the [supported browsers](@/guides/technical-specification/supported-browsers/supported-browsers.md) list.

#### Regressions in Maintenance LTS

Neither class of regression is backported during the Maintenance LTS phase, where only security fixes are applied. If a browser update breaks a line that is already in Maintenance LTS, upgrade to the current Active LTS line.

### Reporting a Regression

Report a regression through the [issue tracker](https://github.com/handsontable/handsontable/issues/new/choose). Include the following, so the report can be classified and prioritized without a round trip:

*   The last version that worked, and the first version that broke, such as "works in `16.1`, breaks in `16.2`".
*   The browser and operating system, with their versions, and the last combination that worked, such as "works in Chrome 150, breaks in Chrome 151".
*   A minimal, runnable reproduction.
*   The impact on your application, and any workaround you found.

## Support Commitment

Starting with version `16.0.0`, this LTS policy provides enterprise customers with the predictability and stability required for mission-critical applications. Version `16.x`, already in widespread production use, retroactively becomes our first Active LTS release, ensuring existing deployments receive continued support under this new model.

The commitment to long-term support reflects Handsontable's maturity as an enterprise-grade data grid solution. By maintaining multiple versions simultaneously and providing clear upgrade paths, we enable organizations to adopt Handsontable with confidence, knowing their investment is protected by a comprehensive support strategy.