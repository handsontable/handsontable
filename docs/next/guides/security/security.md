---
title: Security
permalink: /next/security
canonicalUrl: /security
---

# Security

[[toc]]

## Overview

https://mariadb.com/vulnerability-reporting/ 
https://www.tiny.cloud/docs/advanced/security/
https://www.ag-grid.com/react-grid/security/
https://mariadb.com/trust/
https://docs.sonarqube.org/latest/user-guide/security-rules/#header-2
https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP 

- No server connection
That means that the server-side implementation for loading/saving data coming from the front-end side of the app is a users responsibility. Handsontable doesn't make any connection to any server, even when validiting the license key (it's done 100% offline).
- Content Security Policy (CSP)
- Securitum certificate (Nov 30, 2020) of v8.2.0 (OWASP TOP10 / OWASP ASVS)
- Snyk - https://snyk.io/test/github/handsontable/handsontable?targetFile=package.json
- XSS vulnerabilities - we recommend using server-side content validation
- Content sanitizing - we use https://www.npmjs.com/package/dompurify (yet, still recommend server-side validation)
- Data transportation - again, Handsontable is a front-side library so we can just recommend cryptographic solution to don't expose the data to attackers.
- Our policy to fix issues as fast as possible (keep the library up to date)
- SonarQube results (soon) - as of April 2021 we're getting through the SonarQube test which tests the code against the security-standards such as CWE and OWASP Top 10.
- Insurance (up to $1M) in Lloyds of London
- Reporting violations
Please write to support@handsontable.com
- Compensation
We don't offer a bug bounty program but we deeply appreciate the work done by security researches and independent developers.
