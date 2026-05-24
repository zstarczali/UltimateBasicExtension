# Ultimate Basic — VS Code Extension

Language support for **Ultimate Basic** (`.ub`), a modern BASIC-like language that compiles directly to **6502 machine code** for the Commodore 64. Write C64 programs with syntax highlighting, code snippets and one-click build & run in VICE — all from VS Code.

*© 2026 Zsolt Tarczali*

---

## Features

- **Syntax highlighting** — keywords, types, C64-specific statements, numbers (decimal, hex `$D020`, binary `%1010`), comments (`#`, `rem`, `;`)
- **60+ code snippets** — `if`, `for`, `while`, `repeat`, `sub`, `sprdef`, `mainloop`, `bitmapskel` and more
- **Auto-indent** — smart indentation for `if/end`, `for/next`, `sub/end`, `sprdef/end`, `while/end`, `repeat/until` blocks
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
| `var`, `varw`, `vars`, `vara`, `varaw` | variable declaration (int / word / string / array / word array) |
| `const` | compile-time constant |
| `if`, `ife` | if/then, if/then/else block |
| `for`, `fors` | for..next loop (with or without step) |
| `while`, `loop`, `loopc` | while / infinite / counted loop |
| `repeat` | repeat/until do-while loop |
| `label`, `goto` | label definition / jump |
| `sub` | subroutine definition |
| `print`, `printv` | print string / print label + variable |
| `ctext`, `cborder`, `cbg`, `colors` | color text / border / bg / all three |
| `clsf` | fast screen clear |
| `cursor` | move cursor to column, row |
| `getch`, `inkey`, `joy` | keyboard (blocking / non-blocking) / joystick read |
| `poke`, `peek` | memory write / read (8-bit) |
| `poke16`, `peek16` | memory write / read (16-bit) |
| `fill` | fill memory range with value |
| `memcopy` | copy memory block |
| `sound` | SID sound |
| `wait`, `waitr` | wait N transitions / wait for raster line |
| `plot`, `plote`, `plotx` | set / erase / toggle pixel |
| `line`, `circle` | line and circle drawing |
| `gon`, `gonm`, `goff` | graphics on / multicolor / off |
| `don`, `doff` | display on / off (VIC DEN bit) |
| `sprdef` | 21-row sprite data block template |
| `sprite` | sprite setup (position + enable + color) |
| `spron`, `sproff` | sprite enable / disable |
| `sprcol` | sprite color |
| `sprmc` | sprite multicolor on/off |
| `sprex`, `sprey` | sprite expand x / expand y |
| `sprpri` | sprite priority (behind/in front of background) |
| `sprhit`, `sprbghit` | sprite collision checks |
| `data`, `read` | data table / read next byte |
| `numstr` | write number as 3-digit decimal string |
| `strtoint` | compile-time string to integer |
| `len`, `asc` | string length / first character PETSCII code |
| `input`, `inputp` | keyboard input (with / without prompt) |
| `load`, `loada`, `save` | load / save file to/from disk |
| `open`, `openp`, `close` | open / close serial file channel |
| `printhash` | send output to logical file (`print#`) |
| `irq` | raster IRQ setup with handler skeleton |
| `include`, `incbin` | source file include / binary embed |
| `reustash`, `reufetch`, `reuswap` | REU memory transfer |
| `reupresent` | check if REU is present |
| `sys` | JSR to KERNAL/ROM routine |
| `asm` | inline assembly block |
| `mainloop` | full main loop skeleton (keyboard handling, Q = quit) |
| `bitmapskel` | bitmap graphics skeleton |
