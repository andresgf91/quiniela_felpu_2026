/**
 * Builds data/worldcup2026.json from openfootball worldcup.json source.
 * Run: pnpm tsx scripts/build-fixture.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";

type OpenFootballMatch = {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  num?: number;
};

type OpenFootballData = {
  name: string;
  matches: OpenFootballMatch[];
};

const TEAM_MAP: Record<
  string,
  { id: string; nameEs: string; nameEn: string; flagEmoji: string; groupCode: string }
> = {
  Mexico: { id: "MEX", nameEs: "México", nameEn: "Mexico", flagEmoji: "🇲🇽", groupCode: "A" },
  "South Africa": { id: "RSA", nameEs: "Sudáfrica", nameEn: "South Africa", flagEmoji: "🇿🇦", groupCode: "A" },
  "South Korea": { id: "KOR", nameEs: "Corea del Sur", nameEn: "South Korea", flagEmoji: "🇰🇷", groupCode: "A" },
  "Czech Republic": { id: "CZE", nameEs: "República Checa", nameEn: "Czech Republic", flagEmoji: "🇨🇿", groupCode: "A" },
  Canada: { id: "CAN", nameEs: "Canadá", nameEn: "Canada", flagEmoji: "🇨🇦", groupCode: "B" },
  "Bosnia & Herzegovina": { id: "BIH", nameEs: "Bosnia y Herzegovina", nameEn: "Bosnia & Herzegovina", flagEmoji: "🇧🇦", groupCode: "B" },
  Qatar: { id: "QAT", nameEs: "Catar", nameEn: "Qatar", flagEmoji: "🇶🇦", groupCode: "B" },
  Switzerland: { id: "SUI", nameEs: "Suiza", nameEn: "Switzerland", flagEmoji: "🇨🇭", groupCode: "B" },
  Brazil: { id: "BRA", nameEs: "Brasil", nameEn: "Brazil", flagEmoji: "🇧🇷", groupCode: "C" },
  Morocco: { id: "MAR", nameEs: "Marruecos", nameEn: "Morocco", flagEmoji: "🇲🇦", groupCode: "C" },
  Haiti: { id: "HAI", nameEs: "Haití", nameEn: "Haiti", flagEmoji: "🇭🇹", groupCode: "C" },
  Scotland: { id: "SCO", nameEs: "Escocia", nameEn: "Scotland", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", groupCode: "C" },
  USA: { id: "USA", nameEs: "Estados Unidos", nameEn: "USA", flagEmoji: "🇺🇸", groupCode: "D" },
  Paraguay: { id: "PAR", nameEs: "Paraguay", nameEn: "Paraguay", flagEmoji: "🇵🇾", groupCode: "D" },
  Australia: { id: "AUS", nameEs: "Australia", nameEn: "Australia", flagEmoji: "🇦🇺", groupCode: "D" },
  Turkey: { id: "TUR", nameEs: "Turquía", nameEn: "Turkey", flagEmoji: "🇹🇷", groupCode: "D" },
  Germany: { id: "GER", nameEs: "Alemania", nameEn: "Germany", flagEmoji: "🇩🇪", groupCode: "E" },
  "Curaçao": { id: "CUW", nameEs: "Curazao", nameEn: "Curaçao", flagEmoji: "🇨🇼", groupCode: "E" },
  "Ivory Coast": { id: "CIV", nameEs: "Costa de Marfil", nameEn: "Ivory Coast", flagEmoji: "🇨🇮", groupCode: "E" },
  Ecuador: { id: "ECU", nameEs: "Ecuador", nameEn: "Ecuador", flagEmoji: "🇪🇨", groupCode: "E" },
  Netherlands: { id: "NED", nameEs: "Países Bajos", nameEn: "Netherlands", flagEmoji: "🇳🇱", groupCode: "F" },
  Japan: { id: "JPN", nameEs: "Japón", nameEn: "Japan", flagEmoji: "🇯🇵", groupCode: "F" },
  Sweden: { id: "SWE", nameEs: "Suecia", nameEn: "Sweden", flagEmoji: "🇸🇪", groupCode: "F" },
  Tunisia: { id: "TUN", nameEs: "Túnez", nameEn: "Tunisia", flagEmoji: "🇹🇳", groupCode: "F" },
  Belgium: { id: "BEL", nameEs: "Bélgica", nameEn: "Belgium", flagEmoji: "🇧🇪", groupCode: "G" },
  Egypt: { id: "EGY", nameEs: "Egipto", nameEn: "Egypt", flagEmoji: "🇪🇬", groupCode: "G" },
  Iran: { id: "IRN", nameEs: "Irán", nameEn: "Iran", flagEmoji: "🇮🇷", groupCode: "G" },
  "New Zealand": { id: "NZL", nameEs: "Nueva Zelanda", nameEn: "New Zealand", flagEmoji: "🇳🇿", groupCode: "G" },
  Spain: { id: "ESP", nameEs: "España", nameEn: "Spain", flagEmoji: "🇪🇸", groupCode: "H" },
  "Cape Verde": { id: "CPV", nameEs: "Cabo Verde", nameEn: "Cape Verde", flagEmoji: "🇨🇻", groupCode: "H" },
  "Saudi Arabia": { id: "KSA", nameEs: "Arabia Saudita", nameEn: "Saudi Arabia", flagEmoji: "🇸🇦", groupCode: "H" },
  Uruguay: { id: "URU", nameEs: "Uruguay", nameEn: "Uruguay", flagEmoji: "🇺🇾", groupCode: "H" },
  France: { id: "FRA", nameEs: "Francia", nameEn: "France", flagEmoji: "🇫🇷", groupCode: "I" },
  Senegal: { id: "SEN", nameEs: "Senegal", nameEn: "Senegal", flagEmoji: "🇸🇳", groupCode: "I" },
  Iraq: { id: "IRQ", nameEs: "Irak", nameEn: "Iraq", flagEmoji: "🇮🇶", groupCode: "I" },
  Norway: { id: "NOR", nameEs: "Noruega", nameEn: "Norway", flagEmoji: "🇳🇴", groupCode: "I" },
  Argentina: { id: "ARG", nameEs: "Argentina", nameEn: "Argentina", flagEmoji: "🇦🇷", groupCode: "J" },
  Algeria: { id: "ALG", nameEs: "Argelia", nameEn: "Algeria", flagEmoji: "🇩🇿", groupCode: "J" },
  Austria: { id: "AUT", nameEs: "Austria", nameEn: "Austria", flagEmoji: "🇦🇹", groupCode: "J" },
  Jordan: { id: "JOR", nameEs: "Jordania", nameEn: "Jordan", flagEmoji: "🇯🇴", groupCode: "J" },
  Portugal: { id: "POR", nameEs: "Portugal", nameEn: "Portugal", flagEmoji: "🇵🇹", groupCode: "K" },
  "DR Congo": { id: "COD", nameEs: "RD Congo", nameEn: "DR Congo", flagEmoji: "🇨🇩", groupCode: "K" },
  Uzbekistan: { id: "UZB", nameEs: "Uzbekistán", nameEn: "Uzbekistan", flagEmoji: "🇺🇿", groupCode: "K" },
  Colombia: { id: "COL", nameEs: "Colombia", nameEn: "Colombia", flagEmoji: "🇨🇴", groupCode: "K" },
  England: { id: "ENG", nameEs: "Inglaterra", nameEn: "England", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", groupCode: "L" },
  Croatia: { id: "CRO", nameEs: "Croacia", nameEn: "Croatia", flagEmoji: "🇭🇷", groupCode: "L" },
  Ghana: { id: "GHA", nameEs: "Ghana", nameEn: "Ghana", flagEmoji: "🇬🇭", groupCode: "L" },
  Panama: { id: "PAN", nameEs: "Panamá", nameEn: "Panama", flagEmoji: "🇵🇦", groupCode: "L" },
};

const STAGE_MAP: Record<string, string> = {
  "Round of 32": "R32",
  "Round of 16": "R16",
  "Quarter-final": "QF",
  "Semi-final": "SF",
  "Match for third place": "THIRD",
  Final: "FINAL",
};

const VENUE_NAMES: Record<string, string> = {
  "Mexico City": "Estadio Azteca",
  "Guadalajara (Zapopan)": "Estadio Akron",
  "Monterrey (Guadalupe)": "Estadio BBVA",
  Toronto: "BMO Field",
  Vancouver: "BC Place",
  "Los Angeles (Inglewood)": "SoFi Stadium",
  "San Francisco Bay Area (Santa Clara)": "Levi's Stadium",
  "New York/New Jersey (East Rutherford)": "MetLife Stadium",
  "Boston (Foxborough)": "Gillette Stadium",
  Philadelphia: "Lincoln Financial Field",
  Seattle: "Lumen Field",
  Atlanta: "Mercedes-Benz Stadium",
  Houston: "NRG Stadium",
  "Dallas (Arlington)": "AT&T Stadium",
  "Kansas City": "Arrowhead Stadium",
  "Miami (Miami Gardens)": "Hard Rock Stadium",
};

function parseKickoffUtc(date: string, time: string): string {
  const m = time.match(/(\d{1,2}):(\d{2})\s+UTC([+-]\d+)/);
  if (!m) throw new Error(`Bad time: ${date} ${time}`);
  const [, hh, mm, offsetStr] = m;
  const offsetHours = parseInt(offsetStr, 10);
  const localH = parseInt(hh, 10);
  const localM = parseInt(mm, 10);
  let utcH = localH - offsetHours;
  let utcM = localM;
  let day = date;
  if (utcH < 0) {
    utcH += 24;
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    day = d.toISOString().slice(0, 10);
  } else if (utcH >= 24) {
    utcH -= 24;
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    day = d.toISOString().slice(0, 10);
  }
  return `${day}T${String(utcH).padStart(2, "0")}:${String(utcM).padStart(2, "0")}:00.000Z`;
}

function slotLabel(team: string): string {
  if (TEAM_MAP[team]) return TEAM_MAP[team].id;
  return team;
}

async function main() {
  const res = await fetch(
    "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
  );
  const data = (await res.json()) as OpenFootballData;

  const teams = Object.values(TEAM_MAP).map((t) => ({
    id: t.id,
    nameEs: t.nameEs,
    nameEn: t.nameEn,
    flagEmoji: t.flagEmoji,
    groupCode: t.groupCode,
  }));

  let groupMatchNum = 0;
  const matches = data.matches.map((m, idx) => {
    const isGroup = !!m.group;
    let id: number;
    if (m.num) {
      id = m.num;
    } else if (isGroup) {
      groupMatchNum += 1;
      id = groupMatchNum;
    } else if (m.round === "Match for third place") {
      id = 103;
    } else if (m.round === "Final") {
      id = 104;
    } else {
      throw new Error(`No match id for ${JSON.stringify(m)}`);
    }

    const stage = isGroup ? "GROUP" : STAGE_MAP[m.round];
    const groupCode = m.group?.replace("Group ", "") ?? null;
    const city = m.ground;
    const venue = VENUE_NAMES[city] ?? city;

    return {
      id,
      stage,
      groupCode,
      kickoffUtc: parseKickoffUtc(m.date, m.time),
      venue,
      city,
      homeSlot: slotLabel(m.team1),
      awaySlot: slotLabel(m.team2),
    };
  });

  // TODO: verify against official FIFA bracket allocation
  const thirdPlaceAllocation = {
    _comment: "TODO: verify against official FIFA bracket allocation",
    slots: {
      "74": "3A/B/C/D/F",
      "77": "3C/D/F/G/H",
      "79": "3C/E/F/H/I",
      "80": "3E/H/I/J/K",
      "81": "3B/E/F/I/J",
      "82": "3A/E/H/I/J",
      "85": "3E/F/G/I/J",
      "87": "3D/E/I/J/L",
    },
    lookupTable: {},
  };

  const output = {
    teams,
    matches,
    thirdPlaceAllocation,
    knockoutBracket: {
      propagation: buildPropagationMap(),
    },
  };

  const outPath = join(process.cwd(), "data", "worldcup2026.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${matches.length} matches, ${teams.length} teams to ${outPath}`);
}

function buildPropagationMap(): Record<string, { home?: string; away?: string }> {
  const map: Record<string, { home?: string; away?: string }> = {};
  const winners: Record<number, string> = {};
  for (let i = 73; i <= 104; i++) winners[i] = `W${i}`;
  const losers: Record<number, string> = {};
  for (let i = 101; i <= 102; i++) losers[i] = `L${i}`;

  const edges: Array<[number, "home" | "away", string]> = [
    [89, "home", "W74"],
    [89, "away", "W77"],
    [90, "home", "W73"],
    [90, "away", "W75"],
    [91, "home", "W76"],
    [91, "away", "W78"],
    [92, "home", "W79"],
    [92, "away", "W80"],
    [93, "home", "W83"],
    [93, "away", "W84"],
    [94, "home", "W81"],
    [94, "away", "W82"],
    [95, "home", "W86"],
    [95, "away", "W88"],
    [96, "home", "W85"],
    [96, "away", "W87"],
    [97, "home", "W89"],
    [97, "away", "W90"],
    [98, "home", "W93"],
    [98, "away", "W94"],
    [99, "home", "W91"],
    [99, "away", "W92"],
    [100, "home", "W95"],
    [100, "away", "W96"],
    [101, "home", "W97"],
    [101, "away", "W98"],
    [102, "home", "W99"],
    [102, "away", "W100"],
    [103, "home", "L101"],
    [103, "away", "L102"],
    [104, "home", "W101"],
    [104, "away", "W102"],
  ];

  for (const [matchId, side, slot] of edges) {
    if (!map[String(matchId)]) map[String(matchId)] = {};
    map[String(matchId)][side] = slot;
  }
  return map;
}

main().catch(console.error);
