"use client";

import React from "react";
import { Bomb, Heart, Crown, ChevronRight } from "lucide-react";

export function GameBoard({ time, syllable, currentPlayerIndex, players }) {
  const playersReady = players.filter(
    (player) => player.isReady || player.role === "leader"
  );

  const getPlayerPosition = (id) => {
    const radius = 35;
    const index = playersReady.findIndex((player) => player.id === id);
    const angle = (index * 360) / playersReady.length;
    const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
    const y = radius * Math.sin((angle - 90) * (Math.PI / 180));
    return { x, y, angle };
  };

  const getPlayer = (id) => {
    return players.find((o) => o.id === id);
  };

  return (
    <div className="relative w-max-[800px] h-[700px]">
      {/* Rotating Arrow Icon */}
      <div
        className="absolute top-1/2 left-1/2 w-[320px] transform -translate-x-1/2 -translate-y-1/2 origin-center
                         flex items-center justify-end pointer-events-none"
        style={{
          transform: `translate(0%, -50%) rotate(${
            getPlayerPosition(currentPlayerIndex).angle - 90
          }deg)`,
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <ChevronRight className="w-8 h-8 text-white" strokeWidth={3} />
      </div>
      {/* Center Bomb */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      w-40 h-40 bg-gray-800 rounded-full flex items-center justify-center z-30"
      >
        <div className="relative">
          <img
            src="/images/icon.png"
            className={`w-26 h-26 ml-8 mb-2 text-red-500 animate-pulse ${
              time < 3 ? "animate-bounce" : ""
            }`}
          />
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                          text-2xl font-bold text-yellow-500"
          >
            {syllable}
          </div>
        </div>
        <div className="absolute bottom-2 text-xl font-mono text-white bg-gray-800 px-1 rounded-lg">
          {getPlayer(currentPlayerIndex)?.currentWord}
        </div>
      </div>

      {/* Players */}
      {players.map((player, index) => {
        if (!player.isReady && player.role !== "leader") {
          return;
        }
        const { x, y } = getPlayerPosition(player.id);
        const isActive = player.isActive;
        const isAlive = player.isAlive;

        return (
          <div
            key={index + 1}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                        transition-all duration-300 ease-in-out
                        ${isActive ? "scale-110 z-20" : "scale-100 z-10"}`}
            style={{
              left: `${50 + x}%`,
              top: `${50 + y}%`,
            }}
          >
            <div
              className={`p-2 rounded-lg transition-all duration-300
                ${
                  isActive
                    ? "bg-gray-700 ring-2 ring-red-500"
                    : "bg-gray-800 hover:bg-gray-700"
                }
                ${!isAlive ? "opacity-50" : "opacity-100"}
                w-24 transform rotate-0`}
            >
              {/* Player Number Badge */}
              <div
                className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-700 
                              flex items-center justify-center text-xs border-2 border-gray-600"
              >
                {index + 1}
              </div>

              <div
                className={`text-sm font-bold mb-1 truncate ${
                  isAlive ? "text-white" : "text-red-500"
                }`}
              >
                {player.name}
              </div>

              {/* Lives and Score */}
              <div className="flex justify-between items-center mb-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: player.lives }).map((_, i) => (
                    <Heart
                      key={i}
                      className="w-3 h-3 text-red-500"
                      fill="currentColor"
                    />
                  ))}
                  {player.maxLives - player.lives > -1 &&
                    Array.from({ length: player.maxLives - player.lives }).map(
                      (_, i) => (
                        <Heart
                          key={i}
                          className="w-3 h-3 text-gray-500"
                          fill="currentColor"
                        />
                      )
                    )}
                </div>
                <div className="text-xs text-yellow-500 flex items-center gap-0.5">
                  <Crown className="w-3 h-3" />
                  {player.score}
                </div>
              </div>

              {/* Current Word - Only shown for active player */}
              {isActive && (
                <div className="text-green-500 font-mono text-xs truncate min-h-[1.2em]">
                  {player.currentWord}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
