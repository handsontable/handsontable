### 1.9.3

- Fix #184: Accurate, up-to-date type definitions for TypeScript. Thanks @dpoggi.
- Fix #196: Fix german language specifications. Thanks @Ben305.
- Fix #197: Add detection for Meteor. Thanks @Ben305.
- Fix #206: fix number formats for de-CH. Thanks @Remo.

### 1.9.2

- Fix #195: Fixed wrong results from formatForeignCurrency. Thanks @Ben305.

### 1.9.1

- Add forgotten files

### 1.9.0

- Fix #192: Add locales en-AU and en-NZ. Thanks @Ben305.
- Fix #193: Add function formatForeignCurrency. Thanks @Ben305.
- Fix #194: Fix undefined error on React native. Thanks @abalhier.

### 1.8.1

- Fix #182: Added support for numbers without leading zero. Thanks @budnix.
- Fix #183: Number validation doesn't validate negative numbers. Thanks @budnix.

### 1.8.0

- Fix #180: Add culture function, deprecate language. Thanks @wereHamster.
- Fix #170: Add the ability to determine units without formatting. Thanks @pickypg.
- Fix #162: Add TypeScript declaration file. Thanks @wereHamster.
- Fix #163: unformat: return undefined when value can't be parsed. Thanks @wereHamster.
- Fix #173: Added two latest stable node versions to Travis build. Thanks @therebelrobot.
- Fix #176: default pt-BR currency is prefix, not postfix. Thanks @luisrudge.
- Fix #175: Zero byte unit fix, take 2. Thanks @therebelrobot.
- Fix #135: Fix fr-CA currency format. Thanks @killfish.
- Fix #174: Set versions for all deps. Thanks @BenjaminVanRyseghem.
- Fix #152: Use zeros() function instead of multiple inline implementations. Thanks @MarkHerhold.

### 1.7.1

- Fix #142: Limit packaging extraneous files. Thanks @MarkHerhold.
- Fix #143: Fixing web build. Thanks @mmollick.
- Fix #149: Allow loading of cultures in node explicitly if numbro hasn't detected correctly that it is in node. Thanks @stewart42.
- Fix #147: Fixing formatting issues for very small (+/-1e-23) numbers. Thanks @MarkHerhold.

### 1.7.0

- Fix decimal rounding issue. Thangrks @Shraymonks.
- Fix #114: webpack bundling. Thanks @mmollick.
- Add ko-KR & zh-TW support. Thanks @rocketedaway and @rWilander.
- Add existence check for require. Thanks @jamiter.
- Improve verbatim feature. Thanks @jneill.

### 1.6.2

- Fix deprecated use of `language` and introduce `cultureCode`. Thanks @BenjaminVanRyseghem

### 1.6.1

- Fix languages to use proper intPrecision. Thanks @BenjaminVanRyseghem
- Fix `intPrecision` when value is 0. Thanks @BenjaminVanRyseghem

### 1.6.0

- Introduce new API functions:

	- setCulture
	- culture
	- cultureData
	- cultures
	
- Deprecate API functions:

	- setLanguage
	- language
	- languageData
	- languages

Those deprecated functions will be removed in version 2.0.0

### 1.5.2

- Fixed scoping issue. Thanks @tuimz
- #68 Format decimal numbers. Thanks @BenjaminVanRyseghem
- #70 v1.5.0 error with browserify. Thanks @BenjaminVanRyseghem
- #71 Incorrectly reporting hasModule = true. Thanks @BenjaminVanRyseghem
- #72 the currency symbol is $ which is a currency symbol already by itself (the dollar..). Thanks @BenjaminVanRyseghem
- #76 ability to "pad" a number in formatting. Thanks @BenjaminVanRyseghem
- #79 browserify attempts to load all language files. Thanks @BenjaminVanRyseghem
- #106 Exception on large number formatting. Thanks @andrewla

### 1.5.1
 
- #78 Why is 0 formatted as +0?. Thanks to @clayzermk1
- #80 currency format "+$..." produces output "$+...". Thanks to @clayzermk1
- Fixes German separator. Thanks to @gka

### 1.5.0

- Adds support for Hebrew (he-LI). Thanks to @eli-zehavi

### 1.4.0

- #62 using languages in node. Thanks @alexkwolfe

### 1.3.3

- #64 multiply loses accuracy on minification. Thanks @rafde

### 1.3.2

- Fix issue with the release process

### 1.3.1

- Fix context issue when in strict mode. Thanks @avetisk

### 1.3.0

- #53 Max significant numbers formating. Thanks @BenjaminVanRyseghem
- #57 Broken reference to this in languages. Thanks @BenjaminVanRyseghem

### 1.2.2

- Remove old minified files

### 1.2.1

- Forgot to build when published

### 1.2.0

- #27 Binary and decimal bytes. Thanks @clayzermk1 and @Graham42
- #26 Jshint improvemnents. Thanks @baer and @Graham42
- Fixes french ordinal. Thanks @BenjaminVanRyseghem
- #32 Use svg instead of png to get better image quality. Thanks @PeterDaveHello
- #33 Correct culture code for Español. Thanks @maheshsenni
- #34 Clean up locales info. Thanks @Graham42
- #36 Improve `dist/` layout. Thanks @Graham42
- #35 Correct Polish currency symbol. Thanks @Graham42
- Fixes Swedish tests. Thanks @BenjaminVanRyseghem
- Fixes inconsistent white spaces. Thanks @BenjaminVanRyseghem
- #44 Tests for culture code format. Thanks @maheshsenni
- #50 added en-ZA language. Thanks @stewart42

### 1.1.1

- Fixes minified version number. Thanks @BenjaminVanRyseghem
- Removes old minified files. Thanks @Graham42

### 1.1.0

- Adds `languages` to expose all registered languages. Thanks @NicolasPetton
- Adds support for filipino. Thanks @Graham42 and @mjmaix
- Adds support for farsi. Thanks @Graham42 and @neo13

### 1.0.5

- Improves release process. Thanks @Graham42
- Updates the `README` file. Thanks @Graham42
- Fixes Danish currency symbol. Thanks @Graham42 and @philostler
- Fixes npm/bower dependencies. Thanks @BenjaminVanRyseghem
- Cleans up Numeral-js leftovers. Thanks @uniphil
- Updates homepage url. Thanks @BenjaminVanRyseghem
- Rebases on Numeraljs to keep git history. Thanks @uniphil @Graham42

### 1.0.4

Fork `numeraljs` v1.5.3, renaming everything to `numbro`

----

_For changes before `numbro` forked [`numeral-js`](https://github.com/adamwdraper/Numeral-js), see [CHANGELOG-Numeraljs.md](CHANGELOG-Numeraljs.md)._
