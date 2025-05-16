"use client";

import { Bomb, Heart, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GameBoardMobile({ room, inputWord, player }) {
  // Get visible players (all players, but highlight the current one)
  const playersReady = room.players.filter(
    (player) => player.isReady || player.role === "leader"
  );

  const currentPlayer = room.players.find(
    (player) => player.id === room.currentPlayerIndex
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Bomb Section with Lives on Top */}
      <div className="relative flex-none h-[35vh] flex flex-col items-center justify-center bg-gray-800/50">
        {/* Current Player Lives */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <div className="flex gap-2 justify-center">
              {Array.from({ length: player.lives }).map((_, i) => (
                <Heart
                  key={i}
                  className="w-3 h-3 text-red-500"
                  fill="currentColor"
                />
              ))}
              {player.maxLives - player.lives > -1 &&
                Array.from({
                  length: player.maxLives - player.lives,
                }).map((_, i) => (
                  <Heart
                    key={i}
                    className="w-3 h-3 text-gray-500"
                    fill="currentColor"
                  />
                ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bomb */}
        <div className="relative">
          <motion.div transition={{ duration: 0.5 }}>
            <Bomb className={`w-24 h-24 text-red-500 `} />
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                          text-4xl font-bold text-yellow-500"
            >
              {room.syllable}
            </div>
          </motion.div>

          {/* Current Word */}
          <AnimatePresence mode="wait">
            <motion.div
              key={player.id + "ss"}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 -bottom-8 flex items-center justify-center"
            >
              <div className="px-4 py-1 bg-gray-800/80 rounded-full">
                <span className="text-xl font-medium text-gray-200 block text-center min-w-[100px]">
                  {currentPlayer.currentWord || (
                    <span className="text-gray-600">Pensando...</span>
                  )}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Main Players Slider */}
      <div className="flex-none h-[30vh] flex items-center justify-center overflow-hidden px-4">
        <div className="relative w-full max-w-lg">
          <AnimatePresence mode="popLayout">
            <div className="flex justify-center gap-4">
              {playersReady.map((p, index) => (
                <motion.div
                  key={p.id + "ssasd"}
                  className={`w-28 shrink-0 ${
                    p.id === room.currentPlayerIndex
                      ? "scale-110 z-10"
                      : "scale-90 opacity-60"
                  }`}
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  {/* Player Number Badge */}
                  <div
                    className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-700 
                              flex items-center justify-center text-xs border-2 border-gray-600"
                  >
                    {index + 1}
                  </div>
                  <div
                    className={`p-3 rounded-lg transition-all duration-300
                    ${
                      p.id === room.currentPlayerIndex
                        ? "bg-gray-700 ring-2 ring-red-500"
                        : "bg-gray-800"
                    }
                    ${!p.isAlive ? "opacity-50" : "opacity-100"}`}
                  >
                    <div
                      className={`text-sm font-bold mb-2 truncate text-center
                      ${
                        p.id === room.currentPlayerIndex
                          ? "text-red-500"
                          : "text-white"
                      }`}
                    >
                      {p.name}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-0.5">
                        {Array.from({ length: p.lives }).map((_, i) => (
                          <Heart
                            key={i}
                            className="w-3 h-3 text-red-500"
                            fill="currentColor"
                          />
                        ))}
                        {p.maxLives - p.lives > -1 &&
                          Array.from({
                            length: p.maxLives - p.lives,
                          }).map((_, i) => (
                            <Heart
                              key={i}
                              className="w-3 h-3 text-gray-500"
                              fill="currentColor"
                            />
                          ))}
                      </div>
                      <div className="text-xs text-yellow-500 flex items-center gap-0.5">
                        <Crown className="w-3 h-3" />
                        {p.score}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          <div
            className={`flex-1 flex flex-col items-center justify-center px-4 pb-0 transition-opacity mt-6 ${
              player.isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm mx-auto bg-gray-800/80 rounded-2xl p-4 text-center mb-4"
            >
              <p className="text-2xl font-bold tracking-wider text-white min-h-[2.5rem]">
                <span className="text-gray-200">{inputWord}</span>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
