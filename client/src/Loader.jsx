"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function Loader() {
  const imageRef = useRef(null);
  const shimmerRef = useRef(null);

  // Efecto para aplicar la máscara al shimmer
  useEffect(() => {
    if (imageRef.current && shimmerRef.current) {
      // Usamos mix-blend-mode para que el shimmer solo afecte a las partes no transparentes
      shimmerRef.current.style.mixBlendMode = "soft-light";
      shimmerRef.current.style.pointerEvents = "none";
    }
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50"
      animate={"visible"}
      variants={{
        visible: { opacity: 1 },
        hidden: { opacity: 0, transition: { duration: 0.5 } },
      }}
      initial="visible"
      exit={{ opacity: 0 }}
    >
      <div className="relative w-48 h-48 mb-8">
        {/* Contenedor para la imagen y el efecto shimmer */}
        <div className="relative w-full h-full">
          {/* Imagen de la bomba usando img nativo */}
          <div
            ref={imageRef}
            className="relative w-full h-full flex items-center justify-center"
          >
            <img
              src="/images/loader.png"
              alt="Word Blast"
              className="max-w-full max-h-full object-contain"
              loading="eager"
            />
          </div>

          {/* Efecto shimmer que solo se aplica a la imagen */}
          <div
            ref={shimmerRef}
            className="absolute inset-0 overflow-hidden isolate"
            style={{
              maskImage: "url('/images/loader.png')",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: "url('/images/loader.png')",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
              animate={{
                x: ["calc(-100% - 50px)", "calc(100% + 50px)"],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 0.7,
                ease: "linear",
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
