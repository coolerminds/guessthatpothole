import { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import GameContext from "./GameContext";

export default function ScoreDisplay() {
  const { score, distance } = useContext(GameContext);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (score === null) return;
    let start = 0;
    const duration = 1500;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = score / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  if (score === null || distance === null) return null;

  const distanceMiles = distance.toFixed(2);
  const rating =
    score >= 4500
      ? { label: "INCREDIBLE!", color: "#FFD700", emoji: "🏆" }
      : score >= 3000
      ? { label: "GREAT GUESS!", color: "#00E676", emoji: "🎯" }
      : score >= 1500
      ? { label: "NOT BAD!", color: "#FFA726", emoji: "👍" }
      : { label: "TRY AGAIN!", color: "#FF5252", emoji: "😬" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="score-display"
    >
      {score >= 4500 && (
        <motion.div
          className="score-display__confetti"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.1, 0.8, 1] }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="score-display__confetti-piece"
              initial={{
                x: 0,
                y: 0,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
              style={{
                backgroundColor: ["#FFD700", "#FF4444", "#00BFFF", "#FF69B4", "#00E676"][
                  i % 5
                ],
              }}
            />
          ))}
        </motion.div>
      )}

      <motion.div
        className="score-display__emoji"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1] }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {rating.emoji}
      </motion.div>

      <motion.div
        className="score-display__label"
        style={{ color: rating.color }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {rating.label}
      </motion.div>

      <div className="score-display__score" style={{ color: rating.color }}>
        {displayScore.toLocaleString()}
        <span className="score-display__max"> / 5,000</span>
      </div>

      <div className="score-display__distance">
        <i className="fa-solid fa-ruler"></i>{" "}
        {distanceMiles} miles away
      </div>
    </motion.div>
  );
}
