import { useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameContext from "./GameContext";
import {
  getLeaderboard,
  saveToLeaderboard,
  qualifiesForLeaderboard,
  LeaderboardEntry,
} from "@/data/potholes";

export default function Leaderboard() {
  const { score, restart } = useContext(GameContext);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [initials, setInitials] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);
  const [qualifies, setQualifies] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    const lb = getLeaderboard();
    setBoard(lb);
    setQualifies(score !== null && qualifiesForLeaderboard(score));
  }, [score]);

  useEffect(() => {
    if (qualifies && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [qualifies]);

  function handleInitialChange(index: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    const newInitials = [...initials];
    newInitials[index] = char;
    setInitials(newInitials);

    if (char && index < 2 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current!.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !initials[index] && index > 0) {
      inputRefs[index - 1].current!.focus();
    }
  }

  function submitScore() {
    if (initials.some((c) => !c) || score === null || saved) return;
    const entry: LeaderboardEntry = {
      initials: initials.join(""),
      score,
      date: new Date().toLocaleDateString(),
    };
    const newBoard = saveToLeaderboard(entry);
    setBoard(newBoard);
    setSaved(true);
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="leaderboard"
    >
      <h2 className="leaderboard__title">
        <i className="fa-solid fa-trophy"></i> TOP SCORES
      </h2>

      {/* Initial entry */}
      {qualifies && !saved && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="leaderboard__entry"
        >
          <p className="leaderboard__entry-label">
            🎉 You made the top 10! Enter your initials:
          </p>
          <div className="leaderboard__initials-row">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="text"
                maxLength={1}
                value={initials[i]}
                onChange={(e) => handleInitialChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="leaderboard__initial-input"
              />
            ))}
            <button
              onClick={submitScore}
              disabled={initials.some((c) => !c)}
              className="leaderboard__submit-btn"
            >
              SAVE
            </button>
          </div>
        </motion.div>
      )}

      {saved && (
        <motion.div
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="leaderboard__saved-msg"
        >
          ✅ Score saved!
        </motion.div>
      )}

      {/* Score table */}
      <div className="leaderboard__table">
        <div className="leaderboard__header">
          <span>#</span>
          <span>NAME</span>
          <span>SCORE</span>
          <span>DATE</span>
        </div>
        <AnimatePresence>
          {board.length === 0 && (
            <div className="leaderboard__empty">No scores yet — be the first!</div>
          )}
          {board.map((entry, idx) => (
            <motion.div
              key={entry.initials + entry.date + idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`leaderboard__row ${idx < 3 ? "leaderboard__row--top" : ""} ${
                saved && entry.initials === initials.join("") && entry.score === score
                  ? "leaderboard__row--highlight"
                  : ""
              }`}
            >
              <span className="leaderboard__rank">
                {idx < 3 ? medals[idx] : idx + 1}
              </span>
              <span className="leaderboard__name">{entry.initials}</span>
              <span className="leaderboard__score">{entry.score.toLocaleString()}</span>
              <span className="leaderboard__date">{entry.date}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={restart}
        className="leaderboard__play-again"
      >
        <i className="fa-solid fa-rotate-right"></i> PLAY AGAIN
      </motion.button>
    </motion.div>
  );
}
