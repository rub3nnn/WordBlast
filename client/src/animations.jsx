"use client";

import { motion } from "framer-motion";

export const ExplosionParticle = ({ angle, delay }) => (
  <motion.div
    className="absolute w-2 h-2 bg-red-500 rounded-full"
    initial={{ scale: 0 }}
    animate={{
      scale: [1, 0],
      x: [0, Math.cos(angle) * 100],
      y: [0, Math.sin(angle) * 100],
    }}
    transition={{
      duration: 0.6,
      delay,
      ease: "easeOut",
    }}
  />
);

export const SuccessParticle = ({ delay, x }) => (
  <motion.div
    className="absolute w-1 h-1 bg-green-500 rounded-full"
    initial={{ y: 0, opacity: 1 }}
    animate={{
      y: -100,
      opacity: 0,
      x: x,
    }}
    transition={{
      duration: 0.8,
      delay,
      ease: "easeOut",
    }}
  />
);

export const ExplosionEffect = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {Array.from({ length: 12 }).map((_, i) => (
      <ExplosionParticle
        key={i}
        angle={(i * Math.PI * 2) / 12}
        delay={i * 0.02}
      />
    ))}
  </div>
);

export const SuccessEffect = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {Array.from({ length: 15 }).map((_, i) => (
      <SuccessParticle key={i} delay={i * 0.05} x={(i - 7) * 10} />
    ))}
  </div>
);
