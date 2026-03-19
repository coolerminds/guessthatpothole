import type { NextApiRequest, NextApiResponse } from "next";
import { readLeaderboard, writeLeaderboard } from "@/lib/db";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const board = readLeaderboard();
    return res.status(200).json(board);
  }

  if (req.method === "POST") {
    const { initials, score, date } = req.body;

    if (
      !initials ||
      typeof initials !== "string" ||
      initials.length !== 3 ||
      typeof score !== "number" ||
      !date
    ) {
      return res.status(400).json({ error: "Invalid entry. Need: initials (3 chars), score (number), date." });
    }

    const board = writeLeaderboard({
      initials: initials.toUpperCase(),
      score,
      date,
    });

    return res.status(200).json(board);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
