import { useContext } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
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
        <Image
          src={todaysPothole.image}
          alt={`Pothole ${todaysPothole.id}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="pothole-viewer__img"
          priority
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
