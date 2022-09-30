---
title: Security
metaTitle: Security - JavaScript Data Grid | Handsontable
description: Learn about the security measures we take to make sure you can safely implement Handsontable in your client-side application.
permalink: /security
canonicalUrl: /security
react:
  metaTitle: Security - React Data Grid | Handsontable
searchCategory: Guides
---

# Security

[[toc]]

## Overview

At Handsontable, we take security very seriously. We integrate with Security Tools and Policies to provide a secure data grid. This document provides information on our Security Certification, Audits, and Policies.

## Secure data transportation

Handsontable's software is browser-based, and does not communicate with a server. We do not offer or provide recommendations for application-specific back-end solutions.

You need to ensure that the data transportation method that you use, both at the back-end and the front-end, is secure.

## Content Security Policy (CSP)

CSP is an added layer of security used to detect and diminish certain types of attacks, including Cross-Site Scripting ([XSS](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting)) and data theft.

Handsontable doesn't use external fonts, images, or scripts. Depending on whether you are hosting locally or by our recommended CDN (jsdelivr.net), you will need to use one of the following CSP rules:

The CSP Rule for Handsontable hosted locally:
```js
default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

The CSP Rule for Handsontable hosted by CDN  - jsdelivr.net:
```js
default-src 'none'; script-src 'self' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net
```

## Third-party software

We use dependencies in the form of third-party software, and we take a responsibility to keep them up to date and secure. We also use [Fossa](https://fossa.com), third-party software, to stay compliant with third-party license terms.

## Content sanitizing

We use [dompurify](https://www.npmjs.com/package/dompurify) to sanitize the content put into the data grid. But we strongly recommend additional server-side validation to protect your data.

## High-quality code pledge

We pledge to deliver high-quality code. You can see our high-quality code score [here](https://lgtm.com/projects/g/handsontable/handsontable/context:javascript).

Our policy is to fix issues when they arise, as quickly as possible, and keep the library up to date. This requires from you, a user of this software, to keep your copy of Handsontable's software up to date.

## Security certificates

We regularly order security audits of the entire Handsontable codebase, carried out by independent cybersecurity experts.

The latest security audits:

| Handsontable version | Company   | Concluded on | Certificate                                 |
| -------------------- | --------- | ------------ | ------------------------------------------- |
| 8.2.0                | Securitum | Nov 30, 2020 | [Download]({{$basePath}}/securitum-certificate.pdf) |
| 11.1.0               | Seqred    | Feb 21, 2022 | [Download]({{$basePath}}/seqred-certificate.pdf)    |

The security audits were carried out in accordance with industry-standard methodologies, including:
- OWASP Top 10
- OWASP Application Security Verification Standard (ASVS)

For detailed security reports, contact our [Support Team](https://handsontable.com/contact).

## Code auditing

We use [Snyk](https://snyk.io/test/github/handsontable/handsontable?targetFile=package.json) to audit our code. Snyk integrates seamlessly into our development workflows, checking for vulnerabilities in our source code and in any dependencies, including open-source dependencies.

Snyk provides security status notifications via email or Slack, to:
 -  Monitor handsontable/handsontable:package.json in less than a minute
 -  Find vulnerabilities using Snyk’s market-leading database

## Insurance

We are insured by Lloyds of London. Our policy protects Handsontable and our customers:

| Our Customers                           | Handsoncode (Us)                                   |
| --------------------------------------- | -------------------------------------------------- |
| Cyber media liability                   | Loss or damage to the insured's data or networks   |
| Privacy liability and loss of documents | Business interruption                               |
| Breach of confidentiality liability     | Cyber theft                                        |
| Cyber security liability                | Cyber extortion                                    |
| Mitigation costs                        | Telephone hacking of the insured's telephone lines |
| Regulatory actions and fines            | Notification expenses                              |
| Damage to insured's reputation          | Damage of the insured's reputation                 |

## Code escrow

**This service is available for an additional fee. [Ask our Sales Team](https://handsontable.com/contact?category=request_for_quotation) about the pricing.**

Code Escrow ensures that software is maintained, protected, and not abandoned.

We host our code on GitHub, a trusted, safe platform hosted by Microsoft. In the unlikely event that something happened to our code on GitHub, a copy of our code is still protected and managed by [Codekeeper](https://codekeeper.co/), a source-code escrow company.

We deposit all of our code releases automatically into CodeKeeper. In the case of a release event, Codekeeper provides quick recovery 24/7/365.

## Report a security breach

Security of our software and its application in our customers' system is our top priority. Please report any suspicious activity or evidence to [security@handsontable.com](mailto:security@handsontable.com), and we will respond promptly.

## Bug bounty

We don't offer a bug bounty program, but we sincerely appreciate the work done by security researchers and independent developers.
