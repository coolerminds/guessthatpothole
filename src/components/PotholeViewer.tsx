import { useContext } from "react";
import { motion } from "framer-motion";
import GameContext from "./GameContext";

export default function PotholeViewer() {
  const { todaysPothole } = useContext(GameContext);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="pothole-viewer"
    >
      <div className="pothole-viewer__badge">
        <i className="fa-solid fa-location-crosshairs"></i>
        <span>IDENTIFY THIS POTHOLE</span>
      </div>
      <div className="pothole-viewer__frame">
        <img
          src={todaysPothole.image}
          alt={`Pothole ${todaysPothole.id}`}
          className="pothole-viewer__img"
          draggable={false}
        />
      </div>
      {todaysPothole.hint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="pothole-viewer__hint"
        >
          <i className="fa-solid fa-lightbulb"></i>
          Hint: {todaysPothole.hint}
        </motion.div>
      )}
    </motion.div>
  );
}
