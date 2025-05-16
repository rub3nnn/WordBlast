"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SkipBackIcon as Backspace } from "lucide-react";
import { useEffect } from "react";

export function MobileKeyboard({
  onKeyPress,
  onBackspace,
  onSubmit,
  disabled = false,
}) {
  // Keyboard layout with Spanish characters
  const keyboardLayout = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"],
    ["⌫", "z", "x", "c", "v", "b", "n", "m", "⏎"],
  ];

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;

      if (e.key === "Backspace") {
        onBackspace();
      } else if (e.key === "Enter") {
        onSubmit();
      } else if (e.key.length === 1 && /^[a-záéíóúñ]$/i.test(e.key)) {
        onKeyPress(e.key.toLowerCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress, onBackspace, onSubmit, disabled]);

  // Try to trigger haptic feedback
  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleKeyPress = (key) => {
    if (disabled) return;
    triggerHaptic();
    onKeyPress(key);
  };

  const handleBackspace = () => {
    if (disabled) return;
    triggerHaptic();
    onBackspace();
  };

  const handleSubmit = () => {
    if (disabled) return;
    triggerHaptic();
    onSubmit();
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed inset-x-0 bottom-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 py-4 shadow-lg z-50"
      style={{ maxWidth: "100vw", boxSizing: "border-box" }}
    >
      <div className="w-full px-1 space-y-1">
        {/* Regular keys */}
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1 px-1">
            {row.map((key) => (
              <motion.button
                key={key}
                onClick={() =>
                  key === "⌫"
                    ? handleBackspace()
                    : key === "⏎"
                    ? handleSubmit()
                    : handleKeyPress(key)
                }
                disabled={disabled}
                whileTap={{ scale: 0.95 }}
                className={`relative h-12 flex-1
                ${
                  key === "⌫"
                    ? "max-w-[4rem]"
                    : key === "⏎"
                    ? "max-w-[4rem]"
                    : "min-w-[2rem]"
                }
                rounded-xl font-medium text-lg
                transition-colors duration-150
                ${
                  disabled
                    ? "bg-gray-800/50 text-gray-500"
                    : key === "⌫"
                    ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 active:bg-red-500/40"
                    : key === "⏎"
                    ? "bg-red-500 text-white hover:bg-red-600 active:bg-red-700"
                    : "bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white"
                }`}
              >
                {key === "⌫" ? (
                  <Backspace className="w-5 h-5 mx-auto" />
                ) : key === "⏎" ? (
                  "Enviar"
                ) : (
                  key
                )}
                {/* Key press effect */}
                <AnimatePresence>
                  {!disabled && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      whileTap={{ scale: 1.5, opacity: 0 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute inset-0 bg-white rounded-xl pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
