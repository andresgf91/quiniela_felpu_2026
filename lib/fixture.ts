import { readFileSync } from "fs";
import { join } from "path";
import type { FixtureData } from "@/lib/types";

let cached: FixtureData | null = null;

export function loadFixture(): FixtureData {
  if (cached) return cached;
  const path = join(process.cwd(), "data", "worldcup2026.json");
  cached = JSON.parse(readFileSync(path, "utf-8")) as FixtureData;
  return cached;
}

export function getGroupTeams(): Record<string, string[]> {
  const fixture = loadFixture();
  const groups: Record<string, string[]> = {};
  for (const team of fixture.teams) {
    if (!team.groupCode) continue;
    if (!groups[team.groupCode]) groups[team.groupCode] = [];
    groups[team.groupCode].push(team.id);
  }
  return groups;
}
