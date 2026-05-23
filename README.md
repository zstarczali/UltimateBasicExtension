# Ultimate Basic — VS Code Extension

Language support for **Ultimate Basic** (`.ub`), a modern BASIC-like language that compiles directly to **6502 machine code** for the Commodore 64. Write C64 programs with syntax highlighting, code snippets and one-click build & run in VICE — all from VS Code.

---

## Features

- **Syntax highlighting** — kulcsszavak, típusok, C64-specifikus utasítások, számok (decimális, hex `$D020`, bináris `%1010`), kommentek (`#`, `rem`, `;`)
- **30+ code snippet** — `if`, `for`, `while`, `sub`, `sprdef`, `mainloop`, `bitmapskel` és sok más
- **Auto-indent** — `if/end`, `for/next`, `sub/end`, `sprdef/end`, `while/end` blokkokhoz
- **Build & Run parancsok** — fordít és azonnal elindítja a VICE emulátort
- **Jobb klikk menü** — `.ub` fájlon egyenesen a Build / Build & Run parancsokhoz
- **Feladatintegráció** — VS Code Task rendszeren keresztül is futtatható (`Ctrl+Shift+B`)

---

## Gyors kezdés

1. Telepítsd a **Ultimate Basic** compilert: [github.com/nextbasic](https://github.com/nextbasic)
2. Telepítsd a **VICE** emulátort: [vice-emu.sourceforge.io](https://vice-emu.sourceforge.io)
3. Állítsd be az elérési utakat a Settings-ben (ld. lent)
4. Nyiss meg egy `.ub` fájlt — a syntax highlighting azonnal aktív

---

## Beállítások

| Beállítás | Alapértelmezett | Leírás |
|---|---|---|
| `ultimateBasic.compilerPath` | `ultimate-basic` | A compiler futtatható teljes elérési útja |
| `ultimateBasic.vicePath` | `x64sc` | A VICE C64 emulátor futtatható elérési útja |
| `ultimateBasic.viceArgs` | `[]` | Extra VICE argumentumok, pl. `["-fullscreen"]` |
| `ultimateBasic.defaultOutputDir` | _(forrás könyvtára)_ | Kimeneti `.prg` fájlok könyvtára |

**Példa** (`settings.json`):
```json
{
  "ultimateBasic.compilerPath": "C:\\tools\\ultimate-basic.exe",
  "ultimateBasic.vicePath": "C:\\VICE\\x64sc.exe",
  "ultimateBasic.viceArgs": ["-fullscreen"]
}
```

---

## Parancsok

Hozzáférés: `Ctrl+Shift+P` → `Ultimate Basic: ...`, vagy **jobb klikk** a `.ub` fájlon.

| Parancs | Leírás |
|---|---|
| **Build (.prg)** | Lefordítja a megnyitott `.ub` fájlt `.prg`-vé |
| **Build (verbose)** | Fordítás + zero-page elrendezés és hex dump |
| **Build + D64 disk image** | Fordítás + `.d64` lemezképet is generál |
| **Build & Run in VICE** | Fordítás, siker esetén automatikusan elindítja a VICE-t |
| **Build D64 & Run in VICE** | D64 generálás + VICE indítás |

---

## A nyelv röviden

### Változók és konstansok

```basic
var x = 10               # 8-bites egész (alapértelmezett)
var ptr: word = $0400    # 16-bites — két zero-page bájt
var msg = "HELLO"        # string változó (PETSCII, csak olvasható)
var scores = array(10)   # bájt tömb, 10 elem a $C000 felett
const BORDER = $D020     # fordítási idejű konstans (nem foglal ZP-t)
```

### Operátorok

```basic
x = x + 1
z = x and 15             # bitenkénti AND
w = a or b               # bitenkénti OR
v = a xor b              # bitenkénti XOR
m = x shl 3              # balra tolás
n = x shr 2              # jobbra tolás
```

Összehasonlítások: `==`  `!=`  `<`  `>`  `<=`  `>=`

### Elágazás és ciklusok

```basic
if x == 1 then
  print "YES"
else
  print "NO"
end

for i = 0 to 9
  print i
next

while x < 100
  x = x + 1
end

loop                     # végtelen ciklus
  if x == 255 then break end
end
```

### Szubrutinok és ugrások

```basic
sub set_color(col)
  color border col
  color text col
end

set_color(6)

label main_loop
  goto main_loop
```

### Tömbök és 16-bites változók

```basic
var scores = array(8)
scores[i] = 100
var v = scores[i]

var ptr: word = $0400
poke ptr, 6              # STA (ptr),Y — teljes 16-bites cím
var v = peek(ptr)        # LDA (ptr),Y
```

### C64 — képernyő és szín

```basic
cls                      # képernyő törlése (KERNAL $E544)
cls fast                 # gyors törlés
color text 14            # szöveg szín ($0286)
color border 6           # keret szín ($D020)
color bg 0               # háttér szín ($D021)
```

### C64 — bitmap grafika

```basic
graphics on              # hires bitmap mód (320×200, 1bpp)
graphics on multi        # multicolor bitmap mód (160×200, 4 szín/cella)
graphics off             # vissza szöveg módba
gcls                     # bitmap törlése ($2000–$3FFF)
plot x, y                # pixel rajzolás; x: 0–319, y: 0–199
line x1, y1, x2, y2      # Bresenham vonal
```

### C64 — sprite-ok

```basic
sprdef 0                 # sprite adat definíció (21 sor × 3 bájt = 63 bájt)
  0,126,0
  0,255,0
  # ... 21 sor összesen
end

sprite 0, x, y, $2000    # sprite 0: pozíció + adat pointer
sprite_on 0              # sprite 0 engedélyezése ($D015)
sprite_off 0             # sprite 0 letiltása
sprite_color 0, 7        # sprite 0 szín ($D027)
sprite_multicolor 0, on  # multicolor mód ($D01C)
var h = sprite_hit()     # sprite–sprite ütközés ($D01E)
var b = sprite_bg_hit()  # sprite–háttér ütközés ($D01F)
```

### C64 — hang (SID)

```basic
sound 0, $1CAD, 25       # voice 0, frekvencia, időtartam (PAL képkocka)
```

Frekvencia: `note_hz × 16.78` (PAL). Középső C (261.63 Hz) ≈ `$1CAD`.
Rögzített ADSR: `$09` / `$F0`, szawtooth hullámforma, mastervolume `$0F`.

### C64 — billentyűzet és joystick

```basic
var key = getch()        # vár a billentyűleütésre, PETSCII kódot ad vissza
var j = joy(2)           # joystick port 2 olvasása; bit0=fel, bit1=le, bit2=bal, bit3=jobb, bit4=tűz
```

### C64 — memória

```basic
poke $D020, 2            # STA $D020
var v = peek($D012)      # LDA $D012 (raszter sor)
```

### C64 — REU (RAM bővítő)

```basic
var ok = reu_present()
reu stash $4000, 0, $0000, 16384   # C64 → REU
reu fetch $4000, 0, $0000, 16384   # REU → C64
reu swap  $4000, 0, $0000, 256     # csere
```

### Beágyazott fájlok

```basic
include "defs.ub"        # másik .ub forrás beillesztése
incbin "sprites.bin"     # nyers bináris adat beágyazása
```

### Inline assembly

```basic
sys $FFD2                # JSR $FFD2 (KERNAL CHROUT)
asm $EA, $EA             # inline bájtok (NOP NOP)
asm {
  $A9 $07                # LDA #7
  $8D $86 $02            # STA $0286
}
```

### Matematikai függvények

```basic
var a = abs(x - 20)
var b = min(x, 39)
var c = max(x, 0)
var s = sgn(score)       # 0 = nulla, 1 = pozitív, $FF = negatív
var r = rnd()            # 0–255, LCG véletlenszám
var s = sin(angle)       # 0–255 szög → 0–255 érték (középpont: 128)
var c = cos(angle)       # = sin(angle + 64)
print hex(n)             # "FF" formátum
print bin(n)             # "00001010" formátum
```

---

## Code snippets (gyors bevitel)

| Prefix | Beillesztés |
|---|---|
| `if`, `ife` | if/then, if/then/else blokk |
| `for`, `fors` | for..next ciklus (step-pel vagy anélkül) |
| `while`, `loop`, `loopc` | while / végtelen / számolt ciklus |
| `sub` | szubrutin definíció |
| `sprdef` | 21-soros sprite adat sablon |
| `mainloop` | teljes főprogram váz (billentyűkezelés, Q=quit) |
| `bitmapskel` | bitmap grafika váz |
| `var`, `varw`, `vars`, `vara` | változó deklaráció (int / word / string / tömb) |
| `const` | konstans definíció |
| `getch`, `joy` | billentyű / joystick olvasás |
| `poke`, `peek` | memória írás / olvasás |
| `sound` | SID hang |
| `sprite` | sprite beállítás (pozíció + enable + szín) |
| `plot`, `line` | pixel és vonal rajzolás |
| `gon`, `gonm`, `goff` | grafika be / multicolor / ki |
| `include`, `incbin` | fájl beillesztés |
| `reustash`, `reufetch` | REU másolás |
| `asm` | inline assembly blokk |

---

## Ismert korlátok

| Terület | Korlát |
|---|---|
| Aritmetika | 8-bites, unsigned (0–255) |
| Word aritmetika | Nincs carry propagáció 16-bites összeadásnál |
| Tömbök | Csak bájt tömbök, max ~4 KB (`$C000–$CFFF`) |
| Szubrutinok | Nincs rekurzió — ZP paraméter slotok statikusak |
| String változók | Init után csak olvasható; értékadás csak a pointert cseréli |
| `plot` | Csak pixel-set (nincs XOR/törlés); nincs határellenőrzés |
| `rnd()` | Egyszerű LCG, periódus 256 |
| Hibakezelés | Csak fordítási időben |

---

## Compiler CLI referencia

```
ultimate-basic build <input.ub> [OPTIONS]

  -o, --output <file>   Kimeneti .prg fájl (alapértelmezett: <input>.prg)
  -v, --verbose         Zero-page elrendezés + hex dump kiírása
  --no-stub             BASIC SYS stub kihagyása (kód $0801-től tölt)
  --d64 <file>          .d64 lemezképet is generál
  -h, --help            Súgó
```

Sikeres fordítás után a compiler mindig kiírja a memória térképet (változók zero-page helyei, szubrutinok, tömbök, betöltési cím).
