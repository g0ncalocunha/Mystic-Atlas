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
"tarot/p5/0": { src: "images.jpg", size: [577, 346], rect: [58.7, 0, 55, 107] },  // x, y, w, h in atlas pixels
```

`images.jpg` is the Persona 5 deck (back plus 22 Major Arcana in Marseille order). Its regions are already
listed in `manifest.js`. A sharper version with the same layout can be dropped in by updating `size`
(the rects scale proportionally) — e.g. a 2× image: `size: [1154, 692]` and every rect doubled.

Only use images you have the right to publish.
