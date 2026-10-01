# Custom art overrides

Every picture on the site is drawn from vector icons, so the site works with no image files at all.
If you want your own art (for example, scans of the talisman medallions or your own card art),
drop the image in this folder and register it in `manifest.js`.

| Key | Where it shows |
| --- | --- |
| `imperial/<animal>`, `jca/<animal>`, `cultivation/<animal>` | Chinese zodiac emblem for that theme (`rat`, `ox`, `tiger`, `rabbit`, `dragon`, `snake`, `horse`, `goat`, `monkey`, `rooster`, `dog`, `pig`) |
| `figure/<sign>` | Translucent figure drawn over a constellation (`aries` … `pisces`). Square, transparent PNG works best. |
| `tarot/<skin>/<n>` | Card art for skin `classic`, `p5` or `jojo`, major arcana number `0`–`21` (Rider–Waite numbering: 8 Strength, 11 Justice) |
| `tarot/<skin>/back` | Card back for that skin |

Example:

```js
MA.OVERRIDES = {
  "jca/dragon": "jca/dragon.png",
  "figure/leo": "figures/leo.png",
};
```

A value can also point at a region of one texture atlas instead of a separate file:

```js
"tarot/p5/0": { src: "arcana.webp", size: [5131, 3076], rect: [514, 1, 512, 1024] },  // x, y, w, h in atlas pixels
```

`arcana.webp` is the Persona 5 deck (back plus 22 Major Arcana in Marseille order on a 10 × 3 grid of
513 × 1025 px cells). Its regions are already listed in `manifest.js`.

Only use images you have the right to publish.
