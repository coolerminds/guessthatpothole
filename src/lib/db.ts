import fs from "fs";
import path from "path";
import { LeaderboardEntry } from "@/data/potholes";

const DB_PATH = path.join(process.cwd(), "db", "leaderboard.json");

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");
}

export function readLeaderboard(): LeaderboardEntry[] {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw) as LeaderboardEntry[];
    return data.sort((a, b) => b.score - a.score).slice(0, 10);
  } catch {
    return [];
  }
}

export function writeLeaderboard(entry: LeaderboardEntry): LeaderboardEntry[] {
  ensureDb();
  const board = readLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, 10);
  fs.writeFileSync(DB_PATH, JSON.stringify(trimmed, null, 2));
  return trimmed;
}

export function qualifiesForBoard(score: number): boolean {
  const board = readLeaderboard();
  if (board.length < 10) return true;
  return score > board[board.length - 1].score;
}
