"use client";

import { useState, useEffect, act } from "react";
import { motion } from "framer-motion";
import { Trophy, Play } from "lucide-react";
import Confetti from "react-confetti";

export default function WinnerScreen({ winner, actualId }) {
  console.log(winner);
  const winnerName = winner.name;
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center p-4">
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}

      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="inline-block p-6 bg-yellow-500/20 rounded-full mb-6"
        >
          <Trophy className="w-16 h-16 text-yellow-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-bold text-white">
            ¡Felicidades {winnerName}!
          </h1>
          <p className="text-xl text-gray-300">
            {actualId === winner.id
              ? "¡Has ganado la partida!"
              : winnerName + " ha ganado la partida"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
