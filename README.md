# ✦ Mystic Atlas

Tarot, a navigable star map horoscope and the Chinese zodiac in one static site, read with your own birth data.
It is plain HTML/CSS/JS with no build step and no backend, so it runs on GitHub Pages as-is.

## Sections (dropdown, top-left)

| Section | What it does | Skins / themes (top-right) |
|---|---|---|
| **Tarot** | Card of the day (seeded by you + date), Past·Present·Future, and Birth Cards (personality, soul, name and year numerology). 22 Major Arcana, reversals included. | **Classic** · **Phantom Thief** (Persona 5: Confidants, ransom-note type, calling card, codename and Persona) · **Bizarre** (JoJo: every arcana as its Stardust Crusaders Stand with a stat hexagon, plus your own generated Stand) |
| **Horoscope** | Real sky (≈3,900 stars plus constellation lines from the Hipparcos-based d3-celestial catalog). Drag, scroll or pinch to travel along the ecliptic. Picking a sign flies the camera there, draws the lines, highlights the named stars and fades in the figure. Today's Sun and Moon (with phase) are plotted, along with your birth Sun and Moon. Shows sun and moon sign and a daily reading. Arrow keys step through signs. | — |
| **Chinese Zodiac** | Your animal by Lunar New Year (uses `Intl` Chinese calendar), the 12-animal wheel with trines, secret friend, clash and harm, Four Pillars (BaZi), a Five Elements (Wu Xing) cycle diagram, yin-yang balance, Day Master reading, favourable and missing elements, a reading for this year and your Kua number. | **Imperial** (fortune sticks) · **Talisman Hunt** (Jackie Chan Adventures talismans with their powers, "Activate!" effects, Section 13 file) · **Cultivation** (Dao name, spiritual root, realm, sect, tribulation countdown) |

Your data (name, birth date/time, gender, birthplace) is entered via the button at the top-right
and stored only in `localStorage`. Gender is used for the Kua number. Without a birth time the
hour pillar is skipped and the Moon sign is flagged if it changed that day.

Deep links: `#tarot`, `#horoscope/leo`, `#zodiac/dragon`. Extras: `?demo=1` loads a demo profile, `?skin=p5|jojo|classic|imperial|jca|cultivation`.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
(Opening `index.html` directly also works.)

## Deploy to GitHub Pages

```bash
git remote add origin git@github.com:<you>/mystic-atlas.git
git push -u origin main
```
Then go to **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
The site will be at `https://<you>.github.io/mystic-atlas/`. A `.nojekyll` file is included.

## Custom art

All art is vector, so no image files are required. To use your own images (e.g. talisman scans), see
[`assets/overrides/README.md`](assets/overrides/README.md).

## Regenerating data

```bash
python3 tools/build_sky.py                          # downloads d3-celestial data into tools/src/
git clone --depth 1 https://github.com/game-icons/icons /tmp/gi
python3 tools/build_icons.py /tmp/gi
```

## Credits

- Star and constellation data: [d3-celestial](https://github.com/ofrohn/d3-celestial) by Olaf Frohn, BSD-3-Clause.
- Icons: [game-icons.net](https://game-icons.net) by Lorc, Delapouite, Caro Asercion, Skoll and DarkZaitzev, CC BY 3.0.
- Astronomy formulas after Jean Meeus, *Astronomical Algorithms*.
- Fan-made for fun. Persona 5 © Atlus/SEGA, JoJo's Bizarre Adventure © Hirohiko Araki/Shueisha,
  Jackie Chan Adventures © Sony Pictures Television. Not affiliated with any of them. Not actual fortune-telling.
