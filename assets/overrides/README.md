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

The Persona 5 deck lives in `p5/`: one WebP per card (`back.webp`, `00-fool.webp` … `21-world.webp`, Rider–Waite
numbering), so a reading only downloads the cards it shows. They're already registered in `manifest.js`.

The Jackie Chan Adventures talismans live in `jca/`: one 224 × 224 transparent WebP per animal (`rat.webp` … `pig.webp`;
the Sheep talisman is `goat.webp`), cut from a sheet of the twelve medallions. They're registered in `manifest.js` too.

A value can also point at a region of one texture atlas instead of a separate file:

```js
"tarot/p5/0": { src: "deck.webp", size: [5131, 3076], rect: [514, 1, 512, 1024] },  // x, y, w, h in atlas pixels
```

Only use images you have the right to publish.
