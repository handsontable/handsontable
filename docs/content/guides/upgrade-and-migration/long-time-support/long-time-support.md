---
id: 4055bdfa
title: Long Time Support (LTS)
metaTitle: Long Time Support (LTS) - JavaScript Data Grid | Handsontable
description: LTS (Long-Term Support) versions are Handsontable releases that are maintained for an extended period. 
permalink: /long-time-support
canonicalUrl: /long-time-support
react:
  id: cff9afef
  metaTitle: Long Time Support (LTS) - React Data Grid | Handsontable
angular:
  id: 0dc19b1b
  metaTitle: Long Time Support (LTS) - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Long Term Support (LTS)

LTS (Long-Term Support) versions are Handsontable releases that are maintained for an extended period. 

[[toc]]

## Release Types

Handsontable has two types of releases: **Current** and **Long-Term Support (LTS)**. The project adopts an even-numbered LTS (Long Time Support) pattern to provide predictable, stable releases for enterprise and production environments.

Production applications should use **LTS** releases, while those wanting to try experimental features and provide feedback should use **Current** releases. The LTS schedule is designed to provide a reliable platform for applications that need stability, extended maintenance windows, and predictable upgrade cycles.

## Release Schedule

Major releases occur predictably every 6 months. Even-numbered releases (`16.0.0`, `18.0.0`, `20.0.0`, `22.0.0`) become **Long-Term Support releases**, while odd-numbered releases (`17.0.0`, `19.0.0`, `21.0.0`) are **Current-only releases** designed for early adopters and testing new features.

Each LTS release line begins as the **Current** release for the first 6 months to allow for stabilization. After 6 months, when the next major version ships, it transitions to **Active LTS** status. This ensures thoroughly tested code enters long-term support, providing enterprise users with maximum stability.

::: tip

Dates below are offered as general guidance and are subject to change.

:::

<span class="img-light">

![design_system_light]({{$basePath}}/img/lts-light.svg)

</span>

<span class="img-dark">

![design_system_dark]({{$basePath}}/img/lts-dark.svg)

</span>

## Support Phases

Every major release progresses through distinct support phases:

*   **Current** - The latest version under active development, receiving all new features, bug fixes, and improvements. Both LTS and Current-only releases start here for 6 months.
*   **Active LTS** - Available only for even-numbered releases. During this 10-month phase, releases receive critical bug fixes, security updates, and essential patches. No new features are added to maintain stability.
*   **Maintenance LTS** - The final 14-month phase for LTS releases, where only security fixes and critical patches are applied. This provides a transition period for migration to newer LTS versions.
*   **End-of-Life** - No further updates, security patches, or support. Users should migrate to a supported version before this phase.

Current-only (odd-numbered) releases skip the LTS phases entirely, moving directly from Current to End-of-Life after 6 months. These releases allow the community to preview and test upcoming features before they stabilize in the next LTS release.

## Choosing a Release

*   For **production deployments**, use the latest Active LTS version. These releases offer the best balance of stability, performance, and security with guaranteed long-term support. Enterprise environments with strict change management requirements particularly benefit from the predictable maintenance windows and extended support lifecycle.
*   For **development and testing**, either Current or Active LTS versions work well. The Current release provides access to the latest features and improvements, making it ideal for evaluating new capabilities and providing feedback that shapes future LTS releases.
*   For **new projects** starting development, consider the release timeline. If your production deployment is months away, starting with the Current release allows you to familiarize yourself with upcoming features that will stabilize in the next LTS.

## Version Lifecycle

Each LTS release receives approximately **30 months of total support**:
*   6 months as Current release
*   10 months as Active LTS (critical fixes and security updates)
*   14 months as Maintenance LTS (security fixes only)

This extended support window ensures at least 12 months of overlap between consecutive LTS versions, providing ample time for testing and migration. Organizations can plan upgrades on a predictable 2-year cycle, moving from one LTS to the next.

## Migration Strategy

The LTS model is designed to minimize disruption while ensuring applications stay secure and supported. When planning migrations:
*   **From LTS to LTS** - Recommended path for production systems (e.g., v18 → v20 → v22). Each jump represents approximately one year of development, with breaking changes clearly documented in migration guides.
*   **From Current to LTS** - If using an odd-numbered Current release, plan migration to the next even-numbered LTS release before the 6-month Current phase ends.
*   **Security patches** during the Maintenance phase are designed to be drop-in replacements with minimal risk. However, thorough testing in staging environments remains essential before production deployment.

## Backport Policy

Backporting involves taking specific fixes from newer versions and retrofitting (cherry-picking) them to LTS releases, ensuring production systems receive critical updates without the disruption of major upgrades. Our backport policy prioritizes stability while addressing essential security and reliability concerns.

The backport process is selective and risk-aware. Not all fixes from newer versions are suitable for backporting—only those that meet strict criteria for importance and stability. This approach ensures LTS releases remain stable and predictable while still receiving necessary updates.

### Backport Decision Matrix

The following matrix defines which types of fixes are backported to each support phase:

| Issue Type | Current | Active & Maintenance LTS |
| ---| ---| --- |
| Security vulnerability | ✅  | ✅  |
| Critical bug | ✅ | ✅ |
| Major/Minor bug | ✅ | ❌ |
| Performance | ✅ | ❌ |
| Feature | ✅ | ❌ |

*   **Security vulnerabilities** receive immediate attention across all supported versions, including those in Maintenance LTS. These fixes are prioritized and released as quickly as possible to protect production deployments.
*   **Critical bugs** that significantly impact functionality are backported to Active LTS releases in the next patch version. These fixes undergo thorough testing to ensure they don't introduce new issues.
*   **Major and Minor bugs and performance improvements** may be backported to Active LTS only when they present low risk and clear benefit. The evaluation considers the fix complexity, potential for regression, and number of affected users.
*   **New features** are never backported to LTS releases. This policy maintains the stability promise of LTS versions—users can confidently apply updates knowing they contain only fixes, not functionality changes that might require application modifications.

## Support Commitment

Starting with version `17.0.0`, this LTS policy provides enterprise customers with the predictability and stability required for mission-critical applications. Version `16.x`, already in widespread production use, retroactively becomes our first Active LTS release, ensuring existing deployments receive continued support under this new model.

The commitment to long-term support reflects Handsontable's maturity as an enterprise-grade data grid solution. By maintaining multiple versions simultaneously and providing clear upgrade paths, we enable organizations to adopt Handsontable with confidence, knowing their investment is protected by a comprehensive support strategy.