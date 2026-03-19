import { useContext, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import GameContext from "./GameContext";
import { LeaderboardEntry } from "@/data/potholes";
import { getFresnoDateString } from "@/lib/date";

export default function Leaderboard() {
  const { score, todaysPothole, isPastPlay } = useContext(GameContext);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [initials, setInitials] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justSavedIdx, setJustSavedIdx] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Email subscribe
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [subMsg, setSubMsg] = useState("");

  const potholeDate = todaysPothole.date;

  // Fetch leaderboard for this specific pothole
  useEffect(() => {
    fetch(`/api/leaderboard?date=${potholeDate}`)
      .then((r) => r.json())
      .then((data) => {
        setBoard(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [potholeDate]);

  const qualifies =
    !isPastPlay &&
    score !== null &&
    (board.length < 10 || score > (board[9]?.score ?? 0));

  function handleInitialChange(idx: number, val: string) {
    const char = val.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(-1);
    const next = [...initials];
    next[idx] = char;
    setInitials(next);
    if (char && idx < 2) {
      inputRefs[idx + 1].current?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !initials[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus();
    }
  }

  async function handleSave() {
    if (score === null || initials.some((c) => !c) || isPastPlay) return;

    setSaveError("");

    const entry = {
      potholeDate,
      initials: initials.join(""),
      score,
      date: getFresnoDateString(),
    };

    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unable to save your score right now.");
      }

      const updatedBoard = await res.json();
      setBoard(updatedBoard);
      const idx = updatedBoard.findIndex(
        (e: LeaderboardEntry) =>
          e.initials === entry.initials && e.score === entry.score
      );
      setJustSavedIdx(idx >= 0 ? idx : null);
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save your score right now."
      );
    }
  }

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong. Try again!");
      }

      const data = await res.json();
      setSubStatus("done");
      setSubMsg(data.alreadySubscribed ? "You're already subscribed!" : "You're in! 🎉");
    } catch (error) {
      setSubStatus("error");
      setSubMsg(error instanceof Error ? error.message : "Something went wrong. Try again!");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="leaderboard"
    >
      <h2 className="leaderboard__title">
        <i className="fa-solid fa-trophy"></i> Hall of Champions
      </h2>
      <div className="leaderboard__pothole-date">
        <i className="fa-solid fa-calendar"></i> {potholeDate}
        {isPastPlay && (
          <span className="leaderboard__past-badge">PAST QUEST</span>
        )}
      </div>

      {/* Entry form — only for today's pothole */}
      {qualifies && !saved && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="leaderboard__entry"
        >
          <div className="leaderboard__entry-label">
            ⚔️ You scored {score?.toLocaleString()}! Enter your initials:
          </div>
          <div className="leaderboard__initials-row">
            {initials.map((ch, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                className="leaderboard__initial-input"
                type="text"
                maxLength={1}
                value={ch}
                onChange={(e) => handleInitialChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
            <button
              className="leaderboard__submit-btn"
              onClick={handleSave}
              disabled={initials.some((c) => !c)}
            >
              INSCRIBE
            </button>
          </div>
        </motion.div>
      )}

      {saved && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="leaderboard__saved-msg"
        >
          ⚔️ Your name has been inscribed!
        </motion.div>
      )}

      {saveError && (
        <div className="leaderboard__subscribe-error">{saveError}</div>
      )}

      {/* Past play notice */}
      {isPastPlay && score !== null && (
        <div className="leaderboard__past-notice">
          You scored {score.toLocaleString()} on this past quest! Scores are not
          ranked for past potholes.
        </div>
      )}

      {/* Scoreboard */}
      <div className="leaderboard__table">
        <div className="leaderboard__header">
          <span>#</span>
          <span>NAME</span>
          <span>SCORE</span>
          <span>DATE</span>
        </div>

        {loading ? (
          <div className="leaderboard__empty">Loading scores...</div>
        ) : board.length === 0 ? (
          <div className="leaderboard__empty">
            No champions yet for this pothole.
          </div>
        ) : (
          board.map((entry, i) => (
            <motion.div
              key={`${entry.initials}-${entry.score}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`leaderboard__row ${
                i < 3 ? "leaderboard__row--top" : ""
              } ${justSavedIdx === i ? "leaderboard__row--highlight" : ""}`}
            >
              <span className="leaderboard__rank">
                {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <span className="leaderboard__name">{entry.initials}</span>
              <span className="leaderboard__score">
                {entry.score.toLocaleString()}
              </span>
              <span className="leaderboard__date">{entry.date}</span>
            </motion.div>
          ))
        )}
      </div>

      {/* Come back tomorrow — for today's pothole */}
      {!isPastPlay && (
        <div className="leaderboard__comeback">
          <i className="fa-solid fa-hourglass-half"></i>
          <span>Come back tomorrow for the new pothole quest!</span>
        </div>
      )}

      {/* Email Newsletter Subscribe */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="leaderboard__subscribe"
      >
        <div className="leaderboard__subscribe-icon">📬</div>
        <h3 className="leaderboard__subscribe-title">
          Never Miss a Pothole!
        </h3>
        <p className="leaderboard__subscribe-desc">
          Get notified when the new daily pothole quest drops.
        </p>
        {subStatus === "done" ? (
          <div className="leaderboard__subscribe-success">{subMsg}</div>
        ) : (
          <form
            className="leaderboard__subscribe-form"
            onSubmit={handleSubscribe}
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="leaderboard__subscribe-input"
              required
            />
            <button
              type="submit"
              className="leaderboard__subscribe-btn"
              disabled={subStatus === "sending"}
            >
              {subStatus === "sending" ? "..." : "SUBSCRIBE"}
            </button>
          </form>
        )}
        {subStatus === "error" && (
          <div className="leaderboard__subscribe-error">{subMsg}</div>
        )}
      </motion.div>
    </motion.div>
  );
}
