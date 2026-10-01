# Custom art overrides

Every picture on the site is drawn from vector icons, so the site works with no image files at all.
If you want your own art (for example, scans of the talisman medallions or your own card art),
drop the image in this folder and register it in `manifest.js`.

| Key | Where it shows |
| --- | --- |
| `imperial/<animal>`, `jca/<animal>`, `cultivation/<animal>` | Chinese zodiac emblem for that theme (`rat`, `ox`, `tiger`, `rabbit`, `dragon`, `snake`, `horse`, `goat`, `monkey`, `rooster`, `dog`, `pig`) |
| `figure/<sign>` | Translucent figure drawn over a constellation (`aries` … `pisces`). Square, transparent PNG works best. |
| `tarot/<skin>/<n>` | Card art for skin `classic`, `p5` or `jojo`, major arcana number `0`–`21` |

Example:

```js
MA.OVERRIDES = {
  "jca/dragon": "jca/dragon.png",
  "figure/leo": "figures/leo.png",
};
```

Only use images you have the right to publish.
