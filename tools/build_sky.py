#!/usr/bin/env python3
"""Build js/data/sky.js from the d3-celestial catalogs (BSD-3, Olaf Frohn).

Everything is converted to ecliptic coordinates (lambda, beta) so the
horoscope sky can be drawn as a strip with the ecliptic running straight
through the middle.

    python3 tools/build_sky.py
"""
import json, math, os, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
OUT = os.path.join(HERE, "..", "js", "data", "sky.js")
BASE = "https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/"
FILES = {"stars.json": "stars.6.json", "lines.json": "constellations.lines.json",
         "names.json": "starnames.json", "cons.json": "constellations.json"}

EPS = math.radians(23.4393)
BAND = 62          # keep stars within this ecliptic latitude
MAG_LIMIT = 5.9
ZODIAC = ["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"]


def load(name):
    os.makedirs(SRC, exist_ok=True)
    path = os.path.join(SRC, name)
    if not os.path.exists(path):
        urllib.request.urlretrieve(BASE + FILES[name], path)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def ecl(ra_deg, dec_deg):
    a, d = math.radians(ra_deg % 360), math.radians(dec_deg)
    sb = math.sin(d) * math.cos(EPS) - math.cos(d) * math.sin(EPS) * math.sin(a)
    b = math.asin(sb)
    lam = math.atan2(math.sin(a) * math.cos(EPS) + math.tan(d) * math.sin(EPS), math.cos(a))
    return round(math.degrees(lam) % 360, 2), round(math.degrees(b), 2)


def circ_mean(lams):
    s = sum(math.sin(math.radians(l)) for l in lams)
    c = sum(math.cos(math.radians(l)) for l in lams)
    return math.degrees(math.atan2(s, c)) % 360


def unwrap(l, ref):
    """Return l shifted by 360 so it is closest to ref."""
    while l - ref > 180: l -= 360
    while l - ref < -180: l += 360
    return l


def main():
    stars, lines, names, cons = (load(n) for n in ("stars.json", "lines.json", "names.json", "cons.json"))
    con_names = {f["id"]: f["properties"]["name"] for f in cons["features"]}

    # --- background stars --------------------------------------------------
    out_stars, by_pos = [], {}
    for f in stars["features"]:
        mag = f["properties"]["mag"]
        if mag > MAG_LIMIT:
            continue
        ra, dec = f["geometry"]["coordinates"]
        lam, bet = ecl(ra, dec)
        try:
            bv = float(f["properties"]["bv"])
        except (TypeError, ValueError):
            bv = 0.6
        by_pos[(round(ra, 2), round(dec, 2))] = (f["id"], mag)
        if abs(bet) <= BAND:
            out_stars.append([lam, bet, round(mag, 1), round(bv, 2)])
    out_stars.sort(key=lambda s: s[2])

    # --- constellations ------------------------------------------------------
    out_cons = []
    for f in lines["features"]:
        cid = f["id"]
        segs = []
        for line in f["geometry"]["coordinates"]:
            segs.append([ecl(ra, dec) for ra, dec in line])
        pts = [p for s in segs for p in s]
        c_lam = circ_mean([p[0] for p in pts])
        c_bet = sum(p[1] for p in pts) / len(pts)
        if abs(c_bet) > BAND - 5 and cid not in ZODIAC:
            continue
        # unwrap every vertex around the centre so polylines never jump 360 deg
        segs = [[[round(unwrap(l, c_lam), 2), b] for l, b in s] for s in segs]
        entry = {"id": cid, "name": con_names.get(cid, cid), "c": [round(c_lam, 2), round(c_bet, 2)], "l": segs}
        if cid in ZODIAC:
            # vertex stars, with magnitude and proper names where known
            verts, seen = [], set()
            for line in f["geometry"]["coordinates"]:
                for ra, dec in line:
                    key = (round(ra, 2), round(dec, 2))
                    if key in seen:
                        continue
                    seen.add(key)
                    hip, mag = by_pos.get(key, (None, 4.5))
                    nm = names.get(str(hip), {}) if hip is not None else {}
                    label = nm.get("name") or ""
                    l, b = ecl(ra, dec)
                    verts.append([round(unwrap(l, c_lam), 2), b, round(mag, 1), label, nm.get("desig", "")])
            entry["v"] = verts
            lams = [v[0] for v in verts]
            bets = [v[1] for v in verts]
            entry["box"] = [min(lams), min(bets), max(lams), max(bets)]
            bright = min(verts, key=lambda v: v[2])
            entry["bright"] = [bright[3] or bright[4], bright[2]]
        out_cons.append(entry)

    # --- galactic equator (for the milky way band) ---------------------------
    # galactic -> equatorial (J2000)
    ra_gp, dec_gp, l_ncp = math.radians(192.85948), math.radians(27.12825), math.radians(122.93192)
    mw = []
    for l in range(0, 360, 4):
        for b in (0,):  # band centre line
            lr, br = math.radians(l), math.radians(b)
            sd = math.sin(br) * math.sin(dec_gp) + math.cos(br) * math.cos(dec_gp) * math.cos(l_ncp - lr)
            dec = math.asin(sd)
            y = math.cos(br) * math.sin(l_ncp - lr)
            x = math.sin(br) * math.cos(dec_gp) - math.cos(br) * math.sin(dec_gp) * math.cos(l_ncp - lr)
            ra = ra_gp + math.atan2(y, x)
            lam, bet = ecl(math.degrees(ra), math.degrees(dec))
            # galactic centre region is brighter
            glow = 1.0 if (l < 60 or l > 300) else 0.55
            mw.append([lam, bet, glow])

    data = {"stars": out_stars, "cons": out_cons, "milky": mw}
    js = "/* generated by tools/build_sky.py from d3-celestial (BSD-3, (c) Olaf Frohn) */\n"
    js += "window.MA = window.MA || {};\nMA.SKY = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"stars={len(out_stars)} constellations={len(out_cons)} bytes={len(js)}")
    for c in out_cons:
        if c["id"] in ZODIAC:
            print(c["id"], c["c"], c["bright"], len(c["v"]))


if __name__ == "__main__":
    main()
