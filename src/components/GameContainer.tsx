import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import GameContext, { GamePhase } from "./GameContext";
import { Pothole, getDailyPothole, getDistanceMiles, calculateScore } from "@/data/potholes";
import { getFresnoDisplayDate } from "@/lib/date";
import { getOrCreateVisitorId, getVisitorId, trackVisitorEvent } from "@/lib/visitorClient";
import PotholeViewer from "./PotholeViewer";
import ScoreDisplay from "./ScoreDisplay";
import Leaderboard from "./Leaderboard";
import PastPotholes from "./PastPotholes";

const FresnoMap = dynamic(() => import("./FresnoMap"), { ssr: false });

export default function GameContainer() {
  const [phase, setPhase] = useState<GamePhase>("INTRO");
  const [guessPos, setGuessPos] = useState<[number, number] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [activePothole, setActivePothole] = useState<Pothole | null>(null);
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const visitorIdRef = useRef<string | null>(null);
  const startedKeysRef = useRef<Set<string>>(new Set());
  const placedGuessKeysRef = useRef<Set<string>>(new Set());
  const submittedKeysRef = useRef<Set<string>>(new Set());

  const dailyPothole = useMemo(() => getDailyPothole(), []);
  const todaysPothole = activePothole || dailyPothole;
  const isPastPlay = activePothole !== null;
  const potholeTrackingKey = `${todaysPothole.id}:${todaysPothole.date}:${isPastPlay ? "past" : "daily"}`;

  const dailyLabel = useMemo(() => {
    return getFresnoDisplayDate();
  }, []);

  // Listen for past pothole play events
  const handlePlayPast = useCallback(() => {
    if (window.__pastPothole) {
      setActivePothole(window.__pastPothole);
      setGuessPos(null);
      setScore(null);
      setDistance(null);
      setPhase("PLAYING");
      window.__pastPothole = undefined;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("play-past-pothole", handlePlayPast);
    return () => window.removeEventListener("play-past-pothole", handlePlayPast);
  }, [handlePlayPast]);

  useEffect(() => {
    const existingVisitorId = getVisitorId();
    setIsReturningVisitor(Boolean(existingVisitorId));
    visitorIdRef.current = getOrCreateVisitorId();

    void trackVisitorEvent({
      event: "visited",
      visitorId: visitorIdRef.current,
      potholeId: todaysPothole.id,
      potholeDate: todaysPothole.date,
      isPastPlay,
    });
  }, [todaysPothole.id, todaysPothole.date, isPastPlay]);

  useEffect(() => {
    if (phase !== "PLAYING" || startedKeysRef.current.has(potholeTrackingKey)) {
      return;
    }

    const visitorId = visitorIdRef.current || getOrCreateVisitorId();
    visitorIdRef.current = visitorId;
    startedKeysRef.current.add(potholeTrackingKey);

    void trackVisitorEvent({
      event: "started_game",
      visitorId,
      potholeId: todaysPothole.id,
      potholeDate: todaysPothole.date,
      isPastPlay,
    });
  }, [phase, potholeTrackingKey, todaysPothole.id, todaysPothole.date, isPastPlay]);

  useEffect(() => {
    if (!guessPos || placedGuessKeysRef.current.has(potholeTrackingKey)) {
      return;
    }

    const visitorId = visitorIdRef.current || getOrCreateVisitorId();
    visitorIdRef.current = visitorId;
    placedGuessKeysRef.current.add(potholeTrackingKey);

    void trackVisitorEvent({
      event: "placed_guess_pin",
      visitorId,
      potholeId: todaysPothole.id,
      potholeDate: todaysPothole.date,
      isPastPlay,
      guessLat: guessPos[0],
      guessLng: guessPos[1],
    });
  }, [guessPos, potholeTrackingKey, todaysPothole.id, todaysPothole.date, isPastPlay]);

  useEffect(() => {
    if (
      phase !== "SCORED" ||
      score === null ||
      distance === null ||
      submittedKeysRef.current.has(potholeTrackingKey)
    ) {
      return;
    }

    const visitorId = visitorIdRef.current || getOrCreateVisitorId();
    visitorIdRef.current = visitorId;
    submittedKeysRef.current.add(potholeTrackingKey);

    void trackVisitorEvent({
      event: "submitted_guess",
      visitorId,
      potholeId: todaysPothole.id,
      potholeDate: todaysPothole.date,
      isPastPlay,
      score,
      distanceMiles: distance,
      guessLat: guessPos?.[0],
      guessLng: guessPos?.[1],
    });
  }, [
    phase,
    score,
    distance,
    guessPos,
    potholeTrackingKey,
    todaysPothole.id,
    todaysPothole.date,
    isPastPlay,
  ]);

  function handleGuess() {
    if (!guessPos) return;
    const dist = getDistanceMiles(
      guessPos[0],
      guessPos[1],
      todaysPothole.lat,
      todaysPothole.lng
    );
    const pts = calculateScore(dist);
    setDistance(dist);
    setScore(pts);
    setPhase("SCORED");
  }

  function goToLeaderboard() {
    setPhase("LEADERBOARD");
  }

  function restart() {
    setActivePothole(null); // reset to daily
    setGuessPos(null);
    setScore(null);
    setDistance(null);
    setPhase("PLAYING");
  }

  const contextValue = {
    phase,
    setPhase,
    todaysPothole,
    guessPos,
    setGuessPos,
    score,
    setScore,
    distance,
    setDistance,
    handleGuess,
    restart,
    isPastPlay,
  };

  return (
    <GameContext.Provider value={contextValue}>
      <div className="game">
        {/* Header */}
        <header className="game__header">
          <div className="game__logo">
            <motion.span
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="game__logo-icon"
            >
              <i className="fa-solid fa-crown"></i>
            </motion.span>
            <h1 className="game__title">
              GUESS THAT <span className="game__title--accent">POTHOLE</span>
            </h1>
          </div>
          <div className="game__nav">
            <button
              type="button"
              onClick={goToLeaderboard}
              className={`game__nav-button ${
                phase === "LEADERBOARD" ? "game__nav-button--active" : ""
              }`}
            >
              View Scoreboard
            </button>
            <Link href="/history" className="game__nav-link">
              My History
            </Link>
          </div>
          <div className="game__header-actions">
            <div className="game__score-pill">Score: {(score ?? 0).toLocaleString()}</div>
            <div className="game__daily-badge">
              <i className="fa-solid fa-calendar-day"></i>The Pothole for {dailyLabel}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="game__content">
          <AnimatePresence mode="wait">
            {/* INTRO */}
            {phase === "INTRO" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="game__intro"
              >
                <div className="game__intro-inner">
                  {isReturningVisitor && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.08, duration: 0.35 }}
                      className="game__intro-welcome"
                    >
                      <i className="fa-solid fa-sparkles"></i>
                      <div>
                        <span className="game__intro-welcome-label">
                          Royal Recognition
                        </span>
                        <span className="game__intro-welcome-text">
                          Welcome back. Ready for another pothole hunt?
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <motion.section
                    initial={{ y: 30, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.16, duration: 0.45 }}
                    className="game__intro-hero"
                  >
                    <p className="game__intro-subheading">
                      Presenting the Tournament of
                    </p>
                    <h2 className="game__intro-heading">
                      Guess That
                      <br />
                      Pothole
                    </h2>
                    <p className="game__intro-desc">
                      You&apos;ll be shown a photo of a real pothole from{" "}
                      <strong>Fresno, California</strong>. Click on the map where
                      you think it is. The closer your guess, the higher your
                      score. Every day there will be a new pothole to find.
                    </p>
                    <div className="game__intro-actions">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPhase("PLAYING")}
                        className="game__play-btn"
                      >
                        <span>Lets Play</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={goToLeaderboard}
                        className="game__intro-secondary-btn"
                      >
                        <span>View Scoreboard</span>
                      </motion.button>
                    </div>
                  </motion.section>

                  <section className="game__intro-rules">
                    <article className="game__intro-rule">
                      <div className="game__intro-rule-seal">
                        <i className="fa-solid fa-image"></i>
                      </div>
                      <span className="game__intro-rule-number">01</span>
                      <h3 className="game__intro-rule-title">See the pothole photo</h3>
                    </article>
                    <article className="game__intro-rule">
                      <div className="game__intro-rule-seal">
                        <i className="fa-solid fa-map-pin"></i>
                      </div>
                      <span className="game__intro-rule-number">02</span>
                      <h3 className="game__intro-rule-title">Click the map to guess</h3>
                    </article>
                    <article className="game__intro-rule">
                      <div className="game__intro-rule-seal">
                        <i className="fa-solid fa-star"></i>
                      </div>
                      <span className="game__intro-rule-number">03</span>
                      <h3 className="game__intro-rule-title">
                        See your score based on distance from the Pothole!
                      </h3>
                    </article>
                  </section>

                  <section className="game__intro-stage">
                    <div className="game__intro-stage-frame">
                      <div className="game__playing-split game__intro-stage-split">
                        <PotholeViewer />
                        <FresnoMap />
                      </div>
                      <div className="game__intro-stage-overlay">
                        <div className="game__intro-stage-card">
                          <div className="game__intro-stage-icon">
                            <i className="fa-solid fa-compass"></i>
                          </div>
                          <h3 className="game__intro-stage-title">
                            Preview Today&apos;s Challenge
                          </h3>
                          <p className="game__intro-stage-desc">
                            Study the pothole. Search the city map. Lock in your
                            guess when you&apos;re ready.
                          </p>
                          <span className="game__intro-stage-status">
                            Ready when you are
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

            {/* PLAYING */}
            {phase === "PLAYING" && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="game__playing"
              >
                <div className="game__playing-info">
                  <i className="fa-solid fa-circle-info"></i>
                  {activePothole
                    ? `Playing past pothole from ${activePothole.date}`
                    : "Come on down... and click on the map!"}
                </div>
                <div className="game__playing-split">
                  <PotholeViewer />
                  <FresnoMap />
                </div>
              </motion.div>
            )}

            {/* SCORED */}
            {phase === "SCORED" && (
              <motion.div
                key="scored"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="game__scored"
              >
                <div className="game__scored-split">
                  <ScoreDisplay />
                  <FresnoMap />
                </div>
                <div className="game__scored-actions">
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToLeaderboard}
                    className="game__continue-btn"
                  >
                    SHOW ME THE LEADERBOARD <i className="fa-solid fa-arrow-right"></i>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* LEADERBOARD */}
            {phase === "LEADERBOARD" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="game__leaderboard"
              >
                <Leaderboard />

                <div className="game__leaderboard-lower">
                  <PastPotholes />

                  {/* Submit Pothole — Coming Soon */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="game__submit-pothole"
                  >
                    <div className="game__submit-pothole-badge">COMING SOON</div>
                    <h3 className="game__submit-pothole-title">
                      <i className="fa-solid fa-camera"></i> Know a Pothole?
                    </h3>
                    <p className="game__submit-pothole-desc">
                      Soon you&apos;ll be able to submit your own pothole photos
                      and coordinates to be featured as a Pothole of the Day
                    </p>
                    <button className="game__submit-pothole-btn" disabled>
                      <i className="fa-solid fa-upload"></i> Submit a Pothole
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="game__footer">
          <span>Fresno, California · Guess That Pothole © 2026</span>
        </footer>
      </div>
    </GameContext.Provider>
  );
}
