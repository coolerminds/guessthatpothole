import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import GameContext from "./GameContext";

const FRESNO_CENTER: LatLngExpression = [36.7378, -119.7871];
const FRESNO_ZOOM = 12;

const guessIcon = new Icon({
  iconUrl: "/guess.png",
  iconSize: [56, 56],
  iconAnchor: [28, 56],
});

const answerIcon = new Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="%23c53030"/><circle cx="12" cy="12" r="5" fill="%23f0e6c8"/></svg>'
    ),
  iconSize: [30, 45],
  iconAnchor: [15, 45],
});

function MapClickHandler() {
  const { phase, setGuessPos } = useContext(GameContext);

  useMapEvents({
    click(e) {
      if (phase !== "PLAYING") return;
      setGuessPos([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}

export default function FresnoMap() {
  const { phase, guessPos, todaysPothole, handleGuess, score } =
    useContext(GameContext);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (phase === "SCORED") {
      // short delay to animate answer reveal
      const timer = setTimeout(() => setShowAnswer(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowAnswer(false);
    }
  }, [phase]);

  const answerPos: LatLngExpression = [todaysPothole.lat, todaysPothole.lng];

  const isInteracting = guessPos !== null || phase === "SCORED";

  return (
    <div className={`fresno-map ${isInteracting ? "fresno-map--active" : ""}`}>
      <div className="fresno-map__container">
        <MapContainer
          center={FRESNO_CENTER}
          zoom={FRESNO_ZOOM}
          minZoom={10}
          maxZoom={18}
          scrollWheelZoom={true}
          doubleClickZoom={false}
          attributionControl={false}
          className="fresno-map__leaflet"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler />

          {guessPos && (
            <Marker
              position={guessPos as LatLngExpression}
              icon={guessIcon}
            />
          )}

          {showAnswer && (
            <>
              <Marker position={answerPos} icon={answerIcon} />
              {guessPos && (
                <Polyline
                  positions={[guessPos as LatLngExpression, answerPos]}
                  pathOptions={{
                    color: "#FFD700",
                    weight: 3,
                    dashArray: "8 8",
                  }}
                />
              )}
            </>
          )}
        </MapContainer>
      </div>

      {phase === "PLAYING" && (
        <div className="fresno-map__guess-wrapper">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGuess}
            disabled={!guessPos}
            className={`fresno-map__guess-btn ${
              guessPos ? "fresno-map__guess-btn--active" : ""
            }`}
          >
            <i className="fa-solid fa-crosshairs"></i>{" "}
            {guessPos ? "LOCK IN GUESS!" : "Click the map to guess"}
          </motion.button>
        </div>
      )}
    </div>
  );
}
