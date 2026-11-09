# Changelog

All notable changes to the Ultimate Basic extension are listed here. The compiler versions in brackets
(e.g. *UB 1.6.3*) are the Ultimate Basic releases whose language elements the extension follows.

## [0.4.2] — 2026-11-09

### Changed
- README: a *Getting started* section for the Marketplace install replaces the local `.vsix` instructions,
  which moved to *Building from source*; the compiler link points to the
  [Ultimate Basic releases](https://github.com/zstarczali/UltimateBasic/releases).
- `package.json`: the repository link points to this repository; `"license": "MIT"`.
- This changelog.

## [0.4.1] — 2026-10-31

### Changed
- `ultimateBasic.defaultOutputDir` and the `ultimateBasic.d64AddFiles` entries are resolved to absolute paths:
  relative values are taken against the source's workspace folder (or the source's folder without a workspace),
  and `${workspaceFolder}` works.

### Fixed
- The output directory is created before a build when it does not exist (the compiler does not create folders).
- `.claude/**` is no longer packed into the `.vsix`.

## [0.4.0] — 2026-10-25

*UB 1.6.4 – 1.6.6*: floating point, `PRINT USING`, source options, richer struct types.

### Added
- Grammar: float literals (`2.5`, `.5`, `1E6`, `2.5e-3`), the `^` operator, `SQR` / `TAN` / `ATN` / `EXP` / `LOG` /
  `FIX` / `CINT` / `CSNG` / `CDBL`, bare `rnd`, `PRINT USING`, `option basic print` / `option strings`,
  `TYPE name … END TYPE`, `STRING * n` fields, `AS TypeName` struct parameters.
- Formatter and auto-indent for `type … endtype` and `TYPE … END TYPE` blocks.
- Setting `ultimateBasic.basicPrint` (passes `--basic-print`).
- Snippets: `dimd`, `floatfn`, `pow`, `forf`, `rndf`, `printusing`, `optbp`, `optstr`, `typeq`, `typefield`,
  `substruct`, …

## [0.3.0] — 2026-10-08

*UB 1.6.3*: QBasic-style syntax and runtime strings.

### Added
- Grammar: `DIM`, `FUNCTION`, `ELSEIF`, `DO`, `WEND`; `AS` with `BYTE` / `INTEGER` / `WORD` / `SINGLE` / `DOUBLE` /
  `STRING`; `CASE IS`; `LEFT$` / `RIGHT$` / `MID$`; `'` comments; the `<>` operator.
- Formatter and auto-indent for `ELSEIF`, `DO … LOOP [UNTIL|WHILE]`, `WHILE … WEND`, `FUNCTION` blocks and
  one-line `DO` / `WHILE` loops.
- 22 snippets: `dim`, `dima`, `function`, `subq`, `ifelseif`, `dow`, `dou`, `wend`, `selectcase`, `exitq`,
  `left` / `right` / `mid`, `concat`, `prints`, `inputq`, …

### Fixed
- An uppercase `IF … THEN` did not indent its block.

## [0.2.0] — 2026-05-23 … 2026-10-04

The first releases, developed under one version number.

### Added
- Language `ultimate-basic` for `.ub` files: syntax highlighting, auto-closing pairs, folding, indentation rules.
- **Build commands**: `.prg`, verbose build, `.d64` disk image (with `ultimateBasic.d64AddFiles` → `--add`),
  Magic Desk `.crt` cartridge, debug symbols (`--debug` → `.sym` / `.dbg` / `.vs`), asm listing (`--asm`),
  Exomizer — with *Run in VICE* variants, a task provider and a problem matcher.
- **Formatter** (*Format Document* and *Ultimate Basic: Format Document*) with `select` / `case` handling.
- Settings for the compiler, VICE, the output folder, Exomizer and `--explicit` mode.
- Snippets following the language from the first release to *UB 1.6.2*: graphics and block graphics
  (80×50), charsets, sprites, sound and the `tune` tracker (with `imod` / `ifilt` / `igate` / `itab`), `sfx`,
  maps (`map view`, `map load`, scrolling), I/O and disk (`load`, `save`, `open`, `chain`), REU, U64 turbo,
  IRQ / NMI / CIA timers, `fn` functions, `select` / `case`, `times` loops, 16-bit memory and more.

### Fixed
- Quoted compiler / VICE paths run in PowerShell (the `&` call operator is added on Windows).
- The `tune` grammar and snippet use the real `speed` / `inst` / `order` / `pat` syntax.

[0.4.2]: https://github.com/zstarczali/UltimateBasicExtension/compare/916fa1d...dev
[0.4.1]: https://github.com/zstarczali/UltimateBasicExtension/compare/12776b0...916fa1d
[0.4.0]: https://github.com/zstarczali/UltimateBasicExtension/compare/24663e1...12776b0
[0.3.0]: https://github.com/zstarczali/UltimateBasicExtension/compare/f04a658...24663e1
[0.2.0]: https://github.com/zstarczali/UltimateBasicExtension/compare/a07e7b5...f04a658
