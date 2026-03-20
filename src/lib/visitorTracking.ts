import fs from "fs";
import path from "path";
import type { NextApiRequest } from "next";
import type { VisitorEventPayload, VisitorEventType } from "@/lib/visitorClient";

const DB_PATH = path.join(process.cwd(), "db", "visitors.json");
const TRACKABLE_EVENTS: VisitorEventType[] = [
  "visited",
  "started_game",
  "placed_guess_pin",
  "submitted_guess",
];

export interface VisitorEventRecord {
  type: VisitorEventType;
  at: string;
  ip: string;
  potholeId: string;
  potholeDate: string;
  isPastPlay: boolean;
  score?: number;
  distanceMiles?: number;
  guessLat?: number;
  guessLng?: number;
}

export interface VisitorRecord {
  visitorId: string;
  userAgent: string;
  firstVisitedAt: string;
  lastVisitedAt: string;
  lastIp: string;
  ipAddresses: string[];
  hasVisited: boolean;
  hasStartedGame: boolean;
  hasPlacedGuessPin: boolean;
  hasSubmittedGuess: boolean;
  lastPotholeId: string;
  lastPotholeDate: string;
  events: VisitorEventRecord[];
}

type VisitorDB = Record<string, VisitorRecord>;

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "{}");
}

function readAll(): VisitorDB {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as VisitorDB;
  } catch {
    return {};
  }
}

function writeAll(db: VisitorDB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getRequestIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }

  return req.socket.remoteAddress || "unknown";
}

export function isTrackableEvent(value: unknown): value is VisitorEventType {
  return typeof value === "string" && TRACKABLE_EVENTS.includes(value as VisitorEventType);
}

export function writeVisitorEvent(
  payload: VisitorEventPayload,
  ip: string,
  userAgent: string
): VisitorRecord {
  const db = readAll();
  const timestamp = new Date().toISOString();
  const existing = db[payload.visitorId];

  const nextEvent: VisitorEventRecord = {
    type: payload.event,
    at: timestamp,
    ip,
    potholeId: payload.potholeId,
    potholeDate: payload.potholeDate,
    isPastPlay: payload.isPastPlay,
    score: payload.score,
    distanceMiles: payload.distanceMiles,
    guessLat: payload.guessLat,
    guessLng: payload.guessLng,
  };

  const ipAddresses = existing?.ipAddresses || [];
  if (!ipAddresses.includes(ip)) {
    ipAddresses.push(ip);
  }

  const record: VisitorRecord = {
    visitorId: payload.visitorId,
    userAgent,
    firstVisitedAt: existing?.firstVisitedAt || timestamp,
    lastVisitedAt: timestamp,
    lastIp: ip,
    ipAddresses,
    hasVisited: true,
    hasStartedGame:
      existing?.hasStartedGame || payload.event === "started_game" || payload.event === "placed_guess_pin" || payload.event === "submitted_guess",
    hasPlacedGuessPin:
      existing?.hasPlacedGuessPin || payload.event === "placed_guess_pin" || payload.event === "submitted_guess",
    hasSubmittedGuess: existing?.hasSubmittedGuess || payload.event === "submitted_guess",
    lastPotholeId: payload.potholeId,
    lastPotholeDate: payload.potholeDate,
    events: [...(existing?.events || []), nextEvent].slice(-100),
  };

  db[payload.visitorId] = record;
  writeAll(db);

  return record;
}
