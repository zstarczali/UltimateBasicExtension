# Ultimate Basic — VS Code Extension

Language support for **Ultimate Basic** (`.ub`), a modern BASIC-like language that compiles directly to **6502 machine code** for the Commodore 64. Write C64 programs with syntax highlighting, code snippets and one-click build & run in VICE — all from VS Code.

*© 2026 Zsolt Tarczali*

---

## Features

- **Syntax highlighting** — keywords, types, C64-specific statements, numbers (decimal, hex `$D020`, binary `%1010`), comments (`#`, `rem`, `;`)
- **30+ code snippets** — `if`, `for`, `while`, `sub`, `sprdef`, `mainloop`, `bitmapskel` and more
- **Auto-indent** — smart indentation for `if/end`, `for/next`, `sub/end`, `sprdef/end`, `while/end` blocks
- **Build & Run commands** — compile and launch directly in VICE with a single command
- **Context menu** — right-click any `.ub` file for quick access to Build / Build & Run
- **Task integration** — works with the VS Code Task system (`Ctrl+Shift+B`)

---

## Requirements

- [Ultimate Basic compiler](https://github.com/nextbasic)
- [VICE C64 emulator](https://vice-emu.sourceforge.io) *(only required for Build & Run)*

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `ultimateBasic.compilerPath` | `ultimate-basic` | Full path to the compiler executable |
| `ultimateBasic.vicePath` | `x64sc` | Full path to the VICE C64 emulator executable |
| `ultimateBasic.viceArgs` | `[]` | Extra arguments passed to VICE, e.g. `["-fullscreen"]` |
| `ultimateBasic.defaultOutputDir` | *(source directory)* | Output directory for compiled `.prg` files |

**Example** (`settings.json`):
```json
{
  "ultimateBasic.compilerPath": "C:\\tools\\ultimate-basic.exe",
  "ultimateBasic.vicePath": "C:\\VICE\\x64sc.exe",
  "ultimateBasic.viceArgs": ["-fullscreen"]
}
```

---

## Commands

Access via `Ctrl+Shift+P` → `Ultimate Basic: ...` or by **right-clicking** a `.ub` file.

| Command | Description |
|---|---|
| **Build (.prg)** | Compile the active `.ub` file to a `.prg` |
| **Build (verbose)** | Compile with zero-page layout and hex dump output |
| **Build + D64 disk image** | Compile and also produce a `.d64` disk image |
| **Build & Run in VICE** | Compile, then automatically launch VICE on success |
| **Build D64 & Run in VICE** | Produce a `.d64` disk image, then launch VICE |

---

## Snippets

| Prefix | Inserts |
|---|---|
| `if`, `ife` | if/then, if/then/else block |
| `for`, `fors` | for..next loop (with or without step) |
| `while`, `loop`, `loopc` | while / infinite / counted loop |
| `sub` | subroutine definition |
| `sprdef` | 21-row sprite data block template |
| `mainloop` | full main loop skeleton (keyboard handling, Q = quit) |
| `bitmapskel` | bitmap graphics skeleton |
| `var`, `varw`, `vars`, `vara` | variable declaration (int / word / string / array) |
| `const` | compile-time constant |
| `getch`, `joy` | keyboard / joystick read |
| `poke`, `peek` | memory write / read |
| `sound` | SID sound |
| `sprite` | sprite setup (position + enable + color) |
| `plot`, `line`, `circle` | pixel, line and circle drawing |
| `gon`, `gonm`, `goff` | graphics on / multicolor / off |
| `include`, `incbin` | source file include / binary embed |
| `reustash`, `reufetch` | REU memory transfer |
| `asm` | inline assembly block |
