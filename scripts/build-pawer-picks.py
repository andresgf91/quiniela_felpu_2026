#!/usr/bin/env python3
"""Build tournament_picks payload for pawerquiniela.com from world_cup_2026_predictions.md"""

import json
import re
import subprocess
import urllib.request
from pathlib import Path

# (home_fifa, away_fifa) -> (home_score, away_score, penalty_winner_fifa or None)
# Parsed from world_cup_2026_predictions.md, keyed by team pairing
PAIR_PREDICTIONS = {
    # Group A
    ("MEX", "RSA"): (2, 0, None),
    ("KOR", "CZE"): (1, 1, None),
    ("MEX", "KOR"): (2, 1, None),
    ("CZE", "RSA"): (2, 0, None),
    ("CZE", "MEX"): (1, 1, None),
    ("RSA", "KOR"): (2, 0, None),
    # Group B
    ("CAN", "QAT"): (2, 1, None),
    ("SUI", "BIH"): (2, 0, None),
    ("CAN", "SUI"): (1, 1, None),
    ("BIH", "QAT"): (2, 1, None),
    ("SUI", "QAT"): (3, 1, None),
    ("CAN", "BIH"): (2, 1, None),
    # Group C
    ("BRA", "HAI"): (3, 0, None),
    ("MAR", "SCO"): (2, 0, None),
    ("BRA", "MAR"): (1, 0, None),
    ("SCO", "HAI"): (2, 1, None),
    ("BRA", "SCO"): (2, 0, None),
    ("MAR", "HAI"): (3, 0, None),
    # Group D
    ("USA", "PAR"): (2, 1, None),
    ("TUR", "AUS"): (1, 1, None),
    ("USA", "TUR"): (1, 1, None),
    ("AUS", "PAR"): (1, 0, None),
    ("USA", "AUS"): (2, 0, None),
    ("TUR", "PAR"): (2, 0, None),
    # Group E
    ("GER", "CUW"): (3, 0, None),
    ("ECU", "CIV"): (1, 1, None),
    ("GER", "ECU"): (1, 1, None),
    ("CIV", "CUW"): (2, 0, None),
    ("GER", "CIV"): (2, 1, None),
    ("ECU", "CUW"): (2, 0, None),
    # Group F
    ("NED", "JPN"): (1, 0, None),
    ("SWE", "TUN"): (2, 1, None),
    ("NED", "SWE"): (2, 0, None),
    ("JPN", "TUN"): (2, 0, None),
    ("NED", "TUN"): (2, 1, None),
    ("JPN", "SWE"): (2, 1, None),
    # Group G
    ("BEL", "EGY"): (2, 1, None),
    ("IRN", "NZL"): (1, 0, None),
    ("BEL", "IRN"): (1, 1, None),
    ("EGY", "NZL"): (2, 0, None),
    ("BEL", "NZL"): (3, 0, None),
    ("EGY", "IRN"): (1, 1, None),
    # Group H
    ("ESP", "CPV"): (3, 0, None),
    ("URU", "KSA"): (2, 0, None),
    ("ESP", "URU"): (2, 1, None),
    ("KSA", "CPV"): (1, 1, None),
    ("ESP", "KSA"): (2, 0, None),
    ("URU", "CPV"): (2, 0, None),
    # Group I
    ("FRA", "SEN"): (2, 1, None),
    ("NOR", "IRQ"): (3, 0, None),
    ("FRA", "NOR"): (1, 1, None),
    ("SEN", "IRQ"): (2, 0, None),
    ("FRA", "IRQ"): (3, 0, None),
    ("NOR", "SEN"): (1, 1, None),
    # Group J
    ("ARG", "JOR"): (3, 0, None),
    ("AUT", "ALG"): (2, 1, None),
    ("ARG", "AUT"): (2, 0, None),
    ("ALG", "JOR"): (3, 1, None),
    ("ARG", "ALG"): (2, 0, None),
    ("AUT", "JOR"): (2, 0, None),
    # Group K
    ("POR", "COL"): (1, 0, None),
    ("UZB", "COD"): (1, 1, None),
    ("POR", "UZB"): (3, 0, None),
    ("COL", "COD"): (2, 0, None),
    ("POR", "COD"): (2, 0, None),
    ("COL", "UZB"): (2, 0, None),
    # Group L
    ("ENG", "CRO"): (1, 0, None),
    ("GHA", "PAN"): (1, 0, None),
    ("ENG", "PAN"): (3, 0, None),
    ("CRO", "GHA"): (2, 0, None),
    ("ENG", "GHA"): (2, 0, None),
    ("CRO", "PAN"): (2, 1, None),
}

# Knockout: FIFA match number -> (home_score, away_score, penalty_winner)
# Teams per our bracket simulation in the MD
KNOCKOUT_PREDICTIONS = {
    73: (1, 2, None),   # Czechia vs Canada
    74: (3, 1, None),   # Germany vs Australia
    75: (2, 1, None),   # Netherlands vs Morocco
    76: (2, 1, None),   # Brazil vs Japan
    77: (3, 0, None),   # France vs Sweden
    78: (1, 2, None),   # Ecuador vs Norway
    79: (2, 1, None),   # Mexico vs Ivory Coast
    80: (2, 0, None),   # England vs Algeria
    81: (2, 0, None),   # USA vs Bosnia
    82: (2, 1, None),   # Belgium vs South Korea
    83: (2, 1, None),   # Colombia vs Croatia
    84: (2, 0, None),   # Spain vs Austria
    85: (1, 0, None),   # Switzerland vs Egypt
    86: (2, 1, None),   # Argentina vs Uruguay
    87: (2, 1, None),   # Portugal vs Senegal
    88: (2, 0, None),   # Türkiye vs Iran
    89: (1, 2, None),   # Germany vs France
    90: (0, 2, None),   # Canada vs Netherlands
    91: (2, 1, None),   # Brazil vs Norway
    92: (1, 2, None),   # Mexico vs England
    93: (1, 3, None),   # Colombia vs Spain
    94: (2, 1, None),   # USA vs Belgium
    95: (2, 0, None),   # Argentina vs Türkiye
    96: (1, 2, None),   # Switzerland vs Portugal
    97: (2, 1, None),   # France vs Netherlands
    98: (3, 1, None),   # Spain vs USA
    99: (1, 1, "ENG"),  # Brazil vs England (pens)
    100: (2, 1, None),  # Argentina vs Portugal
    101: (1, 2, None),  # France vs Spain
    102: (1, 1, "ARG"), # England vs Argentina (pens)
    103: (2, 0, None),  # France vs England (3rd place)
    104: (2, 1, None),  # Spain vs Argentina (final)
}

SUPABASE_URL = "https://iwxyqkovicpiugqrydlo.supabase.co/rest/v1"


def get_anon_key() -> str:
    out = subprocess.check_output(
        ["curl", "-s", "https://pawerquiniela.com/assets/index-4ooRw4Z5.js"],
        text=True,
    )
    m = re.search(r'(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^"\']+)', out)
    if not m:
        raise RuntimeError("Could not find Supabase anon key")
    return m.group(1)


def fetch(path: str, anon: str):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/{path}",
        headers={"apikey": anon, "Authorization": f"Bearer {anon}"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def make_pick(home, away, pen_code, team_by_code):
    pick = {"home": home, "away": away}
    if pen_code:
        team = team_by_code.get(pen_code)
        if team:
            pick["penalty_winner_team_id"] = team["id"]
    return pick


def lookup_pair(home_code, away_code):
    """Find prediction for a home/away pairing, handling either orientation in source data."""
    direct = PAIR_PREDICTIONS.get((home_code, away_code))
    if direct:
        return direct
    flipped = PAIR_PREDICTIONS.get((away_code, home_code))
    if flipped:
        h, a, pen = flipped
        return (a, h, pen)
    return None


def main():
    anon = get_anon_key()
    teams = fetch("teams?select=id,name,fifa_code", anon)
    team_by_code = {t["fifa_code"]: t for t in teams}

    pawer_matches = []
    offset = 0
    while True:
        batch = fetch(
            "matches?select=id,match_number,is_knockout,"
            "home_team:teams!matches_home_team_id_fkey(fifa_code),"
            "away_team:teams!matches_away_team_id_fkey(fifa_code)"
            f"&order=match_number.asc&offset={offset}&limit=100",
            anon,
        )
        if not batch:
            break
        pawer_matches.extend(batch)
        if len(batch) < 100:
            break
        offset += 100

    match_picks = {}
    unmapped = []

    for m in pawer_matches:
        num = m["match_number"]
        ht = m.get("home_team")
        at = m.get("away_team")

        if ht and at:
            pair = (ht["fifa_code"], at["fifa_code"])
            pred = lookup_pair(pair[0], pair[1])
            if not pred:
                unmapped.append((num, pair, "no prediction"))
                continue
            home, away, pen = pred
        elif num in KNOCKOUT_PREDICTIONS:
            home, away, pen = KNOCKOUT_PREDICTIONS[num]
        else:
            unmapped.append((num, None, "knockout missing"))
            continue

        match_picks[m["id"]] = make_pick(home, away, pen, team_by_code)

    esp = team_by_code["ESP"]
    payload = {
        "picks": {
            "version": 1,
            "matches": match_picks,
            "champion_team_id": esp["id"],
            "tiebreak_overrides": {},
        },
        "champion_team_id": esp["id"],
        "submitted": False,
    }

    out = Path(__file__).parent / "pawer-picks-payload.json"
    out.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {len(match_picks)} picks ({len(unmapped)} unmapped)")
    if unmapped:
        for u in unmapped:
            print(" ", u)

    # Verify key matches
    by_num = {m["match_number"]: m for m in pawer_matches}
    for n in [1, 67, 73, 99, 104]:
        pm = by_num[n]
        pick = match_picks.get(pm["id"])
        ht = pm.get("home_team")
        at = pm.get("away_team")
        label = f"{ht['fifa_code']}-{at['fifa_code']}" if ht and at else "KO"
        print(f"M{n} ({label}): {pick}")


if __name__ == "__main__":
    main()
